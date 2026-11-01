import api from "./api";

export const paymentService = {
  getConfig: () => api.get("/payments/config"),

  createIntent: (orderId, paymentMethod = "stripe") =>
    api.post("/payments/intent", { orderId, paymentMethod }),

  confirm: (orderId, paymentIntentId) =>
    api.post("/payments/confirm", {
      orderId,
      paymentMethod: "stripe",
      paymentData: { paymentIntentId },
    }),
};
