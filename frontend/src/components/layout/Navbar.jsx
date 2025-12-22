// Navbar.Jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Menu,
  X,
  Search,
  LogOut,
  ShoppingBag,
  LogIn,
  UserPlus,
  ShoppingCart,
  Home,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { toggleMobileMenu } from "../../store/slices/uiSlice";
import { setFilters } from "../../store/slices/productSlice";
import debounce from "lodash/debounce";

// Reusable Components
const IconButton = ({
  onClick,
  icon: Icon,
  label,
  className = "",
  size = 22,
  children,
  ...props
}) => (
  <button
    onClick={onClick}
    className={`p-2.5 rounded-lg transition-all duration-200 ${className}`}
    aria-label={label}
    {...props}
  >
    {Icon && <Icon size={size} />}
    {children}
  </button>
);

const NavLink = ({
  to,
  onClick,
  icon: Icon,
  label,
  children,
  className = "",
  isActive = false,
  badgeCount = 0,
  ...props
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center py-2.5 text-sm font-medium text-gray-700 hover:text-primary-600 w-full group ${className} ${
      isActive ? "text-primary-600 font-semibold" : ""
    }`}
    aria-label={label}
    {...props}
  >
    {Icon && (
      <div className="mr-3 relative">
        <Icon
          size={20}
          className={`transition-colors ${
            isActive
              ? "text-primary-600"
              : "text-gray-700 group-hover:text-primary-600"
          }`}
        />
        {badgeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[11px] font-bold"
            aria-label={`${badgeCount} items in cart`}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
    )}
    {children}
  </Link>
);

const AuthButton = ({
  to,
  icon: Icon,
  text,
  isActive,
  onClick,
  variant = "default",
}) => {
  const baseClasses =
    "flex items-center space-x-2 text-sm font-medium transition-colors duration-200 px-4 py-2.5 rounded-lg border";

  const variants = {
    default: {
      active: "text-primary-600 font-semibold border-primary-600 bg-primary-50",
      inactive:
        "text-gray-700 hover:text-primary-600 border-gray-300 hover:border-primary-600",
    },
    danger: {
      active: "text-red-600 font-semibold border-red-600 bg-red-50",
      inactive:
        "text-gray-700 hover:text-red-600 border-gray-300 hover:border-red-200",
    },
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{
        scale: 1.05,
        boxShadow:
          variant === "danger"
            ? "0 4px 12px rgba(239, 68, 68, 0.3)"
            : "0 4px 12px rgba(59, 130, 246, 0.3)",
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`${baseClasses} ${
          isActive ? variants[variant].active : variants[variant].inactive
        }`}
        aria-label={text}
      >
        {Icon && <Icon size={18} />}
        <span>{text}</span>
      </Link>
    </motion.div>
  );
};

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onClear,
  isMobile = false,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
          isMobile ? "mb-3" : ""
        }`}
        aria-label="Search products"
        aria-describedby="search-description"
      />
      <span id="search-description" className="sr-only">
        Press Enter to search or type to see suggestions
      </span>
      {searchQuery && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600"
        aria-label="Submit search"
      >
        <Search size={20} />
      </button>
    </form>
  );
};

