const express = require("express");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
  getProductCategories,
  getProductBrands,
  addProductReview,
} = require("../controllers/productController");
const { authenticate, authorize } = require("../middleware/auth");
const { cache } = require("../utils/redis");

const router = express.Router();

// Public routes (GET routes first)
router.get("/", cache(300), getProducts); // Cache for 5 minutes
router.get("/categories", cache(3600), getProductCategories); // Cache for 1 hour
router.get("/brands", cache(3600), getProductBrands); // Cache for 1 hour
router.get("/:productId", cache(300), getProductById);

// Protected routes for product management (admin only)
router.post("/", authenticate, authorize("admin"), createProduct);
router.put("/:productId", authenticate, authorize("admin"), updateProduct);
router.delete("/:productId", authenticate, authorize("admin"), deleteProduct);

// Protected routes for reviews
router.post("/:productId/reviews", authenticate, addProductReview);

module.exports = router;
