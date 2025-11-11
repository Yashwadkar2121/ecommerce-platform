const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Orders",
      key: "id",
    },
  },
  paymentMethod: {
    type: DataTypes.ENUM("stripe", "paypal"),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
    defaultValue: "pending",
  },
  transactionId: {
    type: DataTypes.STRING,
  },
  paymentDetails: {
    type: DataTypes.JSON,
  },
});

module.exports = Payment;
