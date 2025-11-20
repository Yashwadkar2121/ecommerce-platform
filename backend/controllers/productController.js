const Product = require("../models/mongodb/Product");
const Review = require("../models/mongodb/Review");
const { paginate } = require("../utils/helpers");
const { client } = require("../utils/redis");

/**
 * Get all products (Public - only active products)
 */
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

    // Build filter object - ONLY active products for public
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
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * Get product by ID (Public - can see inactive products if accessed directly)
 */
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
    console.error("Get product by ID error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/**
 * Get all product categories (Public)
 */
const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/**
 * Get all product brands (Public)
 */
const getProductBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand", { isActive: true });
    res.json({ brands });
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};

/**
 * Add review to product (Authenticated users only)
 */
const addProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

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
      "ratings.average": parseFloat(averageRating.toFixed(1)),
      "ratings.count": reviews.length,
    });

    // Clear product cache
    await client.del(`cache:/api/products/${productId}`);

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(400).json({ error: "Failed to add review" });
  }
};


module.exports = {
  getProducts,
  getProductById,
  getProductCategories,
  getProductBrands,
  addProductReview,
};
