import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchProductById } from "../store/slices/productSlice";
import { addToCart } from "../store/slices/cartSlice";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { currentProduct, loading } = useAppSelector((state) => state.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (currentProduct) {
      dispatch(
        addToCart({
          productId: currentProduct.product._id,
          name: currentProduct.product.name,
          price: currentProduct.product.price,
          image: currentProduct.product.images[0],
          quantity: quantity,
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Product not found
          </h1>
          <Link
            to="/products"
            className="text-primary-600 hover:text-primary-700"
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const { product, reviews } = currentProduct;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-primary-600">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <img
                src={
                  product.images[selectedImage] || "/api/placeholder/600/600"
                }
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                    selectedImage === index
                      ? "border-primary-600"
                      : "border-gray-300"
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
          </div>

          {/* Product Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center mb-4">
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
                <span className="text-gray-600 ml-2">
                  ({product.ratings?.count || 0} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="text-4xl font-bold text-primary-600 mb-6">
                ${product.price}
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Truck size={18} />
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield size={18} />
                  <span>2-year warranty</span>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.inventory === 0}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </button>

                <button className="p-3 border border-gray-300 rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors">
                  <Heart size={20} />
                </button>
              </div>

              {/* Stock Status */}
              {product.inventory > 0 ? (
                <p className="text-green-600 mb-2">
                  In Stock ({product.inventory} available)
                </p>
              ) : (
                <p className="text-red-600 mb-2">Out of Stock</p>
              )}

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Category:</span>
                    <span className="ml-2 text-gray-600">
                      {product.category}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Brand:</span>
                    <span className="ml-2 text-gray-600">{product.brand}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 mt-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Customer Reviews
              </h2>

              {reviews?.items?.length > 0 ? (
                <div className="space-y-6">
                  {reviews.items.map((review, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-6 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
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
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      {review.isVerified && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-2">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No reviews yet. Be the first to review this product!
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
