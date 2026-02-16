// routes/products.js
const express = require("express");
const {
  getProducts,
  getProductById,
  getProductCategories,
  getProductBrands,
  addProductReview,
  getBrandsByCategory,
  searchProducts,
  getRelatedProducts,
} = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");
const { cache } = require("../utils/redis");

const router = express.Router();

// Public routes (GET routes first)
router.get("/", cache(300), getProducts); // Cache for 5 minutes
router.get("/categories", cache(3600), getProductCategories); // Cache for 1 hour
router.get("/brands", cache(3600), getProductBrands); // Cache for 1 hour
router.get("/search", cache(60), searchProducts); // Cache for 1 minute (search results change frequently)
router.get("/:productId", cache(300), getProductById);
router.get("/:productId/related", cache(300), getRelatedProducts); // Cache for 5 minutes
router.get("/brands-by-category", cache(3600), getBrandsByCategory);

// Protected routes for reviews
router.post("/:productId/reviews", authenticate, addProductReview);

module.exports = router;
