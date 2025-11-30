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
};
