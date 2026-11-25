// routes/admin.js
const express = require("express");
const {
  // Product Management
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,

  // Order Management
  adminGetOrders,
  adminUpdateOrder,

  // User Management
  adminGetUsers,
  adminUpdateUser,

  // Dashboard
  getDashboardStats,
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");
const {
  validateProductCreate,
  validateProductUpdate,
} = require("../middleware/validations/productValidation");
const { getUploadSignature } = require("../controllers/uploadController");
const { description } = require("../controllers/aiController");
const { aiGuard } = require("../middleware/rateLimit");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// Product Management
router.get("/products", adminGetProducts);
router.post("/products", validateProductCreate, adminCreateProduct);
router.put("/products/:productId", validateProductUpdate, adminUpdateProduct);
router.delete("/products/:productId", adminDeleteProduct);

// Image uploads (browser uploads straight to Cloudinary using this signature)
router.get("/uploads/signature", getUploadSignature);

// AI helper for the product form
router.post("/ai/description", aiGuard("description"), description);

// Order Management
router.get("/orders", adminGetOrders);
router.put("/orders/:orderId", adminUpdateOrder);

// User Management
router.get("/users", adminGetUsers);
router.put("/users/:userId", adminUpdateUser);

module.exports = router;
