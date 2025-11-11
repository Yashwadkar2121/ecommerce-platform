const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

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
            rejectUnauthorized: false, // Aiven uses self-signed SSL
          },
        }
      : {},
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });

// Function to create database if not exists (local only)
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

// Main connection function
const connectMySQL = async () => {
  // 🌐 Aiven Cloud MySQL configuration
  const aivenConfig = {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    ssl: true,
  };

  // 💻 Local MySQL configuration
  const localConfig = {
    name: process.env.LOCAL_DB_NAME,
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
    host: process.env.LOCAL_DB_HOST || "localhost",
    port: process.env.LOCAL_DB_PORT || 3306,
    ssl: false,
  };

  let sequelize = createSequelizeInstance(aivenConfig);

  try {
    // Aiven connection (no DB creation)
    await sequelize.authenticate();
    console.log("✅ MySQL (Aiven) connected successfully");
  } catch (error) {
    console.warn("⚠️ Aiven connection failed:", error.message);
    console.log("🔄 Trying local MySQL...");

    sequelize = createSequelizeInstance(localConfig);
    try {
      // Only create DB locally
      await createDatabaseIfNotExists(localConfig);
      await sequelize.authenticate();
      console.log("✅ MySQL (Local) connected successfully");
    } catch (err) {
      console.error("❌ Local MySQL connection error:", err.message);
      process.exit(1);
    }
  }

  return sequelize;
};

module.exports = { connectMySQL };
