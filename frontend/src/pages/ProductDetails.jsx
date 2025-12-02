import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  ArrowLeft,
  Check,
  Package,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchProductById } from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProduct, loading } = useAppSelector((state) => state.products);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (currentProduct?.product) {
      const product = currentProduct.product;
      dispatch(
        addToCart({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
          quantity: quantity,
          maxQuantity: product.inventory,
        })
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && currentProduct?.product) {
      try {
        await navigator.share({
          title: currentProduct.product.name,
          text: currentProduct.product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    }
  };

  const handleQuantityChange = (type) => {
    if (type === "increment") {
      setQuantity((prev) =>
        Math.min(prev + 1, currentProduct?.product?.inventory || 99)
      );
    } else {
      setQuantity((prev) => Math.max(1, prev - 1));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="bg-gray-200 rounded-2xl h-96"></div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 rounded-lg w-20 h-20"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-gray-300 text-7xl mb-6">😕</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Product not found
          </h1>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all duration-200 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const { product, reviews } = currentProduct;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
              <Check size={20} />
              <span className="font-medium">Added to cart successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-1 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Products
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{product.category}</span>
          <span className="text-gray-300">/</span>
          <span className="text-primary-600 font-semibold truncate">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="relative">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
              >
                <img
                  src={
                    product.images?.[selectedImage] ||
                    "/api/placeholder/600/600"
                  }
                  alt={product.name}
                  className="w-full h-[500px] object-contain p-8"
                />
              </motion.div>

              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === 0 ? product.images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === product.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                      selectedImage === index
                        ? "border-primary-600 ring-2 ring-primary-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image || "/api/placeholder/100/100"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      {product.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      by {product.brand}
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-2 transition-colors ${
                      isWishlisted
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={`${
                        i < Math.floor(product.ratings?.average || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.ratings?.average?.toFixed(1) || "0.0"} (
                  {product.ratings?.count || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="text-5xl font-bold text-primary-600 mb-8">
                ${product.price.toFixed(2)}
                <span className="text-sm text-gray-500 font-normal ml-2">
                  {product.inventory > 0
                    ? `${product.inventory} in stock`
                    : "Out of stock"}
                </span>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Truck className="text-primary-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Shield className="text-primary-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">
                      2-Year Warranty
                    </p>
                    <p className="text-sm text-gray-600">Full coverage</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Package className="text-primary-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">Easy Returns</p>
                    <p className="text-sm text-gray-600">30-day policy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Check className="text-green-600" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900">In Stock</p>
                    <p className="text-sm text-gray-600">Ready to ship</p>
                  </div>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange("decrement")}
                        disabled={quantity <= 1}
                        className="px-4 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="px-6 py-3 border-x border-gray-300 text-lg font-semibold">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange("increment")}
                        disabled={quantity >= product.inventory}
                        className="px-4 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {product.inventory} available
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.inventory === 0}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-black py-4 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <ShoppingCart size={24} />
                  {product.inventory === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="border-b border-gray-200">
                <div className="flex">
                  {["description", "specifications", "reviews"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 text-lg font-medium transition-all duration-200 ${
                        activeTab === tab
                          ? "text-primary-600 border-b-2 border-primary-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8">
                {activeTab === "description" && (
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div className="space-y-4">
                    {product.attributes ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(product.attributes).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                            >
                              <span className="text-gray-600">{key}</span>
                              <span className="font-medium text-gray-900">
                                {value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        No specifications available.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    {reviews?.items?.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.items.map((review, index) => (
                          <div
                            key={index}
                            className="p-6 border border-gray-200 rounded-xl hover:border-primary-200 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={16}
                                        className={`${
                                          i < review.rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {review.title}
                                  </span>
                                  {review.isVerified && (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      <Check size={12} />
                                      Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600">
                                  {review.comment}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {new Date(
                                  review.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-300 text-5xl mb-4">💬</div>
                        <p className="text-gray-600 mb-6">
                          No reviews yet. Be the first to review this product!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
