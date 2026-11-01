import api from "./api";

export const orderService = {
  createOrder: ({ items, shippingAddress, paymentMethod = "stripe" }) =>
    api.post("/orders", { items, shippingAddress, paymentMethod }),

  getOrders: () => api.get("/orders"),

  getOrder: (orderId) => api.get(`/orders/${orderId}`),

  cancelOrder: (orderId) => api.post(`/orders/${orderId}/cancel`),
};
