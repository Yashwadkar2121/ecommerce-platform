import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  fetchProducts,
  setFilters,
  clearFilters,
} from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";
import { productService } from "../services/productService";
import { Link } from "react-router-dom";

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
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchDebounce, setSearchDebounce] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts(filters));
    fetchFiltersData();
  }, [dispatch, filters]);

  useEffect(() => {
    // Sync local filters when Redux filters change
    setLocalFilters(filters);
  }, [filters]);

  const fetchFiltersData = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
      ]);
      setCategories(categoriesRes.data.categories || []);
      setBrands(brandsRes.data.brands || []);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    // Apply all filters including price range
    dispatch(setFilters(localFilters));
  };

  const handleSearch = (value) => {
    handleFilterChange("search", value);

    // Clear previous debounce
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Set new debounce
    const timeout = setTimeout(() => {
      dispatch(setFilters({ ...localFilters, search: value }));
    }, 500); // 500ms debounce

    setSearchDebounce(timeout);
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

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
  };

  const handlePriceChange = (type, value) => {
    const numValue = value === "" ? "" : parseFloat(value);
    handleFilterChange(type === "min" ? "minPrice" : "maxPrice", numValue);
  };

  const applyPriceRange = () => {
    // Apply price range specifically
    dispatch(
      setFilters({
        ...filters,
        minPrice: localFilters.minPrice,
        maxPrice: localFilters.maxPrice,
      })
    );
  };

  const clearAllFilters = () => {
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
    dispatch(clearFilters());
    setIsCategoryOpen(false);
    setIsBrandOpen(false);
  };

  const ActiveFilterBadge = ({ label, onClear, value }) => (
    <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
      <span>
        {label}: {value}
      </span>
      <button onClick={onClear} className="ml-1 hover:text-primary-900">
        <X size={14} />
      </button>
    </div>
  );

  const FilterDropdown = ({
    isOpen,
    setIsOpen,
    label,
    options,
    selectedValue,
    onSelect,
    placeholder = "Select...",
  }) => (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg hover:border-primary-500 transition-colors ${
          isOpen
            ? "border-primary-500 ring-2 ring-primary-100"
            : "border-gray-300"
        } ${selectedValue ? "text-gray-900 font-medium" : "text-gray-500"}`}
      >
        <span>{selectedValue || placeholder}</span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <div className="py-2">
              <button
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                  !selectedValue
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-700"
                }`}
              >
                <span>All {label}s</span>
                {!selectedValue && (
                  <Check size={16} className="text-primary-600" />
                )}
              </button>

              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                    selectedValue === option
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-700"
                  }`}
                >
                  <span>{option}</span>
                  {selectedValue === option && (
                    <Check size={16} className="text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
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

          {/* Quick Filters Row */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <FilterDropdown
                    isOpen={isCategoryOpen}
                    setIsOpen={setIsCategoryOpen}
                    label="Category"
                    options={categories}
                    selectedValue={localFilters.category}
                    onSelect={(value) => {
                      handleFilterChange("category", value);
                      // Apply immediately when selecting from dropdown
                      dispatch(setFilters({ ...filters, category: value }));
                    }}
                  />
                </div>

                {/* Brand Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <FilterDropdown
                    isOpen={isBrandOpen}
                    setIsOpen={setIsBrandOpen}
                    label="Brand"
                    options={brands}
                    selectedValue={localFilters.brand}
                    onSelect={(value) => {
                      handleFilterChange("brand", value);
                      // Apply immediately when selecting from dropdown
                      dispatch(setFilters({ ...filters, brand: value }));
                    }}
                  />
                </div>

                {/* Price Range Inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={localFilters.minPrice || ""}
                          onChange={(e) =>
                            handlePriceChange("min", e.target.value)
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && applyPriceRange()
                          }
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          min="0"
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={localFilters.maxPrice || ""}
                          onChange={(e) =>
                            handlePriceChange("max", e.target.value)
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && applyPriceRange()
                          }
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                    <button
                      onClick={applyPriceRange}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Apply Price Range
                    </button>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={applyFilters}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium text-sm lg:text-base"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 w-full"
              >
                <SlidersHorizontal size={18} />
                <span className="font-medium">More Filters</span>
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-gray-700 font-medium">Active filters:</div>

              {filters.search && (
                <ActiveFilterBadge
                  label="Search"
                  value={filters.search}
                  onClear={() => {
                    handleFilterChange("search", "");
                    dispatch(setFilters({ ...filters, search: "" }));
                  }}
                />
              )}

              {filters.category && (
                <ActiveFilterBadge
                  label="Category"
                  value={filters.category}
                  onClear={() => {
                    handleFilterChange("category", "");
                    dispatch(setFilters({ ...filters, category: "" }));
                    setIsCategoryOpen(false);
                  }}
                />
              )}

              {filters.brand && (
                <ActiveFilterBadge
                  label="Brand"
                  value={filters.brand}
                  onClear={() => {
                    handleFilterChange("brand", "");
                    dispatch(setFilters({ ...filters, brand: "" }));
                    setIsBrandOpen(false);
                  }}
                />
              )}

              {(filters.minPrice || filters.maxPrice) && (
                <ActiveFilterBadge
                  label="Price"
                  value={`$${filters.minPrice || "0"} - $${
                    filters.maxPrice || "∞"
                  }`}
                  onClear={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                    dispatch(
                      setFilters({ ...filters, minPrice: "", maxPrice: "" })
                    );
                  }}
                />
              )}

              {(filters.search ||
                filters.category ||
                filters.brand ||
                filters.minPrice ||
                filters.maxPrice) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-600 hover:text-primary-600 font-medium px-3 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear all
                </button>
              )}

              {!filters.search &&
                !filters.category &&
                !filters.brand &&
                !filters.minPrice &&
                !filters.maxPrice && (
                  <span className="text-gray-500 text-sm">
                    No filters applied
                  </span>
                )}
            </div>
          </div>

          {/* Results and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {products.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {pagination.total}
                </span>{" "}
                products
              </p>

              {/* Mobile View Toggle */}
              <div className="sm:hidden flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-600 text-white"
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
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-600 text-white"
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
                  onChange={(e) => {
                    const value = e.target.value;
                    const [sortBy, sortOrder] = value.startsWith("-")
                      ? [value.substring(1), "desc"]
                      : [value, "asc"];
                    const newFilters = { ...filters, sortBy, sortOrder };
                    dispatch(setFilters(newFilters));
                  }}
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

        {/* Mobile Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4">
                    Advanced Filters
                  </h3>

                  {/* Categories List for Mobile */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          handleFilterChange("category", "");
                          dispatch(setFilters({ ...filters, category: "" }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          !filters.category
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All
                      </button>
                      {categories.slice(0, 8).map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            handleFilterChange("category", category);
                            dispatch(setFilters({ ...filters, category }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            filters.category === category
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brands List for Mobile */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Brands</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          handleFilterChange("brand", "");
                          dispatch(setFilters({ ...filters, brand: "" }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          !filters.brand
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All
                      </button>
                      {brands.slice(0, 8).map((brand) => (
                        <button
                          key={brand}
                          onClick={() => {
                            handleFilterChange("brand", brand);
                            dispatch(setFilters({ ...filters, brand }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            filters.brand === brand
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range for Mobile */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Price Range
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.minPrice || ""}
                            onChange={(e) =>
                              handlePriceChange("min", e.target.value)
                            }
                            className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            min="0"
                          />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.maxPrice || ""}
                            onChange={(e) =>
                              handlePriceChange("max", e.target.value)
                            }
                            className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                      <button
                        onClick={applyPriceRange}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Apply Price Range
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid/List */}
        <div>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {products.map((product, index) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={
                            product.images?.[0] || "/api/placeholder/400/400"
                          }
                          alt={product.name}
                          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.inventory === 0 && (
                          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Sold Out
                          </div>
                        )}
                        {product.ratings?.average >= 4.5 && (
                          <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Star size={12} className="fill-current" />
                            {product.ratings.average.toFixed(1)}
                          </div>
                        )}
                        {/* View Details Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Eye size={20} className="text-gray-900" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 text-sm md:text-base">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.brand}
                          </p>
                        </div>

                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={`${
                                  i < Math.floor(product.ratings?.average || 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 ml-2">
                            ({product.ratings?.count || 0})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-primary-600">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.inventory === 0}
                            className="bg-primary-600 hover:bg-primary-700 text-black px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                          >
                            {product.inventory === 0
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              <AnimatePresence>
                {products.map((product, index) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white rounded-xl shadow-md hover:shadow-lg p-4 transition-all duration-300 border border-gray-100 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="sm:w-32">
                          <img
                            src={
                              product.images?.[0] || "/api/placeholder/400/400"
                            }
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-base md:text-lg">
                                {product.name}
                              </h3>
                              <p className="text-gray-600 text-sm mt-1">
                                {product.brand} • {product.category}
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0 text-right">
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
                                  <Star
                                    key={i}
                                    size={14}
                                    className={`${
                                      i <
                                      Math.floor(product.ratings?.average || 0)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                {product.ratings?.count || 0} reviews
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
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
                  </Link>
                ))}
              </AnimatePresence>
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
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
              >
                Reset All Filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
