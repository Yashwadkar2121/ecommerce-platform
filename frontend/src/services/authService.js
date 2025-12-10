import api from "./api";

api.interceptors.request.use(
  (config) => {
    console.log("🚀 Request URL:", config.url);
    console.log("📦 Request Data:", config.data);
    console.log("🔧 Request Method:", config.method);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response Status:", response.status);
    console.log("📥 Response Data:", response.data);
    return response;
  },
  (error) => {
    console.error("❌ Response Error:", error.response?.status);
    console.error("📥 Error Response Data:", error.response?.data);
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => {
    return api.post("/auth/login", { email, password });
  },

  register: (userData) => {
    return api.post("/auth/register", userData);
  },

  logout: (refreshToken) => {
    return api.post("/auth/logout", { refreshToken });
  },

  getProfile: () => {
    return api.get("/auth/profile");
  },

  updateProfile: (profileData) => {
    return api.put("/auth/profile", profileData);
  },

  changePassword: (currentPassword, newPassword) => {
    return api.put("/auth/change-password", { currentPassword, newPassword });
  },

  refreshToken: (refreshToken) => {
    return api.post("/auth/refresh-token", { refreshToken });
  },

  forgotPassword: (email) => {
    return api.post("/auth/forgot-password", { email });
  },

  verifyOTP: (email, otp) => {
    return api.post("/auth/verify-otp", { email, otp });
  },

  resendOTP: (email) => {
    return api.post("/auth/resend-otp", { email: email });
  },

  resetPassword: (resetToken, newPassword) => {
    return api.post("/auth/reset-password", { resetToken, newPassword });
  },

  // ✅ NEW: Phone availability check
  checkPhoneAvailability: (phone) => {
    return api.get(`/auth/check-phone/${phone}`);
  },

  // ✅ Optional: Add method to get new access token using refresh token
  getNewAccessToken: (refreshToken) => {
    return api.post("/auth/refresh-token", { refreshToken });
  },
};
