const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

let sequelize; // Global variable

// Function to create Sequelize instance
const createSequelizeInstance = (config) =>
  new Sequelize(config.name, config.user, config.password, {
    host: config.host,
    port: config.port,
    dialect: "mysql",
    dialectOptions: config.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    logging: false,
  });

// Create database if not exists (local only)
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

// Connect to MySQL
const connectMySQL = async () => {
  const aivenConfig = {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    ssl: true,
  };

  const localConfig = {
    name: process.env.LOCAL_DB_NAME,
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
    host: process.env.LOCAL_DB_HOST || "localhost",
    port: process.env.LOCAL_DB_PORT || 3306,
    ssl: false,
  };

  try {
    sequelize = createSequelizeInstance(aivenConfig);
    await sequelize.authenticate();
    console.log("✅ MySQL (Aiven) connected successfully");
  } catch (error) {
    console.warn("⚠️  Aiven connection failed:", error.message);
    console.log("🔄 Trying local MySQL...");

    await createDatabaseIfNotExists(localConfig);
    sequelize = createSequelizeInstance(localConfig);
    await sequelize.authenticate();
    console.log("✅ MySQL (Local) connected successfully");
  }

  return sequelize;
};

const getSequelize = () => sequelize;

module.exports = { connectMySQL, getSequelize };
