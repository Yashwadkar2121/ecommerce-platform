const Order = require("../models/mysql/Order");
const Payment = require("../models/mysql/Payment");
const stripe = require("../config/stripe");
const paymentService = require("../services/paymentService");

// A paid order moves from "pending" to "processing" (ready to be fulfilled).
// ("confirmed" is not a value of the Order.status ENUM, so it must not be used.)
const PAID_STATUS = "processing";

// Publishable key for the frontend (safe to expose, saves a frontend env var)
const getPaymentConfig = (req, res) => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: "Stripe is not configured on the server" });
  }
  res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

// Mark an order paid. Idempotent: only a still-pending order is moved.
const markOrderPaid = async (orderId, { transactionId, paymentDetails }) => {
  await Payment.update(
    { status: "completed", transactionId, paymentDetails },
    { where: { orderId } }
  );
  await Order.update(
    { status: PAID_STATUS },
    { where: { id: orderId, status: "pending" } }
  );
};

const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ error: "Order cannot be paid for" });
    }

    let paymentResult;
    if (paymentMethod === "stripe") {
      paymentResult = await paymentService.createStripePaymentIntent(order);
    } else if (paymentMethod === "paypal") {
      paymentResult = await paymentService.createPayPalPayment(order);
    } else {
      return res.status(400).json({ error: "Unsupported payment method" });
    }

    await Payment.update(
      {
        paymentMethod,
        transactionId: paymentResult.paymentIntentId || paymentResult.paymentId,
        status: "pending",
      },
      { where: { orderId } }
    );

    res.json({ paymentMethod, ...paymentResult });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentData } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Idempotent: confirming twice (or webhook arrived first) is fine
    if (payment.status === "completed") {
      return res.json({
        success: true,
        message: "Payment already completed",
        order: { id: order.id, status: order.status },
      });
    }

    if (order.status === "cancelled") {
      return res.status(409).json({ error: "This order was cancelled" });
    }

    let paymentResult;
    if (paymentMethod === "stripe") {
      const paymentIntentId = paymentData?.paymentIntentId;
      // The intent must be the one we created for THIS order
      if (!paymentIntentId || paymentIntentId !== payment.transactionId) {
        return res.status(400).json({ error: "Payment does not match this order" });
      }
      paymentResult = await paymentService.confirmStripePayment(paymentIntentId);
    } else if (paymentMethod === "paypal") {
      const { paymentId, payerId } = paymentData || {};
      paymentResult = await paymentService.executePayPalPayment(paymentId, payerId);
    } else {
      return res.status(400).json({ error: "Unsupported payment method" });
    }

    if (paymentResult.success) {
      await markOrderPaid(orderId, paymentResult);
      return res.json({
        success: true,
        message: "Payment completed successfully",
        order: { id: order.id, status: PAID_STATUS },
      });
    }

    await Payment.update(
      { status: "failed", paymentDetails: paymentResult },
      { where: { orderId } }
    );
    res.status(400).json({
      success: false,
      error: "Payment failed",
      details: paymentResult.error,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: "stripe",
        name: "Credit/Debit Card",
        supportedCards: ["visa", "mastercard", "amex"],
        description: "Pay securely with your credit or debit card",
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Pay with your PayPal account",
      },
    ];
    res.json({ paymentMethods });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
};

// Stripe webhook. server.js mounts express.raw() for this path so that
// req.body is the untouched Buffer that Stripe's signature check needs.
const handlePaymentWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handleSuccessfulPayment(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handleFailedPayment(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

const handleSuccessfulPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata || {};
  if (!orderId) return;
  await markOrderPaid(orderId, {
    transactionId: paymentIntent.id,
    paymentDetails: paymentIntent,
  });
};

const handleFailedPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata || {};
  if (!orderId) return;
  // Leave the order pending so the customer can retry
  await Payment.update(
    { status: "failed", paymentDetails: paymentIntent },
    { where: { orderId, status: "pending" } }
  );
};

module.exports = {
  getPaymentConfig,
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  handlePaymentWebhook,
};
