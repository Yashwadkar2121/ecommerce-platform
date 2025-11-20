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
const { validateProduct } = require("../middleware/validation");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// Product Management
router.get("/products", adminGetProducts);
router.post("/products", validateProduct, adminCreateProduct);
router.put("/products/:productId", adminUpdateProduct);
router.delete("/products/:productId", adminDeleteProduct);

// Order Management
router.get("/orders", adminGetOrders);
router.put("/orders/:orderId", adminUpdateOrder);

// User Management
router.get("/users", adminGetUsers);
router.put("/users/:userId", adminUpdateUser);

module.exports = router;
