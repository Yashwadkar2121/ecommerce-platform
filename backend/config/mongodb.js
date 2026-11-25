// backend/config/mongodb.js
//
// Connects to MongoDB (products, reviews, sessions).
//  - MONGODB_URI_ATLAS : MongoDB Atlas connection string (used first)
//  - MONGODB_URI_LOCAL : local MongoDB (development fallback only)
// It throws on failure instead of exiting, so the caller decides what to do
// (the local server exits; a serverless function returns a 503).
const mongoose = require("mongoose");

const OPTIONS = {
  serverSelectionTimeoutMS: 8000, // fail fast instead of hanging for 30s
  maxPoolSize: 10,
};

const connectMongoDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection; // already connected

  const atlasURI = process.env.MONGODB_URI_ATLAS;
  const localURI = process.env.MONGODB_URI_LOCAL;
  const isProduction = process.env.NODE_ENV === "production";

  if (!atlasURI && !localURI) {
    throw new Error("Set MONGODB_URI_ATLAS (or MONGODB_URI_LOCAL for development)");
  }

  if (atlasURI) {
    try {
      await mongoose.connect(atlasURI, OPTIONS);
      console.log("✅ MongoDB (Atlas) connected successfully");
      return mongoose.connection;
    } catch (error) {
      if (isProduction || !localURI) {
        throw new Error(`MongoDB (Atlas) connection failed: ${error.message}`);
      }
      console.warn("⚠️  MongoDB (Atlas) connection failed:", error.message);
      console.log("🔄 Trying local MongoDB...");
    }
  }

  await mongoose.connect(localURI, OPTIONS);
  console.log("✅ MongoDB (Local) connected successfully");
  return mongoose.connection;
};

module.exports = connectMongoDB;
