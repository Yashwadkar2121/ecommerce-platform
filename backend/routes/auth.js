const express = require("express");
const {
  register,
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");
const { validateRegistration } = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", validateRegistration, register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);

module.exports = router;
