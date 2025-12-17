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
    <section>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
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
                <div className="bg-white rounded-lg p-3 shadow-xs hover:shadow-md border border-gray-100 hover:border-blue-300 transition-all duration-200 h-full">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`${category.color} p-2 rounded-full`}>
                      <category.icon size={18} className="text-white" />
                    </div>
                    <h3 className="text-xs font-medium text-gray-800 line-clamp-1 text-center">
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
