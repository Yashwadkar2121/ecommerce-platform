const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const express = require("express");
const { connectMySQL, getSequelize } = require("./config/database");
const connectMongoDB = require("./config/mongodb");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1️⃣ Connect MySQL first
    await connectMySQL();

    // 2️⃣ Now that MySQL is connected, safely import routes
    const authRoutes = require("./routes/auth");
    const orderRoutes = require("./routes/orders");
    app.use("/api/auth", authRoutes);
    app.use("/api/orders", orderRoutes);

    // 3️⃣ Optionally sync MySQL models
    const sequelize = getSequelize();
    await sequelize.sync();

    // 4️⃣ Connect MongoDB
    await connectMongoDB();

    // 5️⃣ Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
