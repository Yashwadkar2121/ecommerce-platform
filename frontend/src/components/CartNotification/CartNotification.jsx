import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  X,
  ShoppingBag,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { removeNotification } from "../../store/slices/cartSlice";
import { Link } from "react-router-dom";

const MODERN_THEMES = {
  success: {
    icon: CheckCircle,
    bg: "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50",
    border: "border border-emerald-100/80",
    shadow: "shadow-lg shadow-emerald-500/10",
    iconColor: "text-emerald-600",
    glow: "from-emerald-500/20 to-transparent",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-gradient-to-br from-amber-50 via-white to-amber-50/50",
    border: "border border-amber-100/80",
    shadow: "shadow-lg shadow-amber-500/10",
    iconColor: "text-amber-600",
    glow: "from-amber-500/20 to-transparent",
  },
  info: {
    icon: Info,
    bg: "bg-gradient-to-br from-blue-50 via-white to-blue-50/50",
    border: "border border-blue-100/80",
    shadow: "shadow-lg shadow-blue-500/10",
    iconColor: "text-blue-600",
    glow: "from-blue-500/20 to-transparent",
  },
  default: {
    icon: ShoppingBag,
    bg: "bg-gradient-to-br from-gray-50 via-white to-primary-50/50",
    border: "border border-gray-100/80",
    shadow: "shadow-lg shadow-primary-500/10",
    iconColor: "text-primary-600",
    glow: "from-primary-500/20 to-transparent",
  },
};

const CartNotification = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.cart);

  const handleClose = useCallback(
    (id) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  useEffect(() => {
    const timers = notifications.map((n) =>
      setTimeout(() => handleClose(n.id), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, handleClose]);

  if (!notifications.length) return null;

  return (
    <div className="fixed top-24 right-6 z-[9999] space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((n, index) => {
          const theme = MODERN_THEMES[n.type] || MODERN_THEMES.default;
          const Icon = theme.icon;

          return (
            <motion.div
              key={n.id}
              initial={{
                opacity: 0,
                x: 100,
                y: -20,
                rotate: -2,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: index * -5, // Stack effect
                rotate: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: 100,
                transition: { duration: 0.2 },
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.05,
              }}
              style={{
                zIndex: 1000 - index,
                transformStyle: "preserve-3d",
                perspective: 1000,
              }}
              className="relative"
            >
              {/* Card */}
              <div
                className={`relative ${theme.bg} ${theme.border} ${theme.shadow} rounded-2xl p-4 backdrop-blur-sm w-80`}
              >
                {/* Glow Effect */}
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${theme.glow} rounded-2xl blur opacity-50`}
                ></div>

                <div className="relative flex items-start gap-3">
                  {/* Icon with badge */}
                  <div className="relative">
                    <div
                      className={`absolute -inset-2 ${theme.iconColor} opacity-10 blur rounded-full`}
                    ></div>
                    <Icon className={`relative h-6 w-6 ${theme.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {n.message}
                    </p>

                    {n.image && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={n.image}
                            alt="Product"
                            className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-lg"></div>
                        </div>
                        <Link
                          to="/cart"
                          onClick={() => handleClose(n.id)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 group"
                        >
                          View Details
                          <span className="group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => handleClose(n.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100/50 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Timer Progress */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-0.5 ${theme.iconColor} opacity-30 rounded-full`}
                />
              </div>

              {/* Subtle shadow for depth */}
              <div className="absolute inset-0 bg-black/5 blur-md -z-10 rounded-2xl"></div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CartNotification;
