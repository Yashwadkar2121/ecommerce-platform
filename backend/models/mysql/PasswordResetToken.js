const { DataTypes } = require("sequelize");
const { getSequelize } = require("../../config/database");

const sequelize = getSequelize();

const PasswordResetToken = sequelize.define("PasswordResetToken", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = PasswordResetToken;
