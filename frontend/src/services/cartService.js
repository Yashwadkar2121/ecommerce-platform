import api from "./api";

export const cartService = {
  getCart: () => api.get("/cart"),

  syncCart: (items) => api.put("/cart", { items }),
};
