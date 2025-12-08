const Product = require("../models/mongodb/Product");
const Review = require("../models/mongodb/Review");
const { paginate } = require("../utils/helpers");
const { client } = require("../utils/redis");

/**
 * Get all products (Public - only active products) - Optimized
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24, // Increased for better infinite scroll
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Create cache key
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // Try to get from cache
    const cached = await client.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build filter object - ONLY active products for public
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    // Price range filter optimization
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Text search with index
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort options - optimized common sorts
    let sort = {};
    if (sortBy === "price" || sortBy === "createdAt") {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "ratings.average") {
      sort = { "ratings.average": -1 };
    } else if (sortBy === "name") {
      sort = { name: 1 };
    }

    const { limit: queryLimit, offset } = paginate(page, limit);

    // Use Promise.all for parallel execution
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .limit(queryLimit)
        .skip(offset)
        .select(
          "_id name price brand category images inventory ratings description"
        )
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Ensure total is a number
    const totalCount = Number(total) || 0;

    const totalPages = Math.ceil(totalCount / queryLimit);
    const currentPage = parseInt(page) || 1;

    const response = {
      products,
      pagination: {
        page: currentPage,
        limit: queryLimit,
        total: totalCount,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    };

    // Cache for 5 minutes
    await client.setEx(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * Get product by ID - Optimized with Redis
 */
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Try cache first
    const cacheKey = `product:${productId}`;
    const cached = await client.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get reviews in parallel
    const reviews = Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const response = {
      product,
      reviews: {
        items: await reviews,
        averageRating: product.ratings.average,
        totalReviews: product.ratings.count,
      },
    };

    // Cache for 10 minutes
    await client.setEx(cacheKey, 600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/**
 * Get all product categories - Optimized with caching
 */
const getProductCategories = async (req, res) => {
  try {
    const cacheKey = "product:categories";
    const cached = await client.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const categories = await Product.distinct("category", { isActive: true })
      .sort()
      .limit(50); // Limit to prevent too many categories

    const response = { categories };

    // Cache for 1 hour
    await client.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/**
 * Get all product brands - Optimized with caching
 */
const getProductBrands = async (req, res) => {
  try {
    const cacheKey = "product:brands";
    const cached = await client.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const brands = await Product.distinct("brand", { isActive: true })
      .sort()
      .limit(100); // Limit to prevent too many brands

    const response = { brands };

    // Cache for 1 hour
    await client.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
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

/**
 * Get brands by category (Public)
 */
const getBrandsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    const cacheKey = `product:brands:${category || "all"}`;
    const cached = await client.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const brands = await Product.distinct("brand", filter).sort().limit(100);

    const response = { brands };

    // Cache for 1 hour
    await client.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error("Get brands by category error:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductCategories,
  getProductBrands,
  addProductReview,
  getBrandsByCategory,
};
