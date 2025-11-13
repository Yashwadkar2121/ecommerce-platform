const { DataTypes } = require("sequelize");
const { getSequelize } = require("../../config/database");

const sequelize = getSequelize();

if (!sequelize) {
  throw new Error(
    "❌ Sequelize not initialized! Make sure connectMySQL() is called before loading models."
  );
}

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.STRING, // from MongoDB, so string
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = OrderItem;
