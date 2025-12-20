import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Filter } from "lucide-react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  fetchProducts,
  fetchMoreProducts,
  setFilters,
  clearFilters,
} from "../store/slices/productSlice";

// Import the separate components
import Categories from "../components/Home/Categories";
import FilterSection from "../components/Product/FilterSection";
import InfiniteScrollLoader from "../components/Product/InfiniteScrollLoader";
import ProductCard from "../components/Product/ProductCard";

// ActiveFilterBadge Component
const ActiveFilterBadge = ({ label, onClear, value }) => (
  <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:bg-primary-200 active:scale-95">
    <span className="truncate max-w-[120px] sm:max-w-[150px]">
      {label}: {value}
    </span>
    <button
      onClick={onClear}
      className="ml-1 hover:text-primary-900 flex-shrink-0 transition-colors"
    >
      <X size={14} />
    </button>
  </div>
);

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

  const handleClearFilter = (filterType) => {
    switch (filterType) {
      case "category":
        dispatch(setFilters({ ...filters, category: "" }));
        break;
      case "brand":
        dispatch(setFilters({ ...filters, brand: "" }));
        break;
      case "price":
        dispatch(setFilters({ ...filters, minPrice: "", maxPrice: "" }));
        break;
    }
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      // If default is selected, reset sort
      dispatch(setFilters({ ...filters, sortBy: "", sortOrder: "", page: 1 }));
    } else {
      const [sortBy, sortOrder] = value.startsWith("-")
        ? [value.substring(1), "desc"]
        : [value, "asc"];
      const newFilters = { ...filters, sortBy, sortOrder, page: 1 };
      dispatch(setFilters(newFilters));
    }
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

  // Calculate if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category || filters.brand || filters.minPrice || filters.maxPrice
    );
  }, [filters.category, filters.brand, filters.minPrice, filters.maxPrice]);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Categories Section */}
        <div className="mb-6 sm:mb-8">
          <Categories />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-b from-gray-50 to-white pt-2 pb-3 -mx-3 px-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            {/* Products Count */}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-semibold text-gray-900">
                  {displayedCount}
                </span>
                {pagination.total > 0 && (
                  <>
                    {" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {pagination.total}
                    </span>{" "}
                    products
                  </>
                )}
              </p>
              {/* Active Filters Count Badge */}
              {hasActiveFilters && (
                <p className="text-xs text-primary-600 font-medium mt-1">
                  {
                    [
                      filters.category && "1 category",
                      filters.brand && "1 brand",
                      (filters.minPrice || filters.maxPrice) && "price range",
                    ].filter(Boolean).length
                  }{" "}
                  active filter(s)
                </p>
              )}
            </div>

            {/* Mobile Sort Dropdown */}
            <div className="relative">
              <select
                value={`${filters.sortOrder === "desc" ? "-" : ""}${
                  filters.sortBy
                }`}
                onChange={handleSortChange}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-[140px]"
              >
                <option value="">Sort by: Default</option>
                <option value="price">Price: Low-High</option>
                <option value="-price">Price: High-Low</option>
                <option value="name">Name: A-Z</option>
                <option value="-name">Name: Z-A</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Active Filters Row - Mobile */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 overflow-x-auto pb-1"
            >
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                  Active filters:
                </span>
                <div className="flex gap-2">
                  {filters.category && (
                    <ActiveFilterBadge
                      label="Category"
                      value={filters.category}
                      onClear={() => handleClearFilter("category")}
                    />
                  )}
                  {filters.brand && (
                    <ActiveFilterBadge
                      label="Brand"
                      value={filters.brand}
                      onClear={() => handleClearFilter("brand")}
                    />
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <ActiveFilterBadge
                      label="Price"
                      value={`$${filters.minPrice || "0"}-$${
                        filters.maxPrice || "∞"
                      }`}
                      onClear={() => handleClearFilter("price")}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex flex-col gap-4 mb-8">
          {/* Top Row: Results and Sort */}
          <div className="flex items-center justify-between">
            {/* Results Count */}
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

              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
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
                <option value="">Sort by: Default</option>
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

          {/* Active Filters Row - Desktop */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm text-gray-600 font-medium">
                Active filters:
              </span>
              <div className="flex flex-wrap gap-2">
                {filters.category && (
                  <ActiveFilterBadge
                    label="Category"
                    value={filters.category}
                    onClear={() => handleClearFilter("category")}
                  />
                )}
                {filters.brand && (
                  <ActiveFilterBadge
                    label="Brand"
                    value={filters.brand}
                    onClear={() => handleClearFilter("brand")}
                  />
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <ActiveFilterBadge
                    label="Price"
                    value={`$${filters.minPrice || "0"} - $${
                      filters.maxPrice || "∞"
                    }`}
                    onClear={() => handleClearFilter("price")}
                  />
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar Filter */}
          <FilterSection
            filters={filters}
            categories={categories}
            products={products}
            onFilterChange={handleFilterChange}
          />

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
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
                className="text-center py-12 sm:py-16"
              >
                <div className="text-gray-300 text-5xl sm:text-6xl mb-4">
                  🔍
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {filters.search
                    ? `No results for "${filters.search}"`
                    : filters.category
                    ? `No products found in ${getCategoryTitle()}`
                    : "No products found"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
                  {filters.search
                    ? "Try a different search term or browse all products."
                    : filters.category
                    ? "Try browsing other categories or reset the filters."
                    : "Try adjusting your filter criteria to find what you're looking for."}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 hover:bg-primary-700 text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base active:scale-95"
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
