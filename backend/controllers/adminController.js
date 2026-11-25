const User = require("../models/mysql/User");
const Order = require("../models/mysql/Order");
const Payment = require("../models/mysql/Payment");
const Product = require("../models/mongodb/Product");
const inventoryService = require("../services/inventoryService");
const { paginate } = require("../utils/helpers");
const { clearProductCache } = require("../utils/cacheInvalidate");
const { getSequelize } = require("../config/database");

const sequelize = getSequelize();
const { Op } = require("sequelize");

// Only these fields may be written by an admin request. Without this a request
// could also set ratings, timestamps or any other field on the product.
const PRODUCT_FIELDS = [
  "name",
  "description",
  "price",
  "category",
  "subcategory",
  "brand",
  "images",
  "inventory",
  "attributes",
  "tags",
  "isActive",
];

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pickProductFields = (body = {}) => {
  const data = {};
  for (const field of PRODUCT_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

// Product images must be https links (they are uploaded to Cloudinary)
const invalidImages = (images) =>
  Array.isArray(images) &&
  images.some(
    (url) => typeof url !== "string" || url.length > 600 || !/^https:\/\//i.test(url)
  );

// Product Management
const adminGetProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;

    const filter = {};
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: pattern }, { brand: pattern }, { category: pattern }];
    }
    if (category) {
      filter.category = category;
    }
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const { limit: queryLimit, offset } = paginate(page, limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .limit(queryLimit)
        .skip(offset)
        .lean(), // plain objects: faster, and "attributes" (a Map) arrives as a normal object
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total,
        totalPages: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const adminCreateProduct = async (req, res) => {
  try {
    const productData = pickProductFields(req.body);
    if (invalidImages(productData.images)) {
      return res.status(400).json({ error: "Images must be https links." });
    }

    const product = new Product(productData);
    await product.save();
    await clearProductCache();

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    res.status(400).json({ error: error.message || "Failed to create product" });
  }
};

const adminUpdateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = pickProductFields(req.body);
    if (invalidImages(updateData.images)) {
      return res.status(400).json({ error: "Images must be https links." });
    }

    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    await clearProductCache();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error.message);
    res.status(400).json({ error: error.message || "Failed to update product" });
  }
};

const adminDeleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    await clearProductCache();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};

// Order Management
const adminGetOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;

    // ✅ CORRECT: Use Sequelize operators
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
      where.createdAt = dateFilter;
    }

    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "email", "firstName", "lastName"],
        },
        {
          model: Payment,
          attributes: ["status", "paymentMethod", "amount"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: queryLimit,
      offset: offset,
    });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total: count,
        totalPages: Math.ceil(count / queryLimit),
      },
    });
  } catch (error) {
    console.error("Admin get orders error:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: error.message,
    });
  }
};

const adminUpdateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // ✅ ADD: Check if status is actually changing
    if (status && status === order.status) {
      return res.status(400).json({
        error: "No changes detected",
        message: `Order is already in "${status}" status`,
        currentStatus: order.status,
      });
    }

    // ✅ ADD: Status validation
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status value",
        validStatuses,
      });
    }

    const updateData = {};
    if (status) updateData.status = status;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide a status to update",
      });
    }

    // ✅ ADD: Store old status for comparison
    const oldStatus = order.status;
    await order.update(updateData);

    res.json({
      message: "Order updated successfully",
      changes: {
        from: oldStatus,
        to: order.status,
      },
      order: {
        id: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("💥 Update order error:", error);
    res.status(400).json({
      error: "Failed to update order",
      details: error.message,
    });
  }
};

// User Management
const adminGetUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.$or = [
        { email: { $like: `%${search}%` } },
        { firstName: { $like: `%${search}%` } },
        { lastName: { $like: `%${search}%` } },
      ];
    }

    const { limit: queryLimit, offset } = paginate(page, limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: queryLimit,
      offset: offset,
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total: count,
        totalPages: Math.ceil(count / queryLimit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ VALIDATION 1: Check if anything is actually changing
    const hasRoleChange = role && role !== user.role;
    const hasActiveChange =
      typeof isActive === "boolean" && isActive !== user.isActive;

    if (!hasRoleChange && !hasActiveChange) {
      return res.status(400).json({
        error: "No changes detected",
        message: "User data is already up to date",
        currentData: {
          role: user.role,
          isActive: user.isActive,
        },
      });
    }

    // ✅ VALIDATION 2: Role validation
    const validRoles = ["customer", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role value",
        validRoles,
      });
    }

    // ✅ VALIDATION 3: Prevent self-deactivation (optional)
    if (typeof isActive === "boolean" && !isActive) {
      const currentAdminId = req.user.id; // Assuming you have admin ID in req.user
      if (parseInt(userId) === currentAdminId) {
        return res.status(400).json({
          error: "Cannot deactivate yourself",
          message: "You cannot deactivate your own account",
        });
      }
    }

    const updateData = {};
    if (hasRoleChange) updateData.role = role;
    if (hasActiveChange) updateData.isActive = isActive;

    // ✅ Store old values for response
    const oldRole = user.role;
    const oldIsActive = user.isActive;

    await user.update(updateData);

    // ✅ Build response with change details
    const response = {
      message: "User updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    // ✅ Add change details if anything changed
    if (hasRoleChange || hasActiveChange) {
      response.changes = {};
      if (hasRoleChange) {
        response.changes.role = { from: oldRole, to: user.role };
      }
      if (hasActiveChange) {
        response.changes.isActive = { from: oldIsActive, to: user.isActive };

        // ✅ Add helpful message for activation/deactivation
        if (user.isActive) {
          response.message = "User activated successfully";
        } else {
          response.message = "User deactivated successfully";
        }
      }
    }

    res.json(response);
  } catch (error) {
    console.error("💥 Update user error:", error);
    res.status(400).json({
      error: "Failed to update user",
      details: error.message,
    });
  }
};

// Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    try {
      const userCount = await User.count();
    } catch (mysqlError) {
      throw new Error(`MySQL Users error: ${mysqlError.message}`);
    }

    try {
      const productCount = await Product.countDocuments({});
    } catch (mongoError) {
      throw new Error(`MongoDB Products error: ${mongoError.message}`);
    }

    // Fetch stats with individual error handling
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      User.count().catch((err) => {
        return 0;
      }),
      Order.count().catch((err) => {
        return 0;
      }),
      Product.countDocuments({ isActive: true }).catch((err) => {
        return 0;
      }),
      Payment.sum("amount", { where: { status: "completed" } }).catch((err) => {
        return 0;
      }),
      Order.findAll({
        include: [
          {
            model: User,
            attributes: ["firstName", "lastName"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 10,
      }).catch((err) => {
        return [];
      }),
      inventoryService.getLowStockProducts(5).catch((err) => {
        return [];
      }),
    ]);

    // Get recent revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRevenue = await Payment.sum("amount", {
      where: {
        status: "completed",
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
    }).catch((err) => {
      return 0;
    });

    res.json({
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: totalRevenue || 0,
        recentRevenue: recentRevenue || 0,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("💥 Dashboard stats error:", error);
    console.error("💥 Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to fetch dashboard stats",
      details: error.message,
    });
  }
};

module.exports = {
  // Product Management
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,

  // Order Management
  adminGetOrders,
  adminUpdateOrder,

  // User Management
  adminGetUsers,
  adminUpdateUser,

  // Dashboard
  getDashboardStats,
};
