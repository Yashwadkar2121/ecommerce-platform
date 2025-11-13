const Order = require("../models/mysql/Order");
const OrderItem = require("../models/mysql/OrderItem");
const Payment = require("../models/mysql/Payment");
const Product = require("../models/mongodb/Product");
const { getSequelize } = require("../config/database");

// 🧾 Create Order
const createOrder = async (req, res) => {
  const sequelize = getSequelize();
  if (!sequelize) {
    return res
      .status(500)
      .json({ error: "Database not initialized. Please restart the server." });
  }

  const transaction = await sequelize.transaction();

  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "No items provided for the order." });
    }

    // Calculate total and check inventory
    let totalAmount = 0;
    const inventoryUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      // 🧩 If product not found → respond immediately
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          error: `Product with ID ${item.productId} is not available.`,
        });
      }

      // 🧩 If product out of stock → respond immediately
      if (product.inventory < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Insufficient inventory for product "${product.name}". Only ${product.inventory} left.`,
        });
      }

      totalAmount += product.price * item.quantity;
      inventoryUpdates.push({
        productId: item.productId,
        quantity: item.quantity,
        currentPrice: product.price,
      });
    }

    // 🧾 Create order
    const order = await Order.create(
      {
        userId,
        totalAmount,
        shippingAddress,
        status: "pending",
      },
      { transaction }
    );

    // Create order items & update inventory
    for (const update of inventoryUpdates) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: update.productId,
          quantity: update.quantity,
          price: update.currentPrice,
        },
        { transaction }
      );

      // Update inventory in MongoDB
      await Product.findByIdAndUpdate(update.productId, {
        $inc: { inventory: -update.quantity },
      });
    }

    // 💳 Create payment record
    const payment = await Payment.create(
      {
        orderId: order.id,
        paymentMethod,
        amount: totalAmount,
        status: "pending",
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
      },
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ error: error.message });
  }
};

// 📜 Get Order History
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          attributes: ["productId", "quantity", "price"],
        },
        {
          model: Payment,
          attributes: ["status", "paymentMethod", "transactionId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ orders });
  } catch (error) {
    console.error("Error in getOrderHistory:", error); // 🪵 log full error
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// 🔍 Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: OrderItem,
          attributes: ["productId", "quantity", "price"],
        },
        {
          model: Payment,
          attributes: [
            "status",
            "paymentMethod",
            "transactionId",
            "paymentDetails",
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Fetch product details from MongoDB
    const orderItemsWithProducts = await Promise.all(
      order.OrderItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        return {
          ...item.toJSON(),
          product: product
            ? {
                name: product.name,
                images: product.images,
              }
            : null,
        };
      })
    );

    res.json({
      order: {
        ...order.toJSON(),
        items: orderItemsWithProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderDetails,
};
