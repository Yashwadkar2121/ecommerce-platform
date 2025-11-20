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
    // 1️⃣ Connect MySQL
    await connectMySQL();

    // 2️⃣ Connect MongoDB
    await connectMongoDB();

    // ⭐ Connect Redis
    const { connectRedis } = require("./utils/redis");
    await connectRedis();
    console.log("✅ Redis connected successfully");

    // 5️⃣ Import routes
    const authRoutes = require("./routes/auth");
    const orderRoutes = require("./routes/orders");
    const paymentRoutes = require("./routes/payments");
    const productRoutes = require("./routes/products");
    const cartRoutes = require("./routes/cart");

    app.use("/api/auth", authRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/cart", cartRoutes);

    // 6️⃣ Sync MySQL
    const sequelize = getSequelize();
    await sequelize.sync();

    // 7️⃣ Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
