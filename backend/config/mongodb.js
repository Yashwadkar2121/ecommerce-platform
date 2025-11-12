const mongoose = require("mongoose");

const connectMongoDB = async () => {
  const atlasURI = process.env.MONGODB_URI_ATLAS;
  const localURI = process.env.MONGODB_URI_LOCAL;

  // Use Atlas first, fallback to local
  const uri = atlasURI || localURI;

  try {
    await mongoose.connect(uri);
    if (uri === atlasURI) {
      console.log("✅ MongoDB (Atlas) connected successfully");
    } else {
      console.log("✅ MongoDB (Local) connected successfully");
    }
  } catch (error) {
    if (uri === atlasURI && localURI) {
      console.warn("⚠️  MongoDB (Atlas) connection failed:", error.message);
      console.log("🔄 Trying local MongoDB...");
      try {
        await mongoose.connect(localURI);
        console.log("✅ MongoDB (Local) connected successfully");
      } catch (err) {
        console.error("❌ MongoDB (Local) connection error:", err.message);
        process.exit(1);
      }
    } else {
      console.error("❌ MongoDB connection error:", error.message);
      process.exit(1);
    }
  }
};

module.exports = connectMongoDB;
