import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown } from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { setFilters } from "../store/slices/productSlice";

// Define FilterDropdown component inside the same file
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

  // Filter options based on search term
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

// Define ActiveFilterBadge component
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

// Main FilterSection component
const FilterSection = ({
  filters,
  categories,
  products, // Get products from parent
  onFilterChange,
  localFilters,
}) => {
  const dispatch = useAppDispatch();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  // Extract all unique brands from all products
  const allBrands = useMemo(() => {
    return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  }, [products]);

  // Extract brands for current category
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

  // Brands to show in dropdown
  const brandsToShow = useMemo(() => {
    return filters.category && categoryBrands.length > 0
      ? categoryBrands
      : allBrands;
  }, [filters.category, categoryBrands, allBrands]);

  // Handle category change
  const handleCategoryChange = (value) => {
    onFilterChange("category", value);
    // Reset brand when category changes
    onFilterChange("brand", "");
    dispatch(
      setFilters({
        ...filters,
        category: value,
        brand: "", // Clear brand filter
      })
    );
  };

  // Handle brand change
  const handleBrandChange = (value) => {
    onFilterChange("brand", value);
    dispatch(setFilters({ ...filters, brand: value }));
  };

  // Price range handling
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
      case "search":
        onFilterChange("search", "");
        dispatch(setFilters({ ...filters, search: "" }));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-gray-700 font-medium text-sm">Active filters:</div>
        {filters.search && (
          <ActiveFilterBadge
            label="Search"
            value={filters.search}
            onClear={() => handleClearFilter("search")}
          />
        )}
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
            value={`$${filters.minPrice || "0"} - $${filters.maxPrice || "∞"}`}
            onClear={() => handleClearFilter("price")}
          />
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            onSelect={handleCategoryChange}
            placeholder="Select Category"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <FilterDropdown
            isOpen={isBrandOpen}
            setIsOpen={setIsBrandOpen}
            label="Brand"
            options={brandsToShow}
            selectedValue={localFilters.brand}
            onSelect={handleBrandChange}
            placeholder="Select Brand"
          />
          {filters.category && (
            <p className="mt-1 text-xs text-gray-500">
              Showing brands for {filters.category}
            </p>
          )}
          {!filters.category && (
            <p className="mt-1 text-xs text-gray-500">Showing all brands</p>
          )}
        </div>

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
              className="w-full bg-primary-600 hover:bg-primary-700 text-black py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Apply Price
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
