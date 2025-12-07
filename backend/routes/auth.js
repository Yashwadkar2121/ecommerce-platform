// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateRegistration,
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middleware/validation");

// Public routes
router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);

// Phone availability check (public)
router.get("/check-phone/:phone", authController.checkPhoneAvailability);

// Protected routes (require authentication)
router.get("/profile", authenticate, authController.getProfile);
router.put(
  "/profile",
  authenticate,
  validateProfileUpdate,
  authController.updateProfile
);
router.put(
  "/change-password",
  authenticate,
  validatePasswordChange,
  authController.changePassword
);

module.exports = router;
