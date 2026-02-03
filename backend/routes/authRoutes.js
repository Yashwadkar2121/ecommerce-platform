// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  // Public routes
  register,
  login,
  forgotPassword,
  verifyOTP,
  resendOTP,
  resetPassword,
  refreshToken,
  logout,
  // Phone & Email availability check (public)
  checkPhoneAvailability,
  checkEmailAvailability,
  // Protected routes (require authentication)
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateRegistration,
  validateProfileUpdate,
  validatePasswordChange,
  validateLogin,
  validateForgotPassword,
  validateVerifyOTP,
  validateResendOTP,
  validateResetPassword,
} = require("../middleware/validations/authValidation");

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/verify-otp", validateVerifyOTP, verifyOTP);
router.post("/resend-otp", validateResendOTP, resendOTP);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);

// Phone & Email availability check (public)
router.get("/check-phone/:phone", checkPhoneAvailability);
router.get("/check-email/:email", checkEmailAvailability);

// Protected routes (require authentication)
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, validateProfileUpdate, updateProfile);
router.put(
  "/change-password",
  authenticate,
  validatePasswordChange,
  changePassword,
);

module.exports = router;
