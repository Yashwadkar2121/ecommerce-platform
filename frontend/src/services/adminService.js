import api from "./api";

export const adminService = {
  getProducts: (params = {}) => api.get("/admin/products", { params }),
  createProduct: (data) => api.post("/admin/products", data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getUploadSignature: () => api.get("/admin/uploads/signature"),
  generateDescription: (payload) => api.post("/admin/ai/description", payload),
};

// Uploads one image straight to Cloudinary and returns its https URL.
// The backend only signs the request, so the file never goes through our
// server. fetch() is used on purpose: the axios instance would also send our
// login token to Cloudinary.
export async function uploadImage(file) {
  const { data: sig } = await adminService.getUploadSignature();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", sig.timestamp);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowedFormats);
  form.append("signature", sig.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || "Image upload failed");
  }
  return result.secure_url;
}
