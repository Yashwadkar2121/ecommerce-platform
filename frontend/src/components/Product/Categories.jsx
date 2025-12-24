import React, { useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Shirt,
  Home,
  Heart,
  BookOpen,
  Dumbbell,
  Utensils,
  Car,
  Music,
  Gamepad2,
} from "lucide-react";

// Pre-defined categories data
const CATEGORIES_DATA = [
  { name: "Electronics", icon: Smartphone, color: "bg-blue-500" },
  { name: "Fashion", icon: Shirt, color: "bg-pink-500" },
  { name: "Home", icon: Home, color: "bg-green-500" },
  { name: "Health", icon: Heart, color: "bg-red-500" },
  { name: "Books", icon: BookOpen, color: "bg-purple-500" },
  { name: "Sports", icon: Dumbbell, color: "bg-orange-500" },
  { name: "Groceries", icon: Utensils, color: "bg-emerald-500" },
  { name: "Automotive", icon: Car, color: "bg-cyan-500" },
  { name: "Entertainment", icon: Music, color: "bg-indigo-500" },
  { name: "Toys", icon: Gamepad2, color: "bg-amber-500" },
];

// Individual Category Item Component (memoized for performance)
const CategoryItem = memo(({ category, index, onCategoryClick }) => {
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      onCategoryClick(category.name);
    },
    [category.name, onCategoryClick]
  );

  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      viewport={{ once: true, margin: "-50px" }}
      className="w-full"
    >
      <button
        onClick={handleClick}
        className="w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
        aria-label={`Browse ${category.name} products`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCategoryClick(category.name);
          }
        }}
      >
        <div className="group bg-white rounded-lg p-2 md:p-3 shadow-xs hover:shadow-md border border-gray-100 hover:border-blue-300 transition-all duration-200 h-full flex flex-col items-center">
          <div className="flex flex-col items-center space-y-1 md:space-y-2 w-full">
            <div
              className={`${category.color} p-1.5 md:p-2 rounded-full mb-0.5 transition-transform duration-200 group-hover:scale-110`}
              aria-hidden="true"
            >
              <Icon
                size={14}
                className="text-white md:w-4 md:h-4 transition-transform duration-200 group-hover:rotate-12"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-[8px] xs:text-[9px] sm:text-xs font-medium text-gray-800 truncate text-center w-full px-0.5 group-hover:text-blue-600 transition-colors duration-200">
              {category.name}
            </h3>
          </div>
        </div>
      </button>
    </motion.div>
  );
});

CategoryItem.displayName = "CategoryItem";

// Main Categories Component
const Categories = ({ onCategoryClick }) => {
  const handleCategoryClick = useCallback(
    (name) => {
      if (onCategoryClick) {
        onCategoryClick(name);
      }
    },
    [onCategoryClick]
  );

  const memoizedCategories = useMemo(
    () =>
      CATEGORIES_DATA.map((category, index) => (
        <CategoryItem
          key={`category-${category.name}-${index}`}
          category={category}
          index={index}
          onCategoryClick={handleCategoryClick}
        />
      )),
    [handleCategoryClick]
  );

  return (
    <section
      className="px-3 md:px-4"
      role="navigation"
      aria-label="Product categories"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-3"
          role="list"
          aria-label="Category list"
        >
          {memoizedCategories}
        </div>
      </div>
    </section>
  );
};

// Export memoized component
export default memo(Categories);
