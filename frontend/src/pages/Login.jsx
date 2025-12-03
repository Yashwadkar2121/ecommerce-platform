import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { loginUser, clearError } from "../store/slices/authSlice";

// Validation rules
const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  password: {
    required: true,
    minLength: 6,
    message: "Password must be at least 6 characters",
  },
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, isUserLoaded } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Only redirect if user is loaded and authenticated
    if (isUserLoaded && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate, isUserLoaded]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Validate a single field
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return "";

    if (rules.required && !value.trim()) {
      return "This field is required";
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message;
    }

    return "";
  };

  // Validate all fields
  const validateAll = () => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      errors[field] = error;
      if (error) isValid = false;
    });

    setFormErrors(errors);
    return isValid;
  };

  // Handle field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear server error when user types
    if (error) {
      dispatch(clearError());
    }

    // Validate field if it's been touched or form was submitted
    if (touched[name] || formSubmitted) {
      setFormErrors({
        ...formErrors,
        [name]: validateField(name, value),
      });
    }
  };

  // Handle blur event
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });

    // Validate on blur
    setFormErrors({
      ...formErrors,
      [name]: validateField(name, formData[name]),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Mark all fields as touched
    const allTouched = Object.keys(touched).reduce(
      (acc, field) => ({
        ...acc,
        [field]: true,
      }),
      {}
    );
    setTouched(allTouched);

    if (!validateAll()) {
      // Focus on first error field
      const firstErrorField = Object.keys(formErrors).find(
        (field) => formErrors[field]
      );
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    dispatch(loginUser(formData));
  };

  // Helper to check if field has error
  const hasError = (fieldName) => touched[fieldName] && formErrors[fieldName];

  // Helper to get input classes based on field state
  const getInputClasses = (fieldName) => {
    const baseClasses =
      "w-full px-3 py-2 pl-11 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm transition-colors ";

    if (hasError(fieldName)) {
      return (
        baseClasses + "border-red-300 focus:border-red-500 focus:ring-red-200"
      );
    }

    if (
      touched[fieldName] &&
      !formErrors[fieldName] &&
      formData[fieldName].trim()
    ) {
      return (
        baseClasses +
        "border-green-300 focus:border-primary-500 focus:ring-primary-200"
      );
    }

    return (
      baseClasses +
      "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
    );
  };

  // ADDED: Show loading spinner while initial user data is loading
  if (isLoading && !isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-600">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClasses("email")}
                  placeholder="Enter your email"
                  aria-invalid={hasError("email")}
                  aria-describedby={
                    hasError("email") ? "email-error" : undefined
                  }
                />
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                {hasError("email") && (
                  <AlertCircle
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                    size={18}
                  />
                )}
              </div>
              {hasError("email") && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClasses("password")}
                  placeholder="Enter your password"
                  aria-invalid={hasError("password")}
                  aria-describedby={
                    hasError("password") ? "password-error" : undefined
                  }
                />
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <button
                  type="button"
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {hasError("password") && (
                  <AlertCircle
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                    size={18}
                  />
                )}
              </div>
              {hasError("password") && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
