const stripe = require("../config/stripe");
const paypal = require("paypal-rest-sdk");
const { Payment } = require("../models/mysql/Payment");
const { generateTransactionId } = require("../utils/helpers");

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

class PaymentService {
  async createStripePaymentIntent(order) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          orderId: order.id.toString(),
          userId: order.userId.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new Error(`Stripe payment creation failed: ${error.message}`);
    }
  }

  async confirmStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status === "succeeded") {
        return {
          success: true,
          transactionId: paymentIntent.id,
          paymentDetails: paymentIntent,
        };
      } else {
        return {
          success: false,
          status: paymentIntent.status,
          error: paymentIntent.last_payment_error,
        };
      }
    } catch (error) {
      throw new Error(`Stripe payment confirmation failed: ${error.message}`);
    }
  }

  async createPayPalPayment(order) {
    return new Promise((resolve, reject) => {
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        },
        transactions: [
          {
            amount: {
              currency: "USD",
              total: order.totalAmount.toFixed(2),
            },
            description: `Payment for order #${order.id}`,
            custom: order.id.toString(),
          },
        ],
      };

      paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
          reject(new Error(`PayPal payment creation failed: ${error.message}`));
        } else {
          resolve({
            paymentId: payment.id,
            approvalUrl: payment.links.find(
              (link) => link.rel === "approval_url"
            ).href,
          });
        }
      });
    });
  }

  async executePayPalPayment(paymentId, payerId) {
    return new Promise((resolve, reject) => {
      const execute_payment_json = {
        payer_id: payerId,
      };

      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        (error, payment) => {
          if (error) {
            reject(
              new Error(`PayPal payment execution failed: ${error.message}`)
            );
          } else {
            resolve({
              success: payment.state === "approved",
              transactionId: payment.id,
              paymentDetails: payment,
            });
          }
        }
      );
    });
  }

  async updatePaymentRecord(paymentId, updateData) {
    return await Payment.update(updateData, {
      where: { id: paymentId },
    });
  }

  async handlePaymentRefund(paymentRecord, amount) {
    try {
      if (paymentRecord.paymentMethod === "stripe") {
        const refund = await stripe.refunds.create({
          payment_intent: paymentRecord.transactionId,
          amount: Math.round(amount * 100),
        });
        return refund;
      } else if (paymentRecord.paymentMethod === "paypal") {
        // PayPal refund implementation would go here
        throw new Error("PayPal refunds not implemented in this example");
      }
    } catch (error) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
