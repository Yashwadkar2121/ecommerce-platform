const express = require("express");
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { validateRegistration } = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);
router.post("/logout", authenticate, logout);

module.exports = router;
