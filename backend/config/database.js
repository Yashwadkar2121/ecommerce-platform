// backend/config/database.js
//
// Connects to the SQL database (users, orders, payments).
//
//  - Production / cloud: set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
//    Works with TiDB Cloud (MySQL-compatible, port 4000) and any other MySQL
//    server. TLS is on by default because managed databases require it.
//  - Local development: if DB_HOST is not set (or the remote database cannot be
//    reached and NODE_ENV is not "production"), it falls back to a local MySQL
//    using the LOCAL_DB_* variables and creates the database if needed.
const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

let sequelize; // shared instance, created by connectMySQL()

const toBool = (value, fallback) =>
  value === undefined || value === "" ? fallback : String(value).toLowerCase() === "true";

const createSequelizeInstance = (config) =>
  new Sequelize(config.name, config.user, config.password, {
    host: config.host,
    port: Number(config.port),
    dialect: "mysql",
    dialectOptions: config.ssl
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: config.rejectUnauthorized,
          },
        }
      : {},
    // Small pool: serverless platforms start many short-lived instances and
    // free database tiers allow only a limited number of connections.
    pool: {
      max: Number(process.env.DB_POOL_MAX || 5),
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
    logging: false,
  });

// Create the database if it does not exist (local only)
const createDatabaseIfNotExists = async (config) => {
  const connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.name}\`;`);
  await connection.end();
};

const connectMySQL = async () => {
  if (sequelize) return sequelize; // already connected (warm serverless instance)

  const remoteConfig = process.env.DB_HOST
    ? {
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        ssl: toBool(process.env.DB_SSL, true),
        rejectUnauthorized: toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
      }
    : null;

  const localConfig = {
    name: process.env.LOCAL_DB_NAME || "ecommerce_db",
    user: process.env.LOCAL_DB_USER || "root",
    password: process.env.LOCAL_DB_PASSWORD || "",
    host: process.env.LOCAL_DB_HOST || "localhost",
    port: process.env.LOCAL_DB_PORT || 3306,
    ssl: false,
  };

  const isProduction = process.env.NODE_ENV === "production";

  if (remoteConfig) {
    try {
      const instance = createSequelizeInstance(remoteConfig);
      await instance.authenticate();
      sequelize = instance;
      console.log(`✅ SQL database connected (${remoteConfig.host})`);
      return sequelize;
    } catch (error) {
      if (isProduction) {
        // Never silently fall back to "localhost" on a server.
        throw new Error(`SQL database connection failed: ${error.message}`);
      }
      console.warn("⚠️  Remote SQL connection failed:", error.message);
      console.log("🔄 Trying local MySQL...");
    }
  }

  await createDatabaseIfNotExists(localConfig);
  sequelize = createSequelizeInstance(localConfig);
  await sequelize.authenticate();
  console.log("✅ MySQL (Local) connected successfully");
  return sequelize;
};

const getSequelize = () => sequelize;

module.exports = { connectMySQL, getSequelize };
