const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Order = sequelize.define("Order", {
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ),
    defaultValue: "pending",
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  trackingNumber: {
    type: DataTypes.STRING,
  },
});

module.exports = Order;
