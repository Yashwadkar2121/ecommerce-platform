const dotenv = require("dotenv");
dotenv.config({ quiet: true }); // Load environment variables quiet is set to true to avoid warnings if .env file is missing

const express = require("express");
const { connectMySQL } = require("./config/database");
const connectMongoDB = require("./config/mongodb");

const app = express();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectMySQL();
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch 
  (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();