import api from "./api";

export const productService = {
  getProducts: (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    return api.get(`/products?${params.toString()}`);
  },

  getProductById: (productId) => {
    return api.get(`/products/${productId}`);
  },

  getCategories: () => {
    return api.get("/products/categories");
  },

  getBrands: () => {
    return api.get("/products/brands");
  },

  getBrandsByCategory: (category) => {
    const params = new URLSearchParams();
    if (category) {
      params.append("category", category);
    }
    return api.get(`/products/brands-by-category?${params.toString()}`);
  },

  addReview: (productId, reviewData) => {
    return api.post(`/products/${productId}/reviews`, reviewData);
  },
};
