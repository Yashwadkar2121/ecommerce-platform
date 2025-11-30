import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../store/slices/cartSlice";

const Cart = () => {
  const dispatch = useAppDispatch();
  const { items, total, itemCount } = useAppSelector((state) => state.cart);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start
              shopping to find amazing products!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6 mb-4"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image || "/api/placeholder/100/100"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-2xl font-bold text-primary-600">
                        ${item.price}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="p-2 text-gray-600 hover:text-gray-800"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 py-2 border-x border-gray-300 min-w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="p-2 text-gray-600 hover:text-gray-800"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-600">Item Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({itemCount})</span>
                  <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">
                    ${(total * 0.1).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">
                      ${(total + total * 0.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-center block"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/products"
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors font-semibold text-center block mt-3"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
