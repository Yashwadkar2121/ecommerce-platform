import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, Tag, Star, DollarSign } from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { setFilters, clearFilters } from "../../store/slices/productSlice";

// Compact Filter Dropdown Component
const CompactFilterDropdown = ({
  label,
  icon: Icon,
  options,
  selectedValue,
  onSelect,
  placeholder = "All",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed border-gray-200"
            : "hover:border-primary-500 hover:shadow-sm cursor-pointer"
        } ${
          isOpen
            ? "border-primary-500 ring-2 ring-primary-100 shadow-sm"
            : "border-gray-200"
        } ${selectedValue ? "text-gray-900" : "text-gray-500"}`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-gray-400 flex-shrink-0" />
          <div className="text-left">
            <div className="text-xs text-gray-500 font-medium">{label}</div>
            <div className="text-sm font-medium truncate max-w-[120px]">
              {selectedValue || placeholder}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          } ${disabled ? "opacity-50" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden"
          >
            <div className="sticky top-0 bg-white p-2 border-b">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="py-1 max-h-52 overflow-y-auto">
              <button
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between transition-colors ${
                  !selectedValue
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-700"
                }`}
              >
                <span className="text-sm">All {label}s</span>
                {!selectedValue && (
                  <div className="w-2 h-2 rounded-full bg-primary-600" />
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
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between transition-colors ${
                      selectedValue === option
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="text-sm truncate">{option}</span>
                    {selectedValue === option && (
                      <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-gray-400 text-sm">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Price Range Filter Component
const PriceRangeFilter = ({ priceRange, setPriceRange, onApply }) => {
  const [localRange, setLocalRange] = useState(priceRange);

  const handleApply = () => {
    setPriceRange(localRange);
    onApply(localRange);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal values
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setLocalRange({ ...localRange, [field]: value });
    }
  };

  // Update local state when props change
  useEffect(() => {
    setLocalRange(priceRange);
  }, [priceRange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Min"
            value={localRange.min}
            onChange={(e) => handleInputChange(e, "min")}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
        <span className="text-gray-400">-</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Max"
            value={localRange.max}
            onChange={(e) => handleInputChange(e, "max")}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      <button
        onClick={handleApply}
        className="w-full bg-primary-600 hover:bg-primary-700 text-black py-2.5 rounded-lg transition-all duration-200 text-sm font-medium active:scale-[0.98] shadow-sm"
      >
        Apply Price Filter
      </button>
    </div>
  );
};

// Main FilterSection Component
const FilterSection = ({ filters, categories, products, onFilterChange }) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

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
        brand: "",
      })
    );
  };

  const handleBrandChange = (value) => {
    dispatch(setFilters({ ...filters, brand: value }));
  };

  const handlePriceApply = (range) => {
    dispatch(
      setFilters({
        ...filters,
        minPrice: range.min,
        maxPrice: range.max,
      })
    );
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
    setLocalPriceRange({ min: "", max: "" });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.category || filters.brand || filters.minPrice || filters.maxPrice
    );
  }, [filters.category, filters.brand, filters.minPrice, filters.maxPrice]);

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary-600 text-black p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all duration-200 active:scale-95 group"
      >
        <Filter
          size={22}
          className="group-hover:rotate-12 transition-transform"
        />
        {hasActiveFilters && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-black">
              {
                [
                  filters.category,
                  filters.brand,
                  filters.minPrice || filters.maxPrice,
                ].filter(Boolean).length
              }
            </span>
          </div>
        )}
      </button>

      {/* Mobile Filter Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-full max-w-sm bg-white z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                    {hasActiveFilters && (
                      <p className="text-sm text-primary-600 font-medium mt-1">
                        {
                          [
                            filters.category,
                            filters.brand,
                            filters.minPrice || filters.maxPrice,
                          ].filter(Boolean).length
                        }{" "}
                        active
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Category Filter */}
                  <div>
                    <CompactFilterDropdown
                      label="Category"
                      icon={Tag}
                      options={categories}
                      selectedValue={filters.category}
                      onSelect={handleCategoryChange}
                      placeholder="All Categories"
                    />
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <CompactFilterDropdown
                      label="Brand"
                      icon={Star}
                      options={brandsToShow}
                      selectedValue={filters.brand}
                      onSelect={handleBrandChange}
                      placeholder="All Brands"
                      disabled={!filters.category && categories.length > 0}
                    />
                    {filters.category && (
                      <p className="mt-2 text-xs text-gray-400">
                        Brands in{" "}
                        <span className="font-medium">{filters.category}</span>
                      </p>
                    )}
                  </div>

                  {/* Price Range Filter */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={18} className="text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-700">
                        Price Range
                      </h3>
                    </div>
                    <PriceRangeFilter
                      priceRange={localPriceRange}
                      setPriceRange={setLocalPriceRange}
                      onApply={handlePriceApply}
                    />
                  </div>

                  {/* Clear All Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-lg transition-colors text-sm font-medium border border-red-200 active:scale-[0.98]"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              {hasActiveFilters && (
                <p className="text-xs text-primary-600 font-medium mt-1">
                  {
                    [
                      filters.category,
                      filters.brand,
                      filters.minPrice || filters.maxPrice,
                    ].filter(Boolean).length
                  }{" "}
                  active
                </p>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Category Filter */}
            <div>
              <CompactFilterDropdown
                label="Category"
                icon={Tag}
                options={categories}
                selectedValue={filters.category}
                onSelect={handleCategoryChange}
                placeholder="All Categories"
              />
            </div>

            {/* Brand Filter */}
            <div>
              <CompactFilterDropdown
                label="Brand"
                icon={Star}
                options={brandsToShow}
                selectedValue={filters.brand}
                onSelect={handleBrandChange}
                placeholder="All Brands"
              />
              {filters.category && (
                <p className="mt-2 text-xs text-gray-400">
                  Brands in{" "}
                  <span className="font-medium">{filters.category}</span>
                </p>
              )}
            </div>

            {/* Price Range Filter */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={18} className="text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">
                  Price Range
                </h3>
              </div>
              <PriceRangeFilter
                priceRange={localPriceRange}
                setPriceRange={setLocalPriceRange}
                onApply={handlePriceApply}
              />
            </div>
          </div>

          {/* Clear All Button - Desktop */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="w-full mt-6 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-lg transition-colors text-sm font-medium border border-red-200 active:scale-[0.98]"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterSection;
