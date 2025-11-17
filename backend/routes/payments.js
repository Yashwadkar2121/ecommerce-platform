const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  handlePaymentWebhook,
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Webhook route (no authentication needed for Stripe webhooks)
router.post("/webhook", handlePaymentWebhook);

// Protected routes
router.use(authenticate);

router.post("/intent", createPaymentIntent);
router.post("/confirm", confirmPayment);
router.get("/methods", getPaymentMethods);

module.exports = router;
