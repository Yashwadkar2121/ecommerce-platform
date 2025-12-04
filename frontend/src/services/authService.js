import api from "./api";

export const authService = {
  login: (email, password) => {
    return api.post("/auth/login", { email, password });
  },

  register: (userData) => {
    return api.post("/auth/register", userData);
  },

  logout: () => {
    return api.post("/auth/logout");
  },

  getProfile: () => {
    return api.get("/auth/profile");
  },

  refreshToken: (refreshToken) => {
    return api.post("/auth/refresh-token", { refreshToken });
  },

  // Forgot Password Flow
  forgotPassword: (email) => {
    return api.post("/auth/forgot-password", { email });
  },

  verifyOTP: (email, otp) => {
    return api.post("/auth/verify-otp", { email, otp });
  },

  resetPassword: (resetToken, newPassword) => {
    return api.post("/auth/reset-password", { resetToken, newPassword });
  },
};
