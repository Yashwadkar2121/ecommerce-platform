import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    total: 0,
    itemCount: 0,
    isOpen: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      state.itemCount = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    removeFromCart: (state, action) => {
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
        item.quantity = action.payload.quantity;
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
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  setCart,
} = cartSlice.actions;

export default cartSlice.reducer;
