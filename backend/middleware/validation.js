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
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("firstName").notEmpty().trim(),
  body("lastName").notEmpty().trim(),
  handleValidationErrors,
];

const validateProduct = [
  body("name").notEmpty().trim().withMessage("Product name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").notEmpty().trim().withMessage("Category is required"),
  body("brand").notEmpty().trim().withMessage("Brand is required"), // Added brand validation
  body("inventory")
    .isInt({ min: 0 })
    .withMessage("Inventory must be a positive integer"),
  // Optional fields - no validation needed
  body("subcategory").optional().trim(),
  body("images").optional().isArray(),
  body("attributes").optional().isObject(),
  body("tags").optional().isArray(),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateProduct,
  handleValidationErrors,
};
