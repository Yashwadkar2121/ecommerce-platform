const { ValidationError } = require("sequelize");
const { MongoError } = require("mongodb");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Sequelize validation error
  if (err instanceof ValidationError) {
    const messages = err.errors.map((error) => error.message);
    return res.status(400).json({
      error: "Validation Error",
      details: messages,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return res.status(400).json({
      error: "Duplicate Field",
      details: [message],
    });
  }

  // MongoDB error
  if (err instanceof MongoError) {
    return res.status(500).json({
      error: "Database Error",
      details: ["A database error occurred"],
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid Token",
      details: ["Invalid authentication token"],
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token Expired",
      details: ["Authentication token has expired"],
    });
  }

  // Stripe errors
  if (err.type && err.type.startsWith("Stripe")) {
    return res.status(400).json({
      error: "Payment Error",
      details: [err.message],
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: error.message || "Server Error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
