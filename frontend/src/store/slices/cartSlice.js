import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    total: 0,
    itemCount: 0,
    isOpen: false,
    lastAddedItem: null, // Track last added item for notification
    notifications: [], // Store multiple notifications
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId
      );

      const itemToAdd = {
        ...action.payload,
        addedAt: new Date().toISOString(), // Add timestamp for notification
      };

      if (existingItem) {
        // Check if quantity exceeds max
        const newQuantity = existingItem.quantity + itemToAdd.quantity;
        if (newQuantity > existingItem.maxQuantity) {
          existingItem.quantity = existingItem.maxQuantity;
          // Add notification about quantity limit
          state.notifications.push({
            id: Date.now(),
            type: "warning",
            message: `Only ${existingItem.maxQuantity} ${existingItem.name} available in stock`,
            productId: existingItem.productId,
            timestamp: new Date().toISOString(),
          });
        } else {
          existingItem.quantity = newQuantity;
        }
      } else {
        state.items.push(itemToAdd);
      }

      // Update totals
      state.itemCount = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Set last added item for notification
      state.lastAddedItem = {
        ...itemToAdd,
        isNew: !existingItem, // Flag if it's a new item
      };

      // Add success notification
      state.notifications.push({
        id: Date.now(),
        type: "success",
        message: existingItem
          ? `Updated ${itemToAdd.name} quantity to ${existingItem.quantity}`
          : `Added ${itemToAdd.name} to cart`,
        productId: itemToAdd.productId,
        image: itemToAdd.image,
        timestamp: new Date().toISOString(),
      });
    },
    removeFromCart: (state, action) => {
      const removedItem = state.items.find(
        (item) => item.productId === action.payload
      );

      if (removedItem) {
        // Add removal notification
        state.notifications.push({
          id: Date.now(),
          type: "info",
          message: `Removed ${removedItem.name} from cart`,
          productId: removedItem.productId,
          timestamp: new Date().toISOString(),
        });
      }

      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      state.itemCount = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    updateQuantity: (state, action) => {
      const item = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (item) {
        const oldQuantity = item.quantity;
        item.quantity = action.payload.quantity;

        // Add notification for quantity change
        if (oldQuantity !== action.payload.quantity) {
          state.notifications.push({
            id: Date.now(),
            type: "info",
            message: `Updated ${item.name} quantity from ${oldQuantity} to ${action.payload.quantity}`,
            productId: item.productId,
            timestamp: new Date().toISOString(),
          });
        }

        state.itemCount = state.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        state.total = state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      }
    },
    clearCart: (state) => {
      // Add notification for cart clearance
      state.notifications.push({
        id: Date.now(),
        type: "info",
        message: "Cart cleared",
        timestamp: new Date().toISOString(),
      });

      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.total = action.payload.total || 0;
      state.itemCount = action.payload.itemCount || 0;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItem = null;
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  setCart,
  clearLastAddedItem,
  removeNotification,
  clearNotifications,
} = cartSlice.actions;

export default cartSlice.reducer;
