import api from "./api";

export const aiService = {
  // history: [{ role: "user" | "assistant", text }]
  assistant: (message, history = []) =>
    api.post("/ai/assistant", { message, history }),

  reviewSummary: (productId) => api.get(`/products/${productId}/review-summary`),
};
