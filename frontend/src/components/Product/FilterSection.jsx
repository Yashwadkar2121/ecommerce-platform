import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Check, ChevronDown } from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { setFilters, clearFilters } from "../../store/slices/productSlice";

// FilterDropdown Component
const FilterDropdown = ({
  isOpen,
  setIsOpen,
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter(
    (option) =>
      option && option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed border-gray-200"
            : "hover:border-primary-500 cursor-pointer"
        } ${
          isOpen
            ? "border-primary-500 ring-2 ring-primary-100"
            : "border-gray-300"
        } ${selectedValue ? "text-gray-900 font-medium" : "text-gray-500"}`}
      >
        <span className="truncate">{selectedValue || placeholder}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${disabled ? "opacity-50" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            <div className="sticky top-0 bg-white p-2 border-b">
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="py-1 max-h-48 overflow-y-auto">
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
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
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
                    <span className="truncate">{option}</span>
                    {selectedValue === option && (
                      <Check
                        size={16}
                        className="text-primary-600 flex-shrink-0"
                      />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  No {label.toLowerCase()}s found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ActiveFilterBadge Component
const ActiveFilterBadge = ({ label, onClear, value }) => (
  <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium">
    <span className="truncate max-w-[150px]">
      {label}: {value}
    </span>
    <button
      onClick={onClear}
      className="ml-1 hover:text-primary-900 flex-shrink-0"
    >
      <X size={14} />
    </button>
  </div>
);

// FilterContent Component
const FilterContent = ({
  filters,
  categories,
  brandsToShow,
  priceRange,
  setPriceRange,
  isCategoryOpen,
  setIsCategoryOpen,
  isBrandOpen,
  setIsBrandOpen,
  handleCategoryChange,
  handleBrandChange,
  handlePriceApply,
  handleClearFilter,
  clearAllFilters,
}) => {
  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {(filters.category ||
        filters.brand ||
        filters.minPrice ||
        filters.maxPrice) && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Active Filters
          </h3>
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
        </div>
      )}

      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
        <FilterDropdown
          isOpen={isCategoryOpen}
          setIsOpen={setIsCategoryOpen}
          label="Category"
          options={categories}
          selectedValue={filters.category}
          onSelect={handleCategoryChange}
          placeholder="All Categories"
        />
      </div>

      {/* Brand Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Brand</h3>
        <FilterDropdown
          isOpen={isBrandOpen}
          setIsOpen={setIsBrandOpen}
          label="Brand"
          options={brandsToShow}
          selectedValue={filters.brand}
          onSelect={handleBrandChange}
          placeholder="All Brands"
        />
        {filters.category && (
          <p className="mt-1 text-xs text-gray-500">
            Showing brands for {filters.category}
          </p>
        )}
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                $
              </span>
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                min="0"
                step="0.01"
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
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <button
            onClick={handlePriceApply}
            className="w-full bg-primary-600 hover:bg-primary-700 text-black py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Apply Price Filter
          </button>
        </div>
      </div>

      {/* Clear All Button */}
      {(filters.category ||
        filters.brand ||
        filters.minPrice ||
        filters.maxPrice) && (
        <button
          onClick={clearAllFilters}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-lg transition-colors text-sm font-medium border border-gray-300"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

// Main FilterSection Component
const FilterSection = ({ filters, categories, products }) => {
  const dispatch = useAppDispatch();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });
  const [isOpen, setIsOpen] = useState(false);

  const allBrands = useMemo(() => {
    return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  }, [products]);

  const categoryBrands = useMemo(() => {
    if (!filters.category) return [];
    return [
      ...new Set(
        products
          .filter((p) => p.category === filters.category)
          .map((p) => p.brand)
          .filter(Boolean)
      ),
    ].sort();
  }, [products, filters.category]);

  const brandsToShow = useMemo(() => {
    return filters.category && categoryBrands.length > 0
      ? categoryBrands
      : allBrands;
  }, [filters.category, categoryBrands, allBrands]);

  const handleCategoryChange = (value) => {
    dispatch(
      setFilters({
        ...filters,
        category: value,
        brand: "", // Clear brand when category changes
      })
    );
  };

  const handleBrandChange = (value) => {
    dispatch(setFilters({ ...filters, brand: value }));
  };

  useEffect(() => {
    setPriceRange({
      min: filters.minPrice || "",
      max: filters.maxPrice || "",
    });
  }, [filters.minPrice, filters.maxPrice]);

  const handlePriceApply = () => {
    dispatch(
      setFilters({
        ...filters,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
      })
    );
  };

  const handleClearFilter = (filterType) => {
    switch (filterType) {
      case "category":
        handleCategoryChange("");
        setIsCategoryOpen(false);
        break;
      case "brand":
        handleBrandChange("");
        setIsBrandOpen(false);
        break;
      case "price":
        setPriceRange({ min: "", max: "" });
        dispatch(setFilters({ ...filters, minPrice: "", maxPrice: "" }));
        break;
    }
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
    setPriceRange({ min: "", max: "" });
  };

  return (
    <>
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary-600 text-black p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
      >
        <Filter size={24} />
      </button>

      {/* Mobile Filter Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-80 bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                <FilterContent
                  filters={filters}
                  categories={categories}
                  brandsToShow={brandsToShow}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  isCategoryOpen={isCategoryOpen}
                  setIsCategoryOpen={setIsCategoryOpen}
                  isBrandOpen={isBrandOpen}
                  setIsBrandOpen={setIsBrandOpen}
                  handleCategoryChange={handleCategoryChange}
                  handleBrandChange={handleBrandChange}
                  handlePriceApply={handlePriceApply}
                  handleClearFilter={handleClearFilter}
                  clearAllFilters={clearAllFilters}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            {(filters.category ||
              filters.brand ||
              filters.minPrice ||
              filters.maxPrice) && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          <FilterContent
            filters={filters}
            categories={categories}
            brandsToShow={brandsToShow}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            isCategoryOpen={isCategoryOpen}
            setIsCategoryOpen={setIsCategoryOpen}
            isBrandOpen={isBrandOpen}
            setIsBrandOpen={setIsBrandOpen}
            handleCategoryChange={handleCategoryChange}
            handleBrandChange={handleBrandChange}
            handlePriceApply={handlePriceApply}
            handleClearFilter={handleClearFilter}
            clearAllFilters={clearAllFilters}
          />
        </div>
      </div>
    </>
  );
};

export default FilterSection;
