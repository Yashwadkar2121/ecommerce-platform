import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List, Star } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchProducts, setFilters } from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";

const Products = () => {
  const dispatch = useAppDispatch();
  const {
    items: products,
    loading,
    filters,
    pagination,
  } = useAppSelector((state) => state.products);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    dispatch(setFilters(localFilters));
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setLocalFilters(resetFilters);
    dispatch(setFilters(resetFilters));
  };

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
      })
    );
  };

  const categories = [
    "Electronics",
    "Fashion",
    "Home",
    "Sports",
    "Books",
    "Beauty",
  ];
  const brands = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "LG"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <p className="text-gray-600 mt-2">
              Showing {products.length} of {pagination.total} products
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600"
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600"
                }`}
              >
                <List size={20} />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-64 bg-white p-6 rounded-lg shadow-md h-fit"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Reset
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={localFilters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <select
                  value={localFilters.brand}
                  onChange={(e) => handleFilterChange("brand", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={localFilters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="createdAt">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                  <option value="ratings.average">Rating</option>
                </select>
              </div>

              <button
                onClick={applyFilters}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Apply Filters
              </button>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-w-1 aspect-h-1">
                      <img
                        src={product.images[0] || "/api/placeholder/300/300"}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={`${
                                i < Math.floor(product.ratings?.average || 0)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          ({product.ratings?.count || 0})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary-600">
                          ${product.price}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6"
                  >
                    <img
                      src={product.images[0] || "/api/placeholder/300/300"}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={`${
                                i < Math.floor(product.ratings?.average || 0)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          ({product.ratings?.count || 0})
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-2xl font-bold text-primary-600">
                        ${product.price}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
