import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useAppSelector } from "../store/hooks";

const CartIcon = ({ onClick }) => {
  const { itemCount, lastAddedItem } = useAppSelector((state) => state.cart);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when item is added
  useEffect(() => {
    if (lastAddedItem) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  return (
    <div className="relative inline-block p-2" onClick={onClick}>
      {/* Shopping Cart Icon */}
      <motion.div
        animate={{
          scale: isAnimating ? 1.2 : 1,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        <ShoppingCart
          size={24}
          className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer"
        />
      </motion.div>

      {/* Cart Count Badge - ALWAYS show if itemCount > 0 */}
      {itemCount > 0 && (
        <motion.div
          key={itemCount} // Re-animate when count changes
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isAnimating ? 1.5 : 1,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 15,
          }}
          className="absolute top-1 -right-1 bg-primary-600 text-black rounded-full h-5 w-5 flex items-center justify-center bg-green-400"
        >
          <span className="text-xs font-bold">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        </motion.div>
      )}

      {/* Pulse animation effect */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-200"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  );
};

export default CartIcon;
