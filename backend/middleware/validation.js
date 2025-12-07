const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

const validateRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address")
    .custom(async (email) => {
      const User = require("../models/mysql/User");
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error("Email already registered");
      }
      return true;
    }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  // REMOVE or simplify the pattern validation
  body("firstName")
    .notEmpty()
    .trim()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .notEmpty()
    .trim()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("phone")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be exactly 10 digits")
    .custom(async (phone, { req }) => {
      if (!phone) return true;

      const User = require("../models/mysql/User");
      const existingUser = await User.findOne({
        where: { phone },
        attributes: ["id", "email"],
      });

      if (existingUser) {
        throw new Error("Phone number already registered to another account");
      }
      return true;
    }),
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

      const User = require("../models/mysql/User");
      const existingUser = await User.findOne({
        where: { phone },
        attributes: ["id", "email"],
      });

      // If phone exists and belongs to a different user
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  handleValidationErrors,
];

const validateProduct = [
  body("name").notEmpty().trim().withMessage("Product name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").notEmpty().trim().withMessage("Category is required"),
  body("brand").notEmpty().trim().withMessage("Brand is required"),
  body("inventory")
    .isInt({ min: 0 })
    .withMessage("Inventory must be a positive integer"),
  body("subcategory").optional().trim(),
  body("images").optional().isArray(),
  body("attributes").optional().isObject(),
  body("tags").optional().isArray(),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateProduct,
  validateProfileUpdate,
  validatePasswordChange,
  handleValidationErrors,
};
