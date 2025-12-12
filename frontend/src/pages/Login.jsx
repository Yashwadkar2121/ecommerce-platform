import { useState, useEffect, useCallback, useMemo } from "react";
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

// Initial state objects
const initialFormData = {
  email: "",
  password: "",
};

const initialFormErrors = {
  email: "",
  password: "",
};

const initialTouched = {
  email: false,
  password: false,
};

const Login = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState(initialFormErrors);
  const [touched, setTouched] = useState(initialTouched);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, isUserLoaded } = useAppSelector(
    (state) => state.auth
  );

  // Redirect if authenticated and user data is loaded
  useEffect(() => {
    if (isUserLoaded && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate, isUserLoaded]);

  // Clear auth error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Validate a single field
  const validateField = useCallback((name, value) => {
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
  }, []);

  // Validate all fields
  const validateAll = useCallback(() => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      errors[field] = error;
      if (error) isValid = false;
    });

    setFormErrors(errors);
    return isValid;
  }, [formData, validateField]);

  // Handle field change
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear server error when user types
      if (error) {
        dispatch(clearError());
      }

      // Validate field if it's been touched or form was submitted
      if (touched[name] || formSubmitted) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: validateField(name, value),
        }));
      }
    },
    [error, touched, formSubmitted, dispatch, validateField]
  );

  // Handle blur event
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate on blur
      setFormErrors((prev) => ({
        ...prev,
        [name]: validateField(name, formData[name]),
      }));
    },
    [formData, validateField]
  );

  const handleSubmit = useCallback(
    (e) => {
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
    },
    [touched, validateAll, formErrors, formData, dispatch]
  );

  // Helper to check if field has error
  const hasError = useCallback(
    (fieldName) => touched[fieldName] && formErrors[fieldName],
    [touched, formErrors]
  );

  // Helper to get input classes based on field state
  const getInputClasses = useCallback(
    (fieldName) => {
      const baseClasses =
        "w-full px-3 py-2 pl-11 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm transition-colors duration-200";

      if (hasError(fieldName)) {
        return (
          baseClasses +
          " border-red-300 focus:border-red-500 focus:ring-red-200"
        );
      }

      if (
        touched[fieldName] &&
        !formErrors[fieldName] &&
        formData[fieldName].trim()
      ) {
        return (
          baseClasses +
          " border-green-300 focus:border-primary-500 focus:ring-primary-200"
        );
      }

      return (
        baseClasses +
        " border-gray-300 focus:border-primary-500 focus:ring-primary-200"
      );
    },
    [hasError, touched, formErrors, formData]
  );

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Form fields configuration for easier management
  const formFields = useMemo(
    () => [
      {
        id: "email",
        label: "Email address",
        type: "email",
        placeholder: "Enter your email",
        icon: Mail,
        autoComplete: "email",
        required: true,
      },
      {
        id: "password",
        label: "Password",
        type: showPassword ? "text" : "password",
        placeholder: "Enter your password",
        icon: Lock,
        autoComplete: "current-password",
        required: true,
        showToggle: true,
      },
    ],
    [showPassword]
  );

  // Show loading spinner while initial user data is loading
  if (isLoading && !isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
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
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
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
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            {/* Form fields */}
            {formFields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    value={formData[field.id]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClasses(field.id)}
                    placeholder={field.placeholder}
                    aria-invalid={hasError(field.id)}
                    aria-describedby={
                      hasError(field.id) ? `${field.id}-error` : undefined
                    }
                  />
                  <field.icon
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />

                  {/* Password toggle button */}
                  {field.showToggle && (
                    <button
                      type="button"
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors"
                      onClick={togglePasswordVisibility}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}

                  {/* Error icon */}
                  {hasError(field.id) && (
                    <AlertCircle
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                      size={18}
                    />
                  )}
                </div>
                {hasError(field.id) && (
                  <motion.p
                    id={`${field.id}-error`}
                    className="mt-1 text-sm text-red-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {formErrors[field.id]}
                  </motion.p>
                )}
              </div>
            ))}

            {/* Forgot password link */}
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
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
