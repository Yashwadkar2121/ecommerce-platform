// Keeps the Redux cart (what the UI uses) and the server cart (Redis) in sync.
//
//  - every cart change made while logged in is pushed to the server (debounced)
//  - on app start / login the server cart is loaded into Redux
//  - on logout the in-memory cart is emptied so the next user doesn't inherit it
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

// Server cart item -> shape used by the UI
const fromServerItem = (item) => ({
  productId: item.productId,
  name: item.product.name,
  price: item.product.price,
  image: item.product.images?.[0],
  quantity: item.quantity,
  maxQuantity: item.product.inventory,
  addedAt: item.addedAt,
});

// Load the server cart. If the browser already holds items (guest cart added
// before logging in) they are merged in, once.
export const hydrateCart = createAsyncThunk(
  "cart/hydrate",
  async (_, { getState, dispatch }) => {
    if (!hasToken()) return;

    const { data } = await cartService.getCart();
    const merged = new Map(
      (data.items || [])
        .filter((i) => i.product)
<<<<<<< HEAD
        .map((i) => [i.productId, fromServerItem(i)]),
=======
        .map((i) => [i.productId, fromServerItem(i)])
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
    );

    const local = getState().cart.items;
    for (const item of local) {
      const existing = merged.get(item.productId);
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + item.quantity,
<<<<<<< HEAD
          existing.maxQuantity ?? Infinity,
=======
          existing.maxQuantity ?? Infinity
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
        );
      } else {
        merged.set(item.productId, { ...item });
      }
    }

    const items = [...merged.values()];
    dispatch(setCart(summarize(items)));

    // Local items were merged in -> store the combined cart on the server too
    if (local.length > 0) {
      await cartService.syncCart(
<<<<<<< HEAD
        items.map(({ productId, quantity }) => ({ productId, quantity })),
      );
    }
  },
=======
        items.map(({ productId, quantity }) => ({ productId, quantity }))
      );
    }
  }
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
);

export const cartSyncMiddleware = createListenerMiddleware();

// Push every change to the server (debounced so rapid +/- clicks send one request)
cartSyncMiddleware.startListening({
  matcher: isAnyOf(addToCart, removeFromCart, updateQuantity, clearCart),
  effect: async (_action, listenerApi) => {
    listenerApi.cancelActiveListeners();
    await listenerApi.delay(400);
    if (!hasToken()) return; // guest: cart stays in memory only

    try {
      const items = listenerApi
        .getState()
        .cart.items.map(({ productId, quantity }) => ({ productId, quantity }));
      await cartService.syncCart(items);
    } catch (error) {
<<<<<<< HEAD
      console.warn(
        "Cart sync failed:",
        error?.response?.data?.error || error.message,
      );
=======
      console.warn("Cart sync failed:", error?.response?.data?.error || error.message);
>>>>>>> 116e83fe1beec9516c711ec65a99d1548553fe16
    }
  },
});

// After a successful login, load/merge the server cart
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

// On logout, empty the in-memory cart (the server copy stays for next login)
cartSyncMiddleware.startListening({
  actionCreator: logout,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(setCart({ items: [], total: 0, itemCount: 0 }));
  },
});
