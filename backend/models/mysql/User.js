const { DataTypes } = require("sequelize");
const { getSequelize } = require("../../config/database");
const bcrypt = require("bcryptjs");

const sequelize = getSequelize();

if (!sequelize) {
  throw new Error(
    "❌ Sequelize not initialized! Make sure connectMySQL() is called before loading models."
  );
}

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
      defaultValue: "customer",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ✅ Import Order model and define association
const Order = require("./Order");
User.hasMany(Order, { foreignKey: "userId" }); // ✅ ADD THIS
Order.belongsTo(User, { foreignKey: "userId" }); // ✅ ADD THIS

module.exports = User;
