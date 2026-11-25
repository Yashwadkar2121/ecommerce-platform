import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ImagePlus,
  X,
  Loader2,
  Search,
} from "lucide-react";
import { adminService, uploadImage } from "../../services/adminService";
import { optimizedImage, handleImageError } from "../../utils/image";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home",
  "Health",
  "Books",
  "Sports",
  "Groceries",
  "Automotive",
  "Entertainment",
  "Toys",
];
const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 5;
const PAGE_SIZE = 20;

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "",
  subcategory: "",
  brand: "",
  inventory: "",
  tags: "",
  attributes: "",
  isActive: true,
  images: [],
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const buttonSecondary =
  "inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition-colors";

const errorText = (err, fallback) => {
  const data = err?.response?.data;
  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details.map((d) => d.message || d).join(" ");
  }
  return data?.error || err?.message || fallback;
};

const money = (value) =>
  `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "key: value" per line  <->  { key: "value" }
const parseAttributes = (text) => {
  const result = {};
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const index = line.indexOf(":");
      if (index > 0) {
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim();
        if (key && value) result[key] = value;
      }
    });
  return result;
};

const attributesToText = (attributes = {}) =>
  Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

const productToForm = (product) => ({
  name: product.name || "",
  description: product.description || "",
  price: String(product.price ?? ""),
  category: product.category || "",
  subcategory: product.subcategory || "",
  brand: product.brand || "",
  inventory: String(product.inventory ?? ""),
  tags: (product.tags || []).join(", "),
  attributes: attributesToText(product.attributes),
  isActive: product.isActive !== false,
  images: product.images || [],
});

// ---------------------------------------------------------------------------
// Create / edit form (shown in a dialog)
// ---------------------------------------------------------------------------
const ProductForm = ({ product, onClose, onSaved }) => {
  const [form, setForm] = useState(product ? productToForm(product) : EMPTY_FORM);
  const [uploading, setUploading] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // allow choosing the same file again
    if (files.length === 0) return;

    setError("");
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not an image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`"${file.name}" is larger than ${MAX_IMAGE_MB} MB.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const url = await uploadImage(file);
        setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
      } catch (err) {
        setError(errorText(err, "Image upload failed."));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (files.length > room) {
      setError(`Only ${MAX_IMAGES} images are allowed - the rest were skipped.`);
    }
  };

  const removeImage = (index) =>
    set(
      "images",
      form.images.filter((_, i) => i !== index)
    );

  const makeCover = (index) => {
    const next = [...form.images];
    const [picked] = next.splice(index, 1);
    set("images", [picked, ...next]);
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const { data } = await adminService.generateDescription({
        name: form.name,
        category: form.category,
        subcategory: form.subcategory,
        brand: form.brand,
        attributes: parseAttributes(form.attributes),
      });
      set("description", data.description);
    } catch (err) {
      setError(errorText(err, "Could not generate a description."));
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.images.length === 0) {
      setError("Add at least one product image.");
      return;
    }
    if (uploading > 0) {
      setError("Please wait for the images to finish uploading.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      subcategory: form.subcategory.trim(),
      brand: form.brand.trim(),
      inventory: Number(form.inventory),
      images: form.images,
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      attributes: parseAttributes(form.attributes),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (product) {
        await adminService.updateProduct(product._id, payload);
      } else {
        await adminService.createProduct(payload);
      }
      onSaved(product ? "Product updated." : "Product added.");
    } catch (err) {
      setError(errorText(err, "Could not save the product."));
      setSaving(false);
    }
  };

  const canGenerate = form.name.trim() && form.category.trim() && !generating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="product-form-title" className="text-lg font-semibold text-gray-900">
            {product ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 text-gray-500 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images ({form.images.length}/{MAX_IMAGES}) - the first one is the cover
            </label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, index) => (
                <div
                  key={url}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={optimizedImage(url, 200)}
                    onError={handleImageError}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-indigo-600 text-white text-[10px] text-center py-0.5">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => makeCover(index)}
                        className="text-[11px] text-white underline"
                      >
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-[11px] text-white underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {Array.from({ length: uploading }).map((_, i) => (
                <div
                  key={`uploading-${i}`}
                  className="w-24 h-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"
                >
                  <Loader2 className="animate-spin text-gray-400" size={22} />
                </div>
              ))}

              {form.images.length + uploading < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:text-indigo-600 text-gray-500 flex flex-col items-center justify-center gap-1 text-xs transition-colors"
                >
                  <ImagePlus size={22} />
                  Upload
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, WebP or AVIF, up to {MAX_IMAGE_MB} MB each.
            </p>
          </div>

          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input id="name" name="name" value={form.name} onChange={handleChange} className={inputClass} required minLength={3} maxLength={200} />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input id="brand" name="brand" value={form.brand} onChange={handleChange} className={inputClass} required minLength={2} maxLength={100} />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input id="category" name="category" value={form.category} onChange={handleChange} list="category-options" className={inputClass} required minLength={2} maxLength={100} />
              <datalist id="category-options">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory (optional)
              </label>
              <input id="subcategory" name="subcategory" value={form.subcategory} onChange={handleChange} className={inputClass} maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input id="price" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input id="inventory" name="inventory" type="number" min="0" step="1" value={form.inventory} onChange={handleChange} className={inputClass} required />
              </div>
            </div>
          </div>

          {/* Description + AI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                title={canGenerate ? "Write a description with AI" : "Enter a name and category first"}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                Write with AI
              </button>
            </div>
            <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} className={inputClass} required minLength={10} maxLength={2000} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="wireless, bluetooth" className={inputClass} />
            </div>
            <div>
              <label htmlFor="attributes" className="block text-sm font-medium text-gray-700 mb-1">
                Details (one per line, like <code>color: Black</code>)
              </label>
              <textarea id="attributes" name="attributes" rows={3} value={form.attributes} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Visible in the shop
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className={buttonSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading > 0} className={buttonPrimary}>
            {saving && <Loader2 className="animate-spin" size={16} />}
            {product ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product list
// ---------------------------------------------------------------------------
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, product = edit
  const [busyId, setBusyId] = useState(null);

  // wait until the admin stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminService.getProducts({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(errorText(err, "Could not load products."));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleSaved = (message) => {
    setEditing(null);
    setNotice(message);
    load();
  };

  const toggleActive = async (product) => {
    setBusyId(product._id);
    try {
      await adminService.updateProduct(product._id, { isActive: !product.isActive });
      setNotice(product.isActive ? "Product hidden from the shop." : "Product is visible again.");
      await load();
    } catch (err) {
      setError(errorText(err, "Could not update the product."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}" permanently?`)) return;
    setBusyId(product._id);
    try {
      await adminService.deleteProduct(product._id);
      setNotice("Product deleted.");
      await load();
    } catch (err) {
      setError(errorText(err, "Could not delete the product."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-600">
              {pagination.total.toLocaleString()} products in the catalogue
            </p>
          </div>
          <button onClick={() => setEditing({})} className={buttonPrimary}>
            <Plus size={16} /> Add product
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, brand or category"
              className={`${inputClass} pl-9`}
              aria-label="Search products"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={`${inputClass} sm:w-44`}
            aria-label="Filter by status"
          >
            <option value="">All products</option>
            <option value="active">Visible</option>
            <option value="inactive">Hidden</option>
          </select>
        </div>

        <div aria-live="polite">
          {notice && (
            <p className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}
          {error && (
            <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin inline-block" size={20} />
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product._id} className={busyId === product._id ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={optimizedImage(product.images?.[0], 96)}
                        onError={handleImageError}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[16rem]">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(product.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={product.inventory === 0 ? "text-red-600 font-medium" : ""}>
                      {product.inventory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {product.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(product)}
                        className="p-2 text-gray-500 hover:text-indigo-600"
                        aria-label={`Edit ${product.name}`}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        disabled={busyId === product._id}
                        className="p-2 text-gray-500 hover:text-indigo-600"
                        aria-label={product.isActive ? `Hide ${product.name}` : `Show ${product.name}`}
                        title={product.isActive ? "Hide from shop" : "Show in shop"}
                      >
                        {product.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={busyId === product._id}
                        className="p-2 text-gray-500 hover:text-red-600"
                        aria-label={`Delete ${product.name}`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className={buttonSecondary}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages || loading}
              className={buttonSecondary}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <ProductForm
          product={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminProducts;
