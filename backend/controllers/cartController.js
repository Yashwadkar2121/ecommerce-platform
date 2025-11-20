const { client } = require("../utils/redis");
const Product = require("../models/mongodb/Product");
const inventoryService = require("../services/inventoryService");

const CART_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

const getCartKey = (userId) => `cart:${userId}`;

const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    const cartData = await client.get(cartKey);
    const cart = cartData ? JSON.parse(cartData) : { items: [], total: 0 };

    // Enrich cart items with product details
    const enrichedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const product = await Product.findById(item.productId);
          return {
            ...item,
            product: product
              ? {
                  name: product.name,
                  price: product.price,
                  images: product.images,
                  inventory: product.inventory,
                }
              : null,
          };
        } catch (error) {
          return { ...item, product: null };
        }
      })
    );

    // Remove items with invalid products
    const validItems = enrichedItems.filter((item) => item.product !== null);

    // Recalculate total
    const total = validItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // Update cart if items were removed
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      cart.total = total;
      await client.setEx(cartKey, CART_EXPIRY, JSON.stringify(cart));
    }

    res.json({ ...cart, items: validItems, total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    // Check product existence and inventory
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.inventory < quantity) {
      return res.status(400).json({
        error: "Insufficient inventory",
        available: product.inventory,
      });
    }

    // Get current cart
    const cartData = await client.get(cartKey);
    const cart = cartData ? JSON.parse(cartData) : { items: [], total: 0 };

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (product.inventory < newQuantity) {
        return res.status(400).json({
          error: "Insufficient inventory for requested quantity",
          available: product.inventory,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce((total, item) => {
      return total + product.price * item.quantity;
    }, 0);

    // Save cart
    await client.setEx(cartKey, CART_EXPIRY, JSON.stringify(cart));

    res.json({
      message: "Item added to cart successfully",
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to add item to cart" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    if (quantity < 0) {
      return res.status(400).json({ error: "Quantity cannot be negative" });
    }

    // Check inventory if quantity is being increased
    if (quantity > 0) {
      const inventoryCheck = await inventoryService.checkInventory(
        productId,
        quantity
      );
      if (!inventoryCheck.sufficient) {
        return res.status(400).json({
          error: "Insufficient inventory",
          available: inventoryCheck.available,
        });
      }
    }

    // Get current cart
    const cartData = await client.get(cartKey);
    if (!cartData) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const cart = JSON.parse(cartData);
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    // Recalculate total with current product prices
    const product = await Product.findById(productId);
    cart.total = await calculateCartTotal(cart.items);

    // Save cart
    await client.setEx(cartKey, CART_EXPIRY, JSON.stringify(cart));

    res.json({
      message: "Cart updated successfully",
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    const cartData = await client.get(cartKey);
    if (!cartData) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const cart = JSON.parse(cartData);
    const initialLength = cart.items.length;

    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // Recalculate total
    cart.total = await calculateCartTotal(cart.items);

    // Save cart
    await client.setEx(cartKey, CART_EXPIRY, JSON.stringify(cart));

    res.json({
      message: "Item removed from cart successfully",
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartKey = getCartKey(userId);

    await client.del(cartKey);

    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

// Helper function to calculate cart total
const calculateCartTotal = async (items) => {
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  }

  return total;
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
