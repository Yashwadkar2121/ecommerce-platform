import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, Globe } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] lg:min-h-[90vh]">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="pt-12 lg:pt-0"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              New Collection 2024
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Elevate Your
              <span className="block text-primary-600">
                Shopping Experience
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
              Curated selection of premium products designed to inspire and
              transform your everyday life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/products"
                className="group inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-900 hover:text-gray-900 transition-colors duration-300"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-500">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-500">Premium Brands</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-500">Customer Support</div>
              </div>
            </div>
          </motion.div>

          {/* Hero Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-full"
          >
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-4 lg:space-y-6">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900">
                        Trending Now
                      </h3>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="aspect-square bg-gradient-to-br from-green-50 to-green-100 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900">
                        Global Brands
                      </h3>
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="space-y-4 lg:space-y-6 mt-8">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">
                        50%
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Summer Sale
                      </h3>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="aspect-square bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        New
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Arrivals Daily
                      </h3>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
