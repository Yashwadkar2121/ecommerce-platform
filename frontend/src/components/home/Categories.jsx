import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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

const Categories = () => {
  const categories = [
    {
      name: "Electronics",
      icon: Smartphone,
      path: "/products?category=electronics",
      color: "bg-blue-500",
    },
    {
      name: "Fashion",
      icon: Shirt,
      path: "/products?category=fashion",
      color: "bg-pink-500",
    },
    {
      name: "Home",
      icon: Home,
      path: "/products?category=home",
      color: "bg-green-500",
    },
    {
      name: "Health",
      icon: Heart,
      path: "/products?category=health",
      color: "bg-red-500",
    },
    {
      name: "Books",
      icon: BookOpen,
      path: "/products?category=books",
      color: "bg-purple-500",
    },
    {
      name: "Sports",
      icon: Dumbbell,
      path: "/products?category=sports",
      color: "bg-orange-500",
    },
    {
      name: "Groceries",
      icon: Utensils,
      path: "/products?category=groceries",
      color: "bg-emerald-500",
    },
    {
      name: "Auto",
      icon: Car,
      path: "/products?category=automotive",
      color: "bg-cyan-500",
    },
    {
      name: "Entertainment",
      icon: Music,
      path: "/products?category=entertainment",
      color: "bg-indigo-500",
    },
    {
      name: "Toys",
      icon: Gamepad2,
      path: "/products?category=toys",
      color: "bg-amber-500",
    },
  ];

  return (
    <section className="px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              className="w-full"
            >
              <Link to={category.path} className="block w-full">
                <div className="bg-white rounded-lg p-2 md:p-3 shadow-xs hover:shadow-md border border-gray-100 hover:border-blue-300 transition-all duration-200 h-full flex flex-col items-center">
                  <div className="flex flex-col items-center space-y-1 md:space-y-2 w-full">
                    <div
                      className={`${category.color} p-1.5 md:p-2 rounded-full mb-0.5`}
                    >
                      <category.icon
                        size={14}
                        className="text-white md:w-4 md:h-4"
                      />
                    </div>
                    <h3 className="text-[8px] xs:text-[9px] sm:text-xs font-medium text-gray-800 truncate text-center w-full px-0.5">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
