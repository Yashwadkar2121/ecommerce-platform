import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, List, ChevronDown } from "lucide-react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  fetchProducts,
  fetchMoreProducts,
  setFilters,
  clearFilters,
} from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";

// Import the separate components
import Categories from "../components/Home/Categories";
import FilterSection from "../components/Product/FilterSection";
import InfiniteScrollLoader from "../components/Product/InfiniteScrollLoader";
import ProductCard from "../components/Product/ProductCard";

const Products = () => {
  const dispatch = useAppDispatch();
  const {
    items: products,
    loading,
    loadingMore,
    filters,
    pagination,
  } = useAppSelector((state) => state.products);

  // Add URL parameter handling
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [viewMode, setViewMode] = useState("grid");
  const [categories, setCategories] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  const displayedCount = useMemo(() => {
    if (products.length === 0) return 0;
    if (!pagination.hasMore || loadingMore) {
      return Math.min(products.length, pagination.total);
    }
    return products.length;
  }, [products.length, pagination.hasMore, pagination.total, loadingMore]);

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

  // Initialize filters from URL only once
  useEffect(() => {
    if (hasInitialized) return;

    // Read category from URL
    const categoryFromURL = searchParams.get("category");
    const searchFromURL = searchParams.get("search");
    const brandFromURL = searchParams.get("brand");
    const minPriceFromURL = searchParams.get("minPrice");
    const maxPriceFromURL = searchParams.get("maxPrice");

    // Build initial filters object
    const initialFilters = {};

    if (categoryFromURL) initialFilters.category = categoryFromURL;
    if (searchFromURL) initialFilters.search = searchFromURL;
    if (brandFromURL) initialFilters.brand = brandFromURL;
    if (minPriceFromURL) initialFilters.minPrice = minPriceFromURL;
    if (maxPriceFromURL) initialFilters.maxPrice = maxPriceFromURL;

    // Only update if there are URL params different from current filters
    if (Object.keys(initialFilters).length > 0) {
      dispatch(setFilters({ ...filters, ...initialFilters }));
    }

    setHasInitialized(true);
  }, [searchParams, dispatch, hasInitialized]);

  // Fetch products when filters change (excluding initial mount)
  useEffect(() => {
    if (!hasInitialized) return;

    // Debounce the fetch to avoid too many requests
    const timer = setTimeout(() => {
      dispatch(fetchProducts({ ...filters, limit: 24 }));
    }, 100);

    return () => clearTimeout(timer);
  }, [dispatch, filters, hasInitialized, location.key]); // Use location.key to detect navigation

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

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ ...filters, [key]: value, page: 1 }));
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.startsWith("-")
      ? [value.substring(1), "desc"]
      : [value, "asc"];
    const newFilters = { ...filters, sortBy, sortOrder, page: 1 };
    dispatch(setFilters(newFilters));
  };

  // Get category title for display
  const getCategoryTitle = () => {
    const categoryMap = {
      electronics: "Electronics",
      fashion: "Fashion",
      home: "Home & Garden",
      health: "Health & Beauty",
      books: "Books",
      sports: "Sports",
      groceries: "Groceries",
      automotive: "Automotive",
      entertainment: "Entertainment",
      toys: "Toys & Games",
    };

    if (filters.category) {
      return categoryMap[filters.category] || filters.category;
    }
    return null;
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
        {/* Categories Section */}
        <div className="mb-8">
          <Categories />
        </div>

        {/* Results and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="-name">Name: Z to A</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-8">
          {/* Sidebar Filter */}
          <FilterSection
            filters={filters}
            categories={categories}
            products={products}
            onFilterChange={handleFilterChange}
          />

          {/* Products Grid/List */}
          <div className="flex-1">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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
              /* List View */
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
                          src={
                            product.images?.[0] || "/api/placeholder/400/400"
                          }
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
                                    i <
                                    Math.floor(product.ratings?.average || 0)
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
                              dispatch(
                                addToCart({
                                  productId: product._id,
                                  name: product.name,
                                  price: product.price,
                                  image: product.images?.[0],
                                  quantity: 1,
                                  maxQuantity: product.inventory,
                                })
                              );
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
                  {filters.search
                    ? `No results for "${filters.search}"`
                    : filters.category
                    ? `No products found in ${getCategoryTitle()}`
                    : "No products found"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {filters.search
                    ? "Try a different search term or browse all products."
                    : filters.category
                    ? "Try browsing other categories or reset the filters."
                    : "Try adjusting your filter criteria to find what you're looking for."}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 hover:bg-primary-700 text-black px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                >
                  {filters.search || filters.category
                    ? "Browse All Products"
                    : "Reset All Filters"}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
