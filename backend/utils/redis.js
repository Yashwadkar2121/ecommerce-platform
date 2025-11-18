const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.log("❌ Redis Client Error", err));
client.on("connect", () => console.log("✅ Redis Client Connected"));

const connectRedis = async () => {
  await client.connect();
};

// Fixed Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Check if Redis is connected
      if (!client.isOpen) {
        console.log("Redis not connected, skipping cache");
        return next();
      }

      const cachedData = await client.get(key);
      if (cachedData) {
        // console.log("✅ Serving from cache:", key);
        return res.json(JSON.parse(cachedData));
      }

      // Store the original send method
      const originalSend = res.send;
      const originalJson = res.json;

      // Override res.json to cache response
      res.json = function (data) {
        // Only cache successful responses (200 status)
        if (res.statusCode === 200) {
          client
            .setEx(key, duration, JSON.stringify(data))
            .catch((err) => console.error("Redis set error:", err));
        }
        originalJson.call(this, data);
      };

      // Also override res.send for other response types
      res.send = function (data) {
        if (res.statusCode === 200 && typeof data === "string") {
          try {
            // Try to parse as JSON to cache it
            const jsonData = JSON.parse(data);
            client
              .setEx(key, duration, JSON.stringify(jsonData))
              .catch((err) => console.error("Redis set error:", err));
          } catch (e) {
            // Not JSON, don't cache
          }
        }
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

module.exports = { client, connectRedis, cache };
