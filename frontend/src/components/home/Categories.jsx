import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Shirt,
  Home,
  Heart,
  BookOpen,
  Dumbbell,
} from "lucide-react";

const Categories = () => {
  const categories = [
    {
      name: "Electronics",
      icon: Smartphone,
      description: "Latest gadgets and devices",
      path: "/products?category=electronics",
      color: "bg-blue-500",
    },
    {
      name: "Fashion",
      icon: Shirt,
      description: "Trendy clothes and accessories",
      path: "/products?category=fashion",
      color: "bg-pink-500",
    },
    {
      name: "Home & Garden",
      icon: Home,
      description: "Everything for your home",
      path: "/products?category=home",
      color: "bg-green-500",
    },
    {
      name: "Health & Beauty",
      icon: Heart,
      description: "Wellness and beauty products",
      path: "/products?category=health",
      color: "bg-red-500",
    },
    {
      name: "Books",
      icon: BookOpen,
      description: "Books for every reader",
      path: "/products?category=books",
      color: "bg-purple-500",
    },
    {
      name: "Sports",
      icon: Dumbbell,
      description: "Fitness and sports equipment",
      path: "/products?category=sports",
      color: "bg-orange-500",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of product categories
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <Link to={category.path}>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-primary-200">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`${category.color} p-3 rounded-xl text-black`}
                    >
                      <category.icon size={32} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {category.description}
                      </p>
                    </div>
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
