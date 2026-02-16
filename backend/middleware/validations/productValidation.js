// middlewares/validation/productValidation.js
const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("./commonValidation");

const validateProductCreate = [
  body("name")
    .notEmpty()
    .trim()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Product name must be between 3 and 200 characters"),
  body("description")
    .notEmpty()
    .trim()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number greater than 0"),
  body("category")
    .notEmpty()
    .trim()
    .withMessage("Category is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters"),
  body("brand")
    .notEmpty()
    .trim()
    .withMessage("Brand is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Brand must be between 2 and 100 characters"),
  body("inventory")
    .isInt({ min: 0 })
    .withMessage("Inventory must be a positive integer"),
  body("subcategory")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subcategory cannot exceed 100 characters"),
  body("images")
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage("Images must be an array with 1-10 items"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Tags must be an array with max 20 items"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

const validateProductUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Product name must be between 3 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number greater than 0"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters"),
  body("brand")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Brand must be between 2 and 100 characters"),
  body("inventory")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Inventory must be a positive integer"),
  body("subcategory")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subcategory cannot exceed 100 characters"),
  body("images")
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage("Images must be an array with 1-10 items"),
  body("attributes")
    .optional()
    .isObject()
    .withMessage("Attributes must be an object"),
  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Tags must be an array with max 20 items"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

const validateProductId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
  handleValidationErrors,
];

const validateProductQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category cannot exceed 100 characters"),
  query("brand")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Brand cannot exceed 100 characters"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number"),
  query("sortBy")
    .optional()
    .isIn(["name", "price", "createdAt", "popularity"])
    .withMessage("Invalid sort field"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be 'asc' or 'desc'"),
  handleValidationErrors,
];

module.exports = {
  validateProductCreate,
  validateProductUpdate,
  validateProductId,
  validateProductQuery,
};
