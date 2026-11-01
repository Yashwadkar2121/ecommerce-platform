// keeps the redux cart and the saved cart on the server in sync
import {
  createAsyncThunk,
  createListenerMiddleware,
  isAnyOf,
} from "@reduxjs/toolkit";
import { cartService } from "../services/cartService";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCart,
} from "./slices/cartSlice";
import { loginUser, logout } from "./slices/authSlice";

const hasToken = () => !!localStorage.getItem("token");

const summarize = (items) => ({
  items,
  itemCount: items.reduce((n, i) => n + i.quantity, 0),
  total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
});

// server item -> cart item shape
const fromServerItem = (item) => ({
  productId: item.productId,
  name: item.product.name,
  price: item.product.price,
  image: item.product.images?.[0],
  quantity: item.quantity,
  maxQuantity: item.product.inventory,
  addedAt: item.addedAt,
});

// load the saved cart and merge anything added before login
export const hydrateCart = createAsyncThunk(
  "cart/hydrate",
  async (_, { getState, dispatch }) => {
    if (!hasToken()) return;

    const { data } = await cartService.getCart();
    const merged = new Map(
      (data.items || [])
        .filter((i) => i.product)
        .map((i) => [i.productId, fromServerItem(i)])
    );

    const local = getState().cart.items;
    for (const item of local) {
      const existing = merged.get(item.productId);
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + item.quantity,
          existing.maxQuantity ?? Infinity
        );
      } else {
        merged.set(item.productId, { ...item });
      }
    }

    const items = [...merged.values()];
    dispatch(setCart(summarize(items)));

    // save the merged cart
    if (local.length > 0) {
      await cartService.syncCart(
        items.map(({ productId, quantity }) => ({ productId, quantity }))
      );
    }
  }
);

export const cartSyncMiddleware = createListenerMiddleware();

// push cart changes to the server (debounced)
cartSyncMiddleware.startListening({
  matcher: isAnyOf(addToCart, removeFromCart, updateQuantity, clearCart),
  effect: async (_action, listenerApi) => {
    listenerApi.cancelActiveListeners();
    await listenerApi.delay(400);
    if (!hasToken()) return;

    try {
      const items = listenerApi
        .getState()
        .cart.items.map(({ productId, quantity }) => ({ productId, quantity }));
      await cartService.syncCart(items);
    } catch (error) {
      console.warn("Cart sync failed:", error?.response?.data?.error || error.message);
    }
  },
});

// after login
cartSyncMiddleware.startListening({
  actionCreator: loginUser.fulfilled,
  effect: async (_action, listenerApi) => {
    try {
      await listenerApi.dispatch(hydrateCart()).unwrap();
    } catch (error) {
      console.warn("Cart hydrate failed:", error?.message);
    }
  },
});

// clear the cart on logout
cartSyncMiddleware.startListening({
  actionCreator: logout,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(setCart({ items: [], total: 0, itemCount: 0 }));
  },
});
