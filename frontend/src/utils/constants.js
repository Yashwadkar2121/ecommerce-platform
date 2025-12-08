export const API_BASE_URL = "http://localhost:5000/api";

export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home",
  "Sports",
  "Books",
  "Beauty",
  "Toys",
  "Automotive",
];

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const PAYMENT_METHODS = {
  STRIPE: "stripe",
  PAYPAL: "paypal",
};

export const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest" },
  { value: "price", label: "Price" },
  { value: "name", label: "Name" },
  { value: "ratings.average", label: "Rating" },
];
