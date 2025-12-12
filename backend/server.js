const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const express = require("express");
const { connectMySQL, getSequelize } = require("./config/database");
const connectMongoDB = require("./config/mongodb");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
    const adminRoutes = require("./routes/admin");

    app.use("/api/auth", authRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/admin", adminRoutes);

    // ⭐  CATCH-ALL ROUTE FOR 404 ERRORS
    app.use((req, res, next) => {
      const error = new Error(`Not Found - ${req.originalUrl}`);
      error.statusCode = 404;
      next(error);
    });

    // ⭐  ADD ERROR HANDLER MIDDLEWARE
    app.use(errorHandler);

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
