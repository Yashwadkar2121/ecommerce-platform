// utils/jwt.js - UPDATED VERSION
const jwt = require("jsonwebtoken");

const generateTokens = (userId, role) => {
  // 🚨 CRITICAL FIX: Use 'id' field to match your middleware expectation
  const accessToken = jwt.sign(
    { id: userId, role }, // Use 'id' instead of 'userId'
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId, role }, // Use 'id' instead of 'userId'
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  return decoded;
};

module.exports = { generateTokens, verifyRefreshToken };
