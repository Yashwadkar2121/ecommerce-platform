// backend/middleware/validations/authValidation.js
const { body } = require("express-validator");
const { handleValidationErrors } = require("./commonValidation");

const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("firstName").notEmpty().isLength({ min: 3, max: 50 }),
  body("lastName").notEmpty().isLength({ min: 3, max: 50 }),
  body("phone")
    .optional({ nullable: true, checkFalsy: true }) // Allow empty/null
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be exactly 10 digits"),
  handleValidationErrors,
];

const validateProfileUpdate = [
  body("firstName")
    .optional()
    .notEmpty()
    .trim()
    .withMessage("First name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .notEmpty()
    .trim()
    .withMessage("Last name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be exactly 10 digits")
    .custom(async (phone, { req }) => {
      if (!phone) return true;

      const User = require("../../models/mysql/User");
      const existingUser = await User.findOne({
        where: { phone },
        attributes: ["id", "email"],
      });

      if (existingUser && existingUser.id !== req.user.id) {
        throw new Error("Phone number already registered to another account");
      }
      return true;
    }),
  handleValidationErrors,
];

const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateForgotPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  handleValidationErrors,
];

const validateVerifyOTP = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .matches(/^[0-9]{6}$/)
    .withMessage("OTP must contain only numbers"),
  handleValidationErrors,
];

const validateResendOTP = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  handleValidationErrors,
];

const validateResetPassword = [
  body("resetToken").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateProfileUpdate,
  validatePasswordChange,
  validateLogin,
  validateForgotPassword,
  validateVerifyOTP,
  validateResendOTP,
  validateResetPassword,
};
