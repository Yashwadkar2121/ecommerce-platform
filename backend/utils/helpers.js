const crypto = require("crypto");

// Generate random string for order tracking
const generateTrackingNumber = () => {
  return `TRK${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
};

// Generate random string for transaction IDs
const generateTransactionId = () => {
  return `TXN${Date.now()}${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// Format currency
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
  return input;
};

// Calculate order totals
const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

module.exports = {
  generateTrackingNumber,
  generateTransactionId,
  formatCurrency,
  isValidEmail,
  paginate,
  sanitizeInput,
  calculateOrderTotal,
};
