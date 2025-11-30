import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Truck, Shield } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Welcome to <span className="text-primary-600">ShopEasy</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Discover amazing products at unbeatable prices. From electronics
              to fashion, we have everything you need delivered right to your
              doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/products?category=electronics"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors duration-200"
              >
                Browse Electronics
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Truck className="h-6 w-6 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">
                  Free Shipping
                </span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Shield className="h-6 w-6 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">
                  Secure Payment
                </span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <ShoppingBag className="h-6 w-6 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">
                  Easy Returns
                </span>
              </div>
            </div>
          </motion.div>

          {/* Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 lg:p-12 shadow-2xl">
              <div className="aspect-square bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                <ShoppingBag className="h-32 w-32 text-white opacity-80" />
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -left-4 bg-yellow-400 rounded-full p-3 shadow-lg"
              >
                <span className="text-sm font-bold text-gray-900">50% OFF</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -right-4 bg-green-400 rounded-full p-3 shadow-lg"
              >
                <span className="text-sm font-bold text-gray-900">
                  Free Ship
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
