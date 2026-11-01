const express = require("express");
const {
  createOrder,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", getOrderHistory);
router.get("/:orderId", getOrderDetails);
router.post("/:orderId/cancel", cancelOrder);

module.exports = router;
