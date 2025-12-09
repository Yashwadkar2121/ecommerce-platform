import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid, List, ChevronDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  fetchProducts,
  fetchMoreProducts,
  setFilters,
  clearFilters,
} from "../store/slices/productSlice";
import ProductCard from "../components/Product/ProductCard";
import FilterSection from "../components/Product/FilterSection";
import InfiniteScrollLoader from "../components/Product/InfiniteScrollLoader";

const Products = () => {
  const dispatch = useAppDispatch();
  const {
    items: products,
    loading,
    loadingMore,
    filters,
    pagination,
  } = useAppSelector((state) => state.products);

  const [viewMode, setViewMode] = useState("grid");
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Calculate displayed count correctly
  const displayedCount = useMemo(() => {
    if (products.length === 0) return 0;

    // If we're showing all products from infinite scroll, show total
    if (!pagination.hasMore || loadingMore) {
      return Math.min(products.length, pagination.total);
    }

    // Otherwise show current count
    return products.length;
  }, [products.length, pagination.hasMore, pagination.total, loadingMore]);

  // Debounced search
  const handleSearch = useCallback(
    (value) => {
      setLocalFilters((prev) => ({ ...prev, search: value }));

      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }

      const timeout = setTimeout(() => {
        dispatch(setFilters({ ...filters, search: value }));
      }, 500);

      setSearchDebounce(timeout);
    },
    [dispatch, filters, searchDebounce]
  );

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      const nextPage = pagination.page + 1;
      dispatch(
        fetchMoreProducts({
          ...filters,
          page: nextPage,
          limit: 24,
        })
      );
    }
  }, [dispatch, filters, loadingMore, pagination.page, pagination.hasMore]);

  // Initial load and filter changes
  useEffect(() => {
    dispatch(fetchProducts({ ...filters, limit: 24 }));
  }, [dispatch, filters]);

  // Fetch categories from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [
        ...new Set(products.map((p) => p.category).filter(Boolean)),
      ];
      setCategories((prev) =>
        [...new Set([...prev, ...uniqueCategories])].sort()
      );
    }
  }, [products]);

  // Sync local filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.startsWith("-")
      ? [value.substring(1), "desc"]
      : [value, "asc"];
    const newFilters = { ...filters, sortBy, sortOrder };
    dispatch(setFilters(newFilters));
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-square mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 text-center"
          >
            Discover Products
          </motion.h1>

          {/* Main Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products by name, brand, or description..."
                value={localFilters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm text-base"
              />
            </div>
          </div>

          {/* Filter Section */}
          <FilterSection
            filters={filters}
            categories={categories}
            products={products} // Pass products here
            onFilterChange={handleFilterChange}
            localFilters={localFilters}
          />

          {/* Results and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-6">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {displayedCount}
                </span>{" "}
                {pagination.total > 0 && (
                  <>
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {pagination.total}
                    </span>{" "}
                    products
                  </>
                )}
              </p>

              {/* Mobile View Toggle */}
              <div className="sm:hidden flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-600 text-black"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-600 text-black"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="flex items-center gap-4">
              {/* Desktop View Toggle */}
              <div className="hidden sm:flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-600 text-black"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-600 text-black"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={`${filters.sortOrder === "desc" ? "-" : ""}${
                    filters.sortBy
                  }`}
                  onChange={handleSortChange}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-[180px]"
                >
                  <option value="createdAt">Newest Arrivals</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="ratings.average">Highest Rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {products.map((product, index) => (
                <ProductCard
                  key={`${product._id}-${index}`}
                  product={product}
                  index={index % 20}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* List View - Optimized */
          <div className="space-y-4">
            {products.map((product, index) => (
              <motion.div
                key={`${product._id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index % 20) * 0.05 }}
                className="group bg-white rounded-xl shadow-md hover:shadow-lg p-4 transition-all duration-300 border border-gray-100 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-32 flex-shrink-0">
                    <img
                      src={product.images?.[0] || "/api/placeholder/400/400"}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-base md:text-lg truncate">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 truncate">
                          {product.brand} • {product.category}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right flex-shrink-0">
                        <span className="text-xl font-bold text-primary-600">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.inventory > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            {product.inventory} in stock
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-sm mx-0.5 ${
                                i < Math.floor(product.ratings?.average || 0)
                                  ? "bg-yellow-400"
                                  : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          {product.ratings?.count || 0} reviews
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Add to cart logic (you can add this back)
                        }}
                        disabled={product.inventory === 0}
                        className="bg-primary-600 hover:bg-primary-700 text-black px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                      >
                        {product.inventory === 0
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Loader */}
        {products.length > 0 && pagination.hasMore && (
          <InfiniteScrollLoader
            loadMore={handleLoadMore}
            hasMore={pagination.hasMore}
            loadingMore={loadingMore}
          />
        )}

        {/* Show end message when all products loaded */}
        {products.length > 0 && !pagination.hasMore && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              All {pagination.total} products loaded
            </p>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-gray-300 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No products found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find what you're
              looking for.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-primary-600 hover:bg-primary-700 text-black px-6 py-3 rounded-lg transition-all duration-200 font-medium"
            >
              Reset All Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Products;