const CartIcon = ({ itemCount, isCartAnimating, lastAddedItem }) => {
  const location = useLocation();
  const isCartPage = location.pathname === "/cart";

  return (
    <div className="relative group">
      <Link
        to="/cart"
        className={`p-2.5 rounded-lg transition-all duration-200 border ${
          isCartPage
            ? "border-primary-200 bg-primary-50"
            : "border-transparent hover:border-primary-200 hover:bg-primary-50"
        } block`}
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: isCartAnimating ? 1.2 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            <ShoppingCart
              size={24}
              className={`transition-colors ${
                isCartPage
                  ? "text-primary-600"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            />
          </motion.div>

          {itemCount > 0 && (
            <motion.div
              key={itemCount}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isCartAnimating ? 1.5 : 1,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
              }}
              className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold"
              aria-label={`${itemCount} items in cart`}
              aria-live="polite"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </motion.div>
          )}

          {isCartAnimating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-200"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </div>
      </Link>
    </div>
  );
};

const LogoutConfirmation = ({
  showLogoutConfirm,
  cancelLogout,
  confirmLogout,
}) => {
  const modalRef = useRef(null);

  // Focus trap for modal
  useEffect(() => {
    if (showLogoutConfirm && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTabKey = (e) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      modalRef.current.addEventListener("keydown", handleTabKey);

      return () => {
        if (modalRef.current) {
          modalRef.current.removeEventListener("keydown", handleTabKey);
        }
      };
    }
  }, [showLogoutConfirm]);

  if (!showLogoutConfirm) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
      onClick={cancelLogout}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <LogOut className="h-6 w-6 text-yellow-600" />
          </div>

          <h3
            id="logout-dialog-title"
            className="text-lg font-medium text-gray-900 mb-2"
          >
            Confirm Logout
          </h3>
          <p
            id="logout-dialog-description"
            className="text-sm text-gray-500 mb-6"
          >
            Are you sure you want to logout from your account?
          </p>

          <div className="flex space-x-3">
            <button
              onClick={cancelLogout}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              aria-label="Cancel logout"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
              aria-label="Confirm logout"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MobileMenu = ({ isOpen, onClose, items }) => {
  const menuRef = useRef(null);

  // Keyboard navigation for mobile menu
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll(
        "a[href], button:not([disabled])"
      );

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="md:hidden bg-white border-t border-gray-200"
      role="menu"
      aria-label="Mobile navigation menu"
    >
      <div className="px-4 py-2 space-y-1">
        {items.map((item, index) => (
          <div key={index} role="none">
            {item}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { mobileMenuOpen } = useAppSelector((state) => state.ui);
  const { filters } = useAppSelector((state) => state.products);
  const { itemCount, lastAddedItem } = useAppSelector((state) => state.cart);

  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Debounced search function using lodash
  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setIsSearching(true);
        dispatch(setFilters({ ...filters, search: query.trim() }));
        setIsSearching(false);
      }, 300),
    [dispatch, filters]
  );

  // Trigger cart animation when item is added
  useEffect(() => {
    if (lastAddedItem) {
      setIsCartAnimating(true);
      const timer = setTimeout(() => setIsCartAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  // Sync search query with filters
  useEffect(() => {
    if (filters.search !== undefined && filters.search !== searchQuery) {
      setSearchQuery(filters.search || "");
    }
  }, [filters.search]);

  // Handle debounced search
  useEffect(() => {
    if (searchQuery !== filters.search) {
      debouncedSearch(searchQuery);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, filters.search, debouncedSearch]);

  // Keyboard navigation for mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mobileMenuOpen && e.key === "Escape") {
        dispatch(toggleMobileMenu());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, dispatch]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    if (mobileMenuOpen) {
      dispatch(toggleMobileMenu());
    }
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutConfirm(false);
    navigate("/login", { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || searchQuery === "") {
      dispatch(setFilters({ ...filters, search: searchQuery.trim() }));

      if (location.pathname !== "/") {
        navigate("/");
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    dispatch(setFilters({ ...filters, search: "" }));
  };

  const toggleMenu = () => {
    dispatch(toggleMobileMenu());
  };

  const goToHome = () => {
    setSearchQuery("");
    dispatch(setFilters({ ...filters, search: "" }));
    if (location.pathname !== "/") {
      navigate("/");
    }
    if (mobileMenuOpen) {
      dispatch(toggleMobileMenu());
    }
  };

  // Check if current page is home
  const isHomePage = location.pathname === "/";

  // Mobile menu items - Home added as first item
  const mobileMenuItems = [
    <NavLink
      key="home-mobile"
      to="/"
      onClick={() => {
        setSearchQuery("");
        dispatch(setFilters({ ...filters, search: "" }));
        dispatch(toggleMobileMenu());
      }}
      icon={Home}
      label="Home"
      isActive={isHomePage}
    >
      <span>Home</span>
    </NavLink>,
    <NavLink
      key="cart-mobile"
      to="/cart"
      onClick={() => dispatch(toggleMobileMenu())}
      icon={ShoppingCart}
      label={`Cart with ${itemCount} items`}
      badgeCount={itemCount}
      isActive={location.pathname === "/cart"}
    >
      <span>Cart</span>
    </NavLink>,
  ];

  if (isAuthenticated) {
    mobileMenuItems.push(
      <NavLink
        key="profile-mobile"
        to="/profile"
        onClick={() => dispatch(toggleMobileMenu())}
        icon={User}
        label="Profile"
        isActive={location.pathname === "/profile"}
      >
        <span>Profile</span>
      </NavLink>,
      <button
        key="logout-mobile"
        onClick={handleLogoutClick}
        className="flex items-center w-full py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 group"
        aria-label="Logout"
      >
        <div className="mr-3">
          <LogOut
            size={20}
            className="text-gray-700 group-hover:text-red-600 transition-colors"
          />
        </div>
        <span>Logout</span>
      </button>
    );
  } else {
    mobileMenuItems.push(
      <NavLink
        key="login-mobile"
        to="/login"
        onClick={() => dispatch(toggleMobileMenu())}
        icon={LogIn}
        label="Login"
        isActive={location.pathname === "/login"}
      >
        Login
      </NavLink>,
      <NavLink
        key="register-mobile"
        to="/register"
        onClick={() => dispatch(toggleMobileMenu())}
        icon={UserPlus}
        label="Sign Up"
        isActive={location.pathname === "/register"}
      >
        Sign Up
      </NavLink>
    );
  }

  return (
    <>
      <nav
        className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Desktop Home Link */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center space-x-2"
                onClick={() => {
                  setSearchQuery("");
                  dispatch(setFilters({ ...filters, search: "" }));
                }}
                aria-label="ShopEasy Home"
              >
                <div className="text-primary-600">
                  <ShoppingBag size={24} />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  ShopEasy
                </span>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-6">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSubmit={handleSearch}
                onClear={clearSearch}
              />
              {isSearching && (
                <div className="ml-3 flex items-center" aria-live="polite">
                  <span className="sr-only">Searching</span>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Cart Icon Component */}
              <CartIcon
                itemCount={itemCount}
                isCartAnimating={isCartAnimating}
                lastAddedItem={lastAddedItem}
              />

              {isAuthenticated ? (
                <>
                  <IconButton
                    onClick={() => navigate("/profile")}
                    icon={User}
                    label="Profile"
                    className={`group hover:bg-primary-50 hover:border-primary-200 ${
                      location.pathname === "/profile"
                        ? "border-primary-200 bg-primary-50"
                        : ""
                    }`}
                  />
                  <IconButton
                    onClick={handleLogoutClick}
                    icon={LogOut}
                    label="Logout"
                    className="group hover:bg-red-50 hover:border-red-200"
                  />
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <AuthButton
                    to="/login"
                    icon={LogIn}
                    text="Login"
                    isActive={location.pathname === "/login"}
                    onClick={goToHome}
                  />
                  <AuthButton
                    to="/register"
                    icon={UserPlus}
                    text="Sign Up"
                    isActive={location.pathname === "/register"}
                    onClick={goToHome}
                  />
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <IconButton
              onClick={toggleMenu}
              icon={mobileMenuOpen ? X : Menu}
              label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden group hover:bg-primary-50"
              aria-expanded={mobileMenuOpen}
            />
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden py-2">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSubmit={handleSearch}
              onClear={clearSearch}
              isMobile={true}
            />
            {isSearching && (
              <div
                className="absolute right-12 top-1/2 transform -translate-y-1/2"
                aria-live="polite"
              >
                <span className="sr-only">Searching</span>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Component */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => dispatch(toggleMobileMenu())}
          items={mobileMenuItems}
        />
      </nav>

      {/* Logout Confirmation Modal Component */}
      <LogoutConfirmation
        showLogoutConfirm={showLogoutConfirm}
        cancelLogout={cancelLogout}
        confirmLogout={confirmLogout}
      />
    </>
  );
};

export default Navbar;
