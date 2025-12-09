import { motion } from "framer-motion";
import { Star, Eye } from "lucide-react";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/cartSlice";
import { Link } from "react-router-dom";

const ProductCard = ({ product, index }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        quantity: 1,
        maxQuantity: product.inventory,
      })
    );

    // Optional: Add haptic feedback on mobile
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="block">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.02 }}
        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
      >
        <div className="relative overflow-hidden aspect-square">
          <img
            src={product.images?.[0] || "/api/placeholder/400/400"}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.inventory === 0 && (
            <div className="absolute top-3 right-3 bg-red-600 text-black text-xs font-bold px-3 py-1 rounded-full">
              Sold Out
            </div>
          )}
          {product.ratings?.average >= 4.5 && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={12} className="fill-current" />
              {product.ratings.average.toFixed(1)}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Eye size={20} className="text-gray-900" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 text-sm md:text-base">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
          </div>

          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={`${
                    i < Math.floor(product.ratings?.average || 0)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-2">
              ({product.ratings?.count || 0})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-primary-600">
                ${product.price.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.inventory === 0}
              className="bg-primary-600 hover:bg-primary-700 text-black px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
            >
              {product.inventory === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
