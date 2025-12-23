// pages/NotFound.tsx
import { Link } from "react-router-dom";
import { Home, ShoppingBag, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto"
      >
        {/* Error Code */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative mb-8"
        >
          <div className="text-9xl font-bold text-gray-200 select-none">
            404
          </div>
        </motion.div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for seems to have wandered off. Let's
          get you back to shopping.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/"
            className="group inline-flex items-center justify-center px-6 py-3 text-base font-medium text-black bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
            <span className="ml-2 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>

          <Link
            to="/cart"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            View Cart
          </Link>
        </div>

        {/* Search Suggestion */}
        <div className="my-8">
          <p className="text-gray-500 text-sm">
            Can't find what you're looking for? Try our{" "}
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              search
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
