const Order = require("../models/mysql/Order");
const OrderItem = require("../models/mysql/OrderItem");
const Payment = require("../models/mysql/Payment");
const Product = require("../models/mongodb/Product");
const { getSequelize } = require("../config/database");
const { computeTotals } = require("../config/pricing");

<<<<<<< HEAD
const REQUIRED_ADDRESS_FIELDS = [
  "firstName",
  "lastName",
  "address",
  "city",
  "state",
  "zipCode",
];
=======
const REQUIRED_ADDRESS_FIELDS = ["firstName", "lastName", "address", "city", "state", "zipCode"];
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16

// Give reserved stock back (used when an order fails or is cancelled)
const restoreStock = async (items) => {
  for (const item of items) {
    try {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { inventory: item.quantity },
      });
    } catch (err) {
<<<<<<< HEAD
      console.error(
        `Failed to restore stock for ${item.productId}:`,
        err.message,
      );
=======
      console.error(`Failed to restore stock for ${item.productId}:`, err.message);
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
    }
  }
};

// 🧾 Create Order
// Prices and tax are always computed on the server from the database.
// Stock is reserved atomically; it is given back if anything later fails.
const createOrder = async (req, res) => {
  const sequelize = getSequelize();
  if (!sequelize) {
    return res
      .status(500)
      .json({ error: "Database not initialized. Please restart the server." });
  }

  const { items, shippingAddress, paymentMethod = "stripe" } = req.body;
  const userId = req.user.id;
<<<<<<< HEAD

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided for the order." });
  }

  if (
    !shippingAddress ||
    REQUIRED_ADDRESS_FIELDS.some(
      (f) => !String(shippingAddress[f] || "").trim(),
    )
  ) {
    return res.status(400).json({
      error: `Shipping address is incomplete. Required: ${REQUIRED_ADDRESS_FIELDS.join(", ")}.`,
    });
  }

  // Merge duplicate product lines and validate quantities
  const wanted = new Map();
  for (const item of items) {
    const quantity = Math.floor(Number(item?.quantity));
    if (!item?.productId || !Number.isFinite(quantity) || quantity < 1) {
      return res
        .status(400)
        .json({
          error: "Each item needs a productId and a quantity of at least 1.",
        });
    }
    const key = String(item.productId);
    wanted.set(key, (wanted.get(key) || 0) + quantity);
  }

  const reserved = []; // { productId, quantity, price, name }

  try {
    // 1️⃣ Reserve stock atomically (never oversell, even with concurrent orders)
    for (const [productId, quantity] of wanted) {
      let product = null;
      try {
        product = await Product.findOneAndUpdate(
          {
            _id: productId,
            isActive: { $ne: false },
            inventory: { $gte: quantity },
          },
          { $inc: { inventory: -quantity } },
          { new: false },
        );
      } catch (err) {
        product = null; // invalid ObjectId etc.
      }

=======

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

  // Merge duplicate product lines and validate quantities
  const wanted = new Map();
  for (const item of items) {
    const quantity = Math.floor(Number(item?.quantity));
    if (!item?.productId || !Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Each item needs a productId and a quantity of at least 1." });
    }
    const key = String(item.productId);
    wanted.set(key, (wanted.get(key) || 0) + quantity);
  }

  const reserved = []; // { productId, quantity, price, name }

  try {
    // 1️⃣ Reserve stock atomically (never oversell, even with concurrent orders)
    for (const [productId, quantity] of wanted) {
      let product = null;
      try {
        product = await Product.findOneAndUpdate(
          { _id: productId, isActive: { $ne: false }, inventory: { $gte: quantity } },
          { $inc: { inventory: -quantity } },
          { new: false }
        );
      } catch (err) {
        product = null; // invalid ObjectId etc.
      }

>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
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

<<<<<<< HEAD
      reserved.push({
        productId,
        quantity,
        price: product.price,
        name: product.name,
      });
=======
      reserved.push({ productId, quantity, price: product.price, name: product.name });
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
    }

    // 2️⃣ Totals (server-side)
    const subtotal = reserved.reduce((sum, r) => sum + r.price * r.quantity, 0);
    const totals = computeTotals(subtotal);

    // 3️⃣ Persist order, items and payment record in one SQL transaction
    const transaction = await sequelize.transaction();
    try {
      const order = await Order.create(
<<<<<<< HEAD
        {
          userId,
          totalAmount: totals.total,
          shippingAddress,
          status: "pending",
        },
        { transaction },
=======
        { userId, totalAmount: totals.total, shippingAddress, status: "pending" },
        { transaction }
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
      );

      for (const r of reserved) {
        await OrderItem.create(
<<<<<<< HEAD
          {
            orderId: order.id,
            productId: r.productId,
            quantity: r.quantity,
            price: r.price,
          },
          { transaction },
=======
          { orderId: order.id, productId: r.productId, quantity: r.quantity, price: r.price },
          { transaction }
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
        );
      }

      const payment = await Payment.create(
<<<<<<< HEAD
        {
          orderId: order.id,
          paymentMethod,
          amount: totals.total,
          status: "pending",
        },
        { transaction },
=======
        { orderId: order.id, paymentMethod, amount: totals.total, status: "pending" },
        { transaction }
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
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

// Attach product name/image to order items with ONE Mongo query
const attachProducts = async (orders) => {
  const ids = new Set();
<<<<<<< HEAD
  orders.forEach((o) =>
    (o.OrderItems || []).forEach((i) => ids.add(i.productId)),
  );
=======
  orders.forEach((o) => (o.OrderItems || []).forEach((i) => ids.add(i.productId)));
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16

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
<<<<<<< HEAD
        {
          model: Payment,
          attributes: ["status", "paymentMethod", "transactionId"],
        },
=======
        { model: Payment, attributes: ["status", "paymentMethod", "transactionId"] },
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
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
<<<<<<< HEAD
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

// ❌ Cancel an unpaid order and give the stock back
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

    // Atomic pending -> cancelled transition (guards against racing with a payment)
    const [affected] = await Order.update(
      { status: "cancelled" },
      { where: { id: orderId, userId, status: "pending" } },
    );
    if (affected === 0) {
      return res.status(409).json({
        error: `Only unpaid orders can be cancelled (this order is "${order.status}").`,
      });
    }

    await Payment.update({ status: "failed" }, { where: { orderId } });

    // Best effort: cancel the Stripe PaymentIntent so it can't be paid later
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

    res.json({
      message: "Order cancelled",
      order: { id: order.id, status: "cancelled" },
    });
  } catch (error) {
    console.error("Error in cancelOrder:", error);
    res.status(500).json({ error: "Failed to cancel order" });
=======
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
  }
};

// ❌ Cancel an unpaid order and give the stock back
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

    // Atomic pending -> cancelled transition (guards against racing with a payment)
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

    // Best effort: cancel the Stripe PaymentIntent so it can't be paid later
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
