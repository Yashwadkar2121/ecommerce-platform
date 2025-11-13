const { DataTypes } = require("sequelize");
const { getSequelize } = require("../../config/database");

const sequelize = getSequelize();

if (!sequelize) {
  throw new Error("❌ Sequelize not initialized!");
}

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Define associations right here
const OrderItem = require("./OrderItem");
const Payment = require("./Payment");

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Order.hasOne(Payment, { foreignKey: "orderId", onDelete: "CASCADE" });
Payment.belongsTo(Order, { foreignKey: "orderId" });

module.exports = Order;
