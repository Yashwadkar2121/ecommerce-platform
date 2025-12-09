import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, ChevronRight } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { Link } from "react-router-dom";

const QuickCartPreview = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { items, itemCount, total } = useAppSelector((state) => state.cart);

  if (itemCount === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={18} />
                  Your Cart ({itemCount})
                </h3>
                <Link
                  to="/cart"
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  onClick={() => setIsHovered(false)}
                >
                  View All
                </Link>
              </div>

              {/* Cart items preview */}
              <div className="max-h-60 overflow-y-auto space-y-3">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 object-cover rounded border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      ${(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}

                {items.length > 3 && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    +{items.length - 3} more items
                  </div>
                )}
              </div>

              {/* Total and checkout */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <Link
                  to="/checkout"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-black py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                  onClick={() => setIsHovered(false)}
                >
                  Proceed to Checkout
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickCartPreview;
