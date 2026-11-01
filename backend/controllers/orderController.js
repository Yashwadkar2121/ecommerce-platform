const Order = require("../models/mysql/Order");
const OrderItem = require("../models/mysql/OrderItem");
const Payment = require("../models/mysql/Payment");
const Product = require("../models/mongodb/Product");
const { getSequelize } = require("../config/database");
const { computeTotals } = require("../config/pricing");

const REQUIRED_ADDRESS_FIELDS = ["firstName", "lastName", "address", "city", "state", "zipCode"];

// put stock back when an order fails or is cancelled
const restoreStock = async (items) => {
  for (const item of items) {
    try {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { inventory: item.quantity },
      });
    } catch (err) {
      console.error(`Failed to restore stock for ${item.productId}:`, err.message);
    }
  }
};

// Create Order
const createOrder = async (req, res) => {
  const sequelize = getSequelize();
  if (!sequelize) {
    return res
      .status(500)
      .json({ error: "Database not initialized. Please restart the server." });
  }

  const { items, shippingAddress, paymentMethod = "stripe" } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided for the order." });
  }

  if (
    !shippingAddress ||
    REQUIRED_ADDRESS_FIELDS.some((f) => !String(shippingAddress[f] || "").trim())
  ) {
    return res.status(400).json({
      error: `Shipping address is incomplete. Required: ${REQUIRED_ADDRESS_FIELDS.join(", ")}.`,
    });
  }

  // merge duplicate lines
  const wanted = new Map();
  for (const item of items) {
    const quantity = Math.floor(Number(item?.quantity));
    if (!item?.productId || !Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Each item needs a productId and a quantity of at least 1." });
    }
    const key = String(item.productId);
    wanted.set(key, (wanted.get(key) || 0) + quantity);
  }

  const reserved = [];

  try {
    // reserve stock
    for (const [productId, quantity] of wanted) {
      let product = null;
      try {
        product = await Product.findOneAndUpdate(
          { _id: productId, isActive: { $ne: false }, inventory: { $gte: quantity } },
          { $inc: { inventory: -quantity } },
          { new: false }
        );
      } catch (err) {
        product = null;
      }

      if (!product) {
        await restoreStock(reserved);
        const existing = await Product.findById(productId).catch(() => null);
        if (!existing || existing.isActive === false) {
          return res.status(404).json({
            error: `Product with ID ${productId} is not available.`,
          });
        }
        return res.status(400).json({
          error: `Insufficient inventory for product "${existing.name}". Only ${existing.inventory} left.`,
        });
      }

      reserved.push({ productId, quantity, price: product.price, name: product.name });
    }

    // totals
    const subtotal = reserved.reduce((sum, r) => sum + r.price * r.quantity, 0);
    const totals = computeTotals(subtotal);

    // save order, items and payment together
    const transaction = await sequelize.transaction();
    try {
      const order = await Order.create(
        { userId, totalAmount: totals.total, shippingAddress, status: "pending" },
        { transaction }
      );

      for (const r of reserved) {
        await OrderItem.create(
          { orderId: order.id, productId: r.productId, quantity: r.quantity, price: r.price },
          { transaction }
        );
      }

      const payment = await Payment.create(
        { orderId: order.id, paymentMethod, amount: totals.total, status: "pending" },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        message: "Order created successfully",
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          ...totals,
        },
        payment: { id: payment.id, amount: payment.amount },
      });
    } catch (dbError) {
      await transaction.rollback();
      throw dbError;
    }
  } catch (error) {
    await restoreStock(reserved);
    console.error("Error in createOrder:", error);
    return res.status(400).json({ error: error.message });
  }
};

// add product name/image to the order items
const attachProducts = async (orders) => {
  const ids = new Set();
  orders.forEach((o) => (o.OrderItems || []).forEach((i) => ids.add(i.productId)));

  const products = await Product.find({ _id: { $in: [...ids] } })
    .select("name images")
    .lean()
    .catch(() => []);
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return orders.map((order) => {
    const { OrderItems, ...rest } = order.toJSON();
    return {
      ...rest,
      items: (OrderItems || []).map((item) => {
        const p = byId.get(String(item.productId));
        return {
          ...item,
          product: p ? { name: p.name, images: p.images } : null,
        };
      }),
    };
  });
};

// 📜 Get Order History
const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        { model: OrderItem, attributes: ["productId", "quantity", "price"] },
        { model: Payment, attributes: ["status", "paymentMethod", "transactionId"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ orders: await attachProducts(orders) });
  } catch (error) {
    console.error("Error in getOrderHistory:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// 🔍 Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [
        { model: OrderItem, attributes: ["productId", "quantity", "price"] },
        {
          model: Payment,
          attributes: ["status", "paymentMethod", "transactionId", "paymentDetails"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const [detailed] = await attachProducts([order]);
    res.json({ order: detailed });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

// Cancel an unpaid order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: OrderItem }, { model: Payment }],
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // only pending orders can be cancelled
    const [affected] = await Order.update(
      { status: "cancelled" },
      { where: { id: orderId, userId, status: "pending" } }
    );
    if (affected === 0) {
      return res.status(409).json({
        error: `Only unpaid orders can be cancelled (this order is "${order.status}").`,
      });
    }

    await Payment.update({ status: "failed" }, { where: { orderId } });

    // cancel the stripe intent too so it can't be paid later
    const payment = order.Payment;
    if (payment?.paymentMethod === "stripe" && payment.transactionId) {
      try {
        const stripe = require("../config/stripe");
        await stripe.paymentIntents.cancel(payment.transactionId);
      } catch (err) {
        console.error("Could not cancel PaymentIntent:", err.message);
      }
    }

    await restoreStock(order.OrderItems || []);

    res.json({ message: "Order cancelled", order: { id: order.id, status: "cancelled" } });
  } catch (error) {
    console.error("Error in cancelOrder:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
};
