import api from "./api";

export const cartService = {
  getCart: () => api.get("/cart"),

  // Replace the server cart with the given items: [{ productId, quantity }]
  syncCart: (items) => api.put("/cart", { items }),
};
