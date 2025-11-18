const Product = require("../models/mongodb/Product");
const Review = require("../models/mongodb/Review");
const { paginate } = require("../utils/helpers");
const { client } = require("../utils/redis");

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const { limit: queryLimit, offset } = paginate(page, limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .limit(queryLimit)
        .skip(offset)
        .select("-__v"),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / queryLimit);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: true });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

const getProductBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand", { isActive: true });
    res.json({ brands });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};
// There show inactive products as well
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get reviews for this product
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      product,
      reviews: {
        items: reviews,
        averageRating: product.ratings.average,
        totalReviews: product.ratings.count,
      },
    });
  } catch (error) {
    console.error("Error in getProductById:", error); // Detailed logging
    res
      .status(500)
      .json({ error: "Failed to fetch product", details: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = new Product(productData);
    await product.save();

    await client.del("cache:/api/products*");

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(400).json({ error: "Failed to create product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Clear cache
    await client.del("cache:/api/products*");
    await client.del(`cache:/api/products/${productId}`);

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({ error: "Failed to update product" });
  }
};
// Soft Delete Implementation
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Clear cache
    await client.del("cache:/api/products*");

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};

const addProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this product" });
    }

    // Create review
    const review = new Review({
      productId,
      userId,
      rating,
      title,
      comment,
    });
    await review.save();

    // Update product ratings
    const reviews = await Review.find({ productId });
    const averageRating =
      reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      "ratings.average": averageRating,
      "ratings.count": reviews.length,
    });

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    res.status(400).json({ error: "Failed to add review" });
  }
};

module.exports = {
  getProducts,
  getProductCategories,
  getProductBrands,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
};
