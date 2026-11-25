// backend/server.js
//
// One Express app that runs in two places:
//   - locally:  `npm run dev`  (listens on PORT)
//   - Vercel:   the file exports the app, Vercel runs it as a serverless function
//
// Databases are connected lazily, once per instance, on the first request.
// Routes are loaded only after the connections exist because the SQL models
// need the Sequelize instance when they are required.
const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { connectMySQL, getSequelize } = require("./config/database");
const connectMongoDB = require("./config/mongodb");
const { connectRedis } = require("./utils/redis");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter, authLimiter } = require("./middleware/rateLimit");

const app = express();

// Behind Vercel's proxy: needed for correct client IPs (rate limiting)
app.set("trust proxy", 1);
app.use(helmet());

// FRONTEND_URL can hold several origins separated by commas
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) =>
      // no Origin header = server-to-server call (Stripe webhook, curl)
      callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stripe signs the RAW body, so the webhook path must be parsed with
// express.raw() BEFORE express.json() touches it.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

// Health checks work even if a database is down
const health = (req, res) =>
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
app.get("/", health);
app.get("/api/health", health);

app.use("/api", apiLimiter);

const buildApiRouter = async () => {
  await connectMySQL();
  await connectMongoDB();
  await connectRedis();
  console.log("✅ Redis connected successfully");

  const router = express.Router();

  router.use(
    [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/verify-otp",
      "/api/auth/resend-otp",
      "/api/auth/reset-password",
    ],
    authLimiter,
  );

  router.use("/api/auth", require("./routes/authRoutes"));
  router.use("/api/orders", require("./routes/orders"));
  router.use("/api/payments", require("./routes/payments"));
  router.use("/api/products", require("./routes/productsRoutes"));
  router.use("/api/cart", require("./routes/cart"));
  router.use("/api/admin", require("./routes/adminRoutes"));
  router.use("/api/ai", require("./routes/aiRoutes"));

  // Tables: created automatically in development. In production run
  // `npm run db:sync` once (or set DB_SYNC=true) instead of on every cold start.
  const syncSetting = process.env.DB_SYNC;
  const shouldSync =
    syncSetting === "true" ||
    (syncSetting !== "false" && process.env.NODE_ENV !== "production");
  if (shouldSync) {
    require("./models/mysql/User"); // loads Order, OrderItem and Payment too
    require("./models/mysql/PasswordResetToken");
    await getSequelize().sync();
  }

  return router;
};

let routerPromise = null;
const getApiRouter = () => {
  if (!routerPromise) {
    routerPromise = buildApiRouter().catch((error) => {
      routerPromise = null; // try again on the next request
      throw error;
    });
  }
  return routerPromise;
};

app.use(async (req, res, next) => {
  try {
    const router = await getApiRouter();
    router(req, res, next);
  } catch (error) {
    console.error("❌ Startup error:", error.message);
    res.status(503).json({
      error: "Service temporarily unavailable. Please try again shortly.",
    });
  }
});

// 404 for anything that no route handled
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

// Local development: start listening
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  getApiRouter()
    .then(() => {
      app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    })
    .catch((error) => {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    });
}

module.exports = app;
