const Order = require("../models/mysql/Order");
const Payment = require("../models/mysql/Payment");
const paymentService = require("../services/paymentService");

const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Verify order exists and belongs to user
    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

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

    // Update payment record
    await Payment.update(
      {
        paymentMethod,
        transactionId: paymentResult.paymentIntentId || paymentResult.paymentId,
        status: "pending",
      },
      {
        where: { orderId },
      }
    );

    res.json({
      paymentMethod,
      ...paymentResult,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentData } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    let paymentResult;

    if (paymentMethod === "stripe") {
      const { paymentIntentId } = paymentData;
      paymentResult = await paymentService.confirmStripePayment(
        paymentIntentId
      );
    } else if (paymentMethod === "paypal") {
      const { paymentId, payerId } = paymentData;
      paymentResult = await paymentService.executePayPalPayment(
        paymentId,
        payerId
      );
    }

    if (paymentResult.success) {
      // Update payment record
      await Payment.update(
        {
          status: "completed",
          transactionId: paymentResult.transactionId,
          paymentDetails: paymentResult.paymentDetails,
        },
        {
          where: { orderId },
        }
      );

      // Update order status
      await Order.update(
        {
          status: "confirmed",
        },
        {
          where: { id: orderId },
        }
      );

      res.json({
        success: true,
        message: "Payment completed successfully",
        order: {
          id: order.id,
          status: "confirmed",
        },
      });
    } else {
      // Payment failed
      await Payment.update(
        {
          status: "failed",
          paymentDetails: paymentResult,
        },
        {
          where: { orderId },
        }
      );

      res.status(400).json({
        success: false,
        error: "Payment failed",
        details: paymentResult.error,
      });
    }
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

const handlePaymentWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

const handleSuccessfulPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata;

  await Payment.update(
    {
      status: "completed",
      transactionId: paymentIntent.id,
      paymentDetails: paymentIntent,
    },
    {
      where: { orderId },
    }
  );

  await Order.update(
    {
      status: "confirmed",
    },
    {
      where: { id: orderId },
    }
  );
};

const handleFailedPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata;

  await Payment.update(
    {
      status: "failed",
      paymentDetails: paymentIntent,
    },
    {
      where: { orderId },
    }
  );
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  handlePaymentWebhook,
};
