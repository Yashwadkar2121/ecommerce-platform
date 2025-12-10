const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  forgotPassword,
  verifyOTP,
  resendOTP,
  resetPassword,
  checkPhoneAvailability,
  
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateRegistration,
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middleware/validation");

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);

// Phone availability check (public)
router.get("/check-phone/:phone", checkPhoneAvailability);

// Protected routes (require authentication)
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, validateProfileUpdate, updateProfile);
router.put(
  "/change-password",
  authenticate,
  validatePasswordChange,
  changePassword
);

module.exports = router;
