// services/productService.js
const Product = require("../models/mongodb/Product");
const Review = require("../models/mongodb/Review");
const { client } = require("../utils/redis");

class ProductService {
  // Get all products with filtering, sorting, and pagination
  async getProducts(query) {
    const {
      page = 1,
      limit = 24,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    // Build filter object - ONLY active products for public
    const filter = { isActive: true };

    // FIX 1: Use exact matching for category
    if (category) {
      filter.category = category; // Exact match, not regex
    }

    // FIX 2: Use exact matching for brand
    if (brand) {
      filter.brand = brand; // Exact match, not regex
    }

    // Price range filter optimization
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Text search with index - only for name, description, brand
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options - optimized common sorts
    let sort = {};
    if (sortBy === "price" || sortBy === "createdAt") {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "ratings.average") {
      sort = { "ratings.average": -1 };
    } else if (sortBy === "name") {
      sort = { name: 1 };
    } else if (sortBy === "createdAt") {
      sort = { createdAt: -1 };
    }

    const queryLimit = parseInt(limit) || 24;
    const offset = (parseInt(page) - 1) * queryLimit;

    console.log("🚀 ProductService.getProducts() called with:");
    console.log("📋 Filter:", filter);
    console.log("🔍 Search term:", search);
    console.log("🏷️ Category:", category);
    console.log("🏢 Brand:", brand);

    try {
      // Use Promise.all for parallel execution
      const [products, total] = await Promise.all([
        Product.find(filter)
          .sort(sort)
          .limit(queryLimit)
          .skip(offset)
          .select(
            "_id name price brand category images inventory ratings description createdAt updatedAt",
          )
          .lean(),
        Product.countDocuments(filter),
      ]);

      console.log(`✅ Found ${products.length} products out of ${total} total`);

      const totalCount = Number(total) || 0;
      const totalPages = Math.ceil(totalCount / queryLimit);
      const currentPage = parseInt(page) || 1;

      return {
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
    } catch (error) {
      console.error("❌ Error in ProductService.getProducts:", error);
      throw error;
    }
  }

  // Get product by ID with reviews
  async getProductById(productId) {
    try {
      console.log(`🔍 Fetching product by ID: ${productId}`);

      const product = await Product.findById(productId).lean();

      if (!product) {
        console.log(`❌ Product not found: ${productId}`);
        throw new Error("Product not found");
      }

      if (!product.isActive) {
        console.log(`⚠️ Product is not active: ${productId}`);
        throw new Error("Product is not available");
      }

      console.log(`✅ Found product: ${product.name} (${product.category})`);

      // Get reviews in parallel
      const reviews = Review.find({ productId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return {
        product,
        reviews: {
          items: await reviews,
          averageRating: product.ratings.average,
          totalReviews: product.ratings.count,
        },
      };
    } catch (error) {
      console.error("❌ Error in ProductService.getProductById:", error);
      throw error;
    }
  }

  // Get all product categories
  async getProductCategories() {
    try {
      console.log("🔍 Fetching all product categories");

      const categories = await Product.distinct("category", { isActive: true })
        .sort()
        .limit(50);

      console.log(`✅ Found ${categories.length} categories:`, categories);

      return { categories };
    } catch (error) {
      console.error("❌ Error in ProductService.getProductCategories:", error);
      throw error;
    }
  }

  // Get all product brands
  async getProductBrands() {
    try {
      console.log("🔍 Fetching all product brands");

      const brands = await Product.distinct("brand", { isActive: true })
        .sort()
        .limit(100);

      console.log(`✅ Found ${brands.length} brands`);

      return { brands };
    } catch (error) {
      console.error("❌ Error in ProductService.getProductBrands:", error);
      throw error;
    }
  }

  // Add review to product
  async addProductReview(productId, userId, reviewData) {
    const { rating, title, comment } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      throw new Error("You have already reviewed this product");
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

    return {
      message: "Review added successfully",
      review,
      updatedAverage: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
    };
  }

  // Get brands by category
  async getBrandsByCategory(category) {
    try {
      console.log(`🔍 Fetching brands for category: ${category}`);

      const filter = { isActive: true };
      if (category) {
        // FIX: Use exact match for category
        filter.category = category;
      }

      const brands = await Product.distinct("brand", filter).sort().limit(100);

      console.log(`✅ Found ${brands.length} brands for category ${category}`);

      return { brands };
    } catch (error) {
      console.error("❌ Error in ProductService.getBrandsByCategory:", error);
      throw error;
    }
  }

  // Search products with autocomplete
  async searchProducts(query, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { products: [], suggestions: [] };
    }

    const searchQuery = query.trim();

    // Search for products by name or description
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .limit(limit)
      .select("_id name price brand category images")
      .lean();

    // Get search suggestions (unique names)
    const suggestions = await Product.distinct("name", {
      isActive: true,
      name: { $regex: searchQuery, $options: "i" },
    }).limit(5);

    return { products, suggestions };
  }

  // Get related products
  async getRelatedProducts(productId, limit = 8) {
    const product = await Product.findById(productId).select("category brand");

    if (!product) {
      return { products: [] };
    }

    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      isActive: true,
      $or: [{ category: product.category }, { brand: product.brand }],
    })
      .limit(limit)
      .select("_id name price brand category images ratings")
      .lean();

    return { products: relatedProducts };
  }
}

module.exports = new ProductService();
