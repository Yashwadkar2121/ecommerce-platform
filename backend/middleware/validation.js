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
  body("name").notEmpty().trim(),
  body("description").notEmpty().trim(),
  body("price").isFloat({ min: 0 }),
  body("category").notEmpty().trim(),
  body("inventory").isInt({ min: 0 }),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateProduct,
  handleValidationErrors,
};
