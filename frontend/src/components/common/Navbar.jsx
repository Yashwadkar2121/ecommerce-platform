import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Search, LogOut } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { toggleCart } from "../../store/slices/cartSlice";
import { toggleMobileMenu } from "../../store/slices/uiSlice";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { itemCount } = useAppSelector((state) => state.cart);
  const { mobileMenuOpen } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  const location = useLocation();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    // Close mobile menu if open
    if (mobileMenuOpen) {
      dispatch(toggleMobileMenu());
    }
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
  ];

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingCart className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">ShopEasy</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.path
                      ? "text-primary-600 border-b-2 border-primary-600"
                      : "text-gray-700 hover:text-primary-600"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => dispatch(toggleCart())}
                    className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <ShoppingCart size={24} />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                  <Link
                    to="/profile"
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <User size={24} />
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <LogOut size={24} />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  {/* Animated Login Button */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/login"
                      className={`text-sm font-medium transition-colors duration-200 block px-4 py-2.5 rounded-lg border ${
                        location.pathname === "/login"
                          ? "text-primary-600 font-semibold border-primary-600 bg-primary-50"
                          : "text-gray-700 hover:text-primary-600 border-gray-300 hover:border-primary-600"
                      }`}
                    >
                      Login
                    </Link>
                  </motion.div>

                  {/* Animated Sign Up Button */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/register"
                      className={`text-sm font-medium transition-colors duration-200 block px-4 py-2.5 rounded-lg border ${
                        location.pathname === "/register"
                          ? "text-primary-600 font-semibold border-primary-600 bg-primary-50"
                          : "text-gray-700 hover:text-primary-600 border-gray-300 hover:border-primary-600"
                      }`}
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-2 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => dispatch(toggleMobileMenu())}
                  className={`block py-2 text-sm font-medium ${
                    location.pathname === link.path
                      ? "text-primary-600"
                      : "text-gray-700 hover:text-primary-600"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/cart"
                    onClick={() => dispatch(toggleMobileMenu())}
                    className="flex items-center py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <ShoppingCart size={20} className="mr-2" />
                    Cart {itemCount > 0 && `(${itemCount})`}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => dispatch(toggleMobileMenu())}
                    className="flex items-center py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <User size={20} className="mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <LogOut size={20} className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => dispatch(toggleMobileMenu())}
                    className={`block py-2 text-sm font-medium ${
                      location.pathname === "/login"
                        ? "text-primary-600 font-semibold"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                  >
                    Login
                  </Link>

                  {/* Mobile Sign Up Button with Animation */}
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/register"
                      onClick={() => dispatch(toggleMobileMenu())}
                      className={`block py-2 text-sm font-medium ${
                        location.pathname === "/register"
                          ? "text-primary-600 font-semibold"
                          : "text-gray-700 hover:text-primary-600"
                      }`}
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
          onClick={cancelLogout}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <LogOut className="h-6 w-6 text-yellow-600" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to logout from your account?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;
