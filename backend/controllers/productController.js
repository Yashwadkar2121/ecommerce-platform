// controllers/productController.js
const ProductService = require("../services/productService");
const { client } = require("../utils/redis");

// Get all products (Public - only active products)
const getProducts = async (req, res) => {
  try {
    // Create cache key
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // Try to get from cache
    const cached = await client.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await ProductService.getProducts(req.query);

    // Cache for 5 minutes
    await client.setEx(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Try cache first
    const cacheKey = `product:${productId}`;
    const cached = await client.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await ProductService.getProductById(productId);

    // Cache for 10 minutes
    await client.setEx(cacheKey, 600, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error("Get product by ID error:", error);
    if (error.message === "Product not found") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "Product is not available") {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  }
};

// Get all product categories
const getProductCategories = async (req, res) => {
  try {
    const cacheKey = "product:categories";
    const cached = await client.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await ProductService.getProductCategories();

    // Cache for 1 hour
    await client.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get all product brands
const getProductBrands = async (req, res) => {
  try {
    const cacheKey = "product:brands";
    const cached = await client.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await ProductService.getProductBrands();

    // Cache for 1 hour
    await client.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};

//  Add review to product (Authenticated users only)
const addProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await ProductService.addProductReview(
      productId,
      userId,
      req.body
    );

    // Clear product cache
    await client.del(`product:${productId}`);
    await client.del(`cache:/api/products/${productId}`);

    res.status(201).json(result);
  } catch (error) {
    console.error("Add review error:", error);
    if (error.message === "Product not found") {
      res.status(404).json({ error: error.message });
    } else if (
      error.message === "Rating must be between 1 and 5" ||
      error.message === "You have already reviewed this product"
    ) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "Failed to add review" });
    }
  }
};

// Get brands by category
const getBrandsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    const cacheKey = `product:brands:${category || "all"}`;
    const cached = await client.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await ProductService.getBrandsByCategory(category);

    // Cache for 1 hour
    await client.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error("Get brands by category error:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ products: [], suggestions: [] });
    }

    const result = await ProductService.searchProducts(q, parseInt(limit));

    res.json(result);
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
};

// Get related products
const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;

    const result = await ProductService.getRelatedProducts(
      productId,
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error("Get related products error:", error);
    res.status(500).json({ error: "Failed to fetch related products" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductCategories,
  getProductBrands,
  addProductReview,
  getBrandsByCategory,
  searchProducts,
  getRelatedProducts,
};
