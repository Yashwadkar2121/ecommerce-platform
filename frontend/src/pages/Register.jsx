import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { registerUser, clearError } from "../store/slices/authSlice";
import TermsModal from "../components/TermsModal";
import { authService } from "../services/authService";

// Validation rules
const validationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[A-Za-zÀ-ÿ\s\-']+$/,
    message:
      "First name must contain only letters, spaces, hyphens, or apostrophes",
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[A-Za-zÀ-ÿ\s\-']+$/,
    message:
      "Last name must contain only letters, spaces, hyphens, or apostrophes",
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  phone: {
    required: true,
    pattern: /^[0-9]{10}$/,
    message: "Phone number must be exactly 10 digits",
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
    message:
      "Password must be at least 6 characters with 1 uppercase, 1 lowercase, and 1 number",
  },
  confirmPassword: {
    required: true,
    message: "Please confirm your password",
  },
};

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });
  const [showTerms, setShowTerms] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null); // null = not checked, true = available, false = taken
  const [phoneStatusMessage, setPhoneStatusMessage] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Check phone availability
  const checkPhoneAvailability = async (phone) => {
    if (!phone || phone.length !== 10) {
      setPhoneAvailable(null);
      setPhoneStatusMessage("Enter exactly 10 digits");
      return;
    }

    setPhoneChecking(true);
    setPhoneStatusMessage("Checking availability...");

    try {
      const response = await authService.checkPhoneAvailability(phone);
      const data = response.data;

      if (data.available === true) {
        setPhoneAvailable(true);
        setPhoneStatusMessage("Phone number is available");
        // Clear any existing phone error if phone is available
        if (formErrors.phone === "Phone number already in use") {
          setFormErrors({
            ...formErrors,
            phone: "",
          });
        }
      } else if (data.available === false) {
        setPhoneAvailable(false);
        setPhoneStatusMessage(data.error || "Phone number already in use");
        // Set form error immediately
        setFormErrors({
          ...formErrors,
          phone: data.error || "Phone number already in use",
        });
      }
    } catch (error) {
      console.error("Phone check error:", error);
      // If it's a 400 error (phone already exists), handle it
      if (
        error.response?.status === 200 &&
        error.response?.data?.available === false
      ) {
        setPhoneAvailable(false);
        const errorMsg =
          error.response.data.error || "Phone number already in use";
        setPhoneStatusMessage(errorMsg);
        setFormErrors({
          ...formErrors,
          phone: errorMsg,
        });
      } else {
        setPhoneAvailable(null);
        setPhoneStatusMessage("Unable to check phone availability");
      }
    } finally {
      setPhoneChecking(false);
    }
  };

  // Debounced phone check effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.phone.length === 10 && /^[0-9]{10}$/.test(formData.phone)) {
        await checkPhoneAvailability(formData.phone);
      } else {
        setPhoneAvailable(null);
        if (formData.phone.length > 0) {
          setPhoneStatusMessage(`${formData.phone.length}/10 digits`);
        } else {
          setPhoneStatusMessage("Enter exactly 10 digits");
        }
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.phone]);

  // Format phone input to only allow digits and limit to 10
  const formatPhone = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

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

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message;
    }

    // Special validation for confirmPassword
    if (name === "confirmPassword" && value !== formData.password) {
      return "Passwords do not match";
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

    // Validate terms checkbox
    if (!touched.terms) {
      errors.terms = "You must agree to the terms and conditions";
      isValid = false;
    }

    // Check phone availability before submitting
    if (formData.phone && phoneAvailable === false) {
      errors.phone = "Phone number already in use";
      isValid = false;
    }

    // Also check if phone is not 10 digits
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone input
    if (name === "phone") {
      formattedValue = formatPhone(value);
      // Reset availability check when phone changes
      if (value !== formData.phone) {
        setPhoneAvailable(null);
        setPhoneStatusMessage(`${formattedValue.length}/10 digits`);
      }
    }

    setFormData({
      ...formData,
      [name]: formattedValue,
    });

    // Clear server error when user types
    if (error) {
      dispatch(clearError());
    }

    // Validate field if it's been touched or form was submitted
    if (touched[name] || formSubmitted) {
      setFormErrors({
        ...formErrors,
        [name]: validateField(name, formattedValue),
        // Clear confirm password error if password changes
        ...(name === "password" && formData.confirmPassword
          ? {
              confirmPassword: validateField(
                "confirmPassword",
                formData.confirmPassword
              ),
            }
          : {}),
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

    // Check phone availability when user leaves phone field
    if (name === "phone" && formData.phone.length === 10) {
      checkPhoneAvailability(formData.phone);
    }
  };

  // Handle terms checkbox
  const handleTermsChange = (e) => {
    const isChecked = e.target.checked;
    setTouched({
      ...touched,
      terms: true,
    });
    setFormErrors({
      ...formErrors,
      terms: isChecked ? "" : "You must agree to the terms and conditions",
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

    const { confirmPassword, ...registerData } = formData;
    dispatch(registerUser(registerData));
  };

  // Helper to check if field has error
  const hasError = (fieldName) => touched[fieldName] && formErrors[fieldName];

  // Helper to get input classes based on field state
  const getInputClasses = (fieldName) => {
    const baseClasses =
      "appearance-none block w-full px-3 py-2 pl-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ";

    if (hasError(fieldName)) {
      return (
        baseClasses + "border-red-300 focus:border-red-500 focus:ring-red-200"
      );
    }

    if (touched[fieldName] && !formErrors[fieldName]) {
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

  // Helper to get phone status icon and color
  const getPhoneStatusIcon = () => {
    if (phoneChecking) {
      return (
        <div className="flex items-center text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
          Checking...
        </div>
      );
    }

    if (phoneAvailable === true) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          {phoneStatusMessage}
        </div>
      );
    }

    if (phoneAvailable === false) {
      return (
        <div className="flex items-center text-red-600">
          <XCircle className="h-4 w-4 mr-2" />
          {phoneStatusMessage}
        </div>
      );
    }

    return <div className="text-gray-500">{phoneStatusMessage}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClasses("firstName")}
                    placeholder="First name"
                    aria-invalid={hasError("firstName")}
                    aria-describedby={
                      hasError("firstName") ? "firstName-error" : undefined
                    }
                  />
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  {hasError("firstName") && (
                    <AlertCircle
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                      size={18}
                    />
                  )}
                </div>
                {hasError("firstName") && (
                  <p id="firstName-error" className="mt-1 text-sm text-red-600">
                    {formErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClasses("lastName")}
                    placeholder="Last name"
                    aria-invalid={hasError("lastName")}
                    aria-describedby={
                      hasError("lastName") ? "lastName-error" : undefined
                    }
                  />
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  {hasError("lastName") && (
                    <AlertCircle
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                      size={18}
                    />
                  )}
                </div>
                {hasError("lastName") && (
                  <p id="lastName-error" className="mt-1 text-sm text-red-600">
                    {formErrors.lastName}
                  </p>
                )}
              </div>
            </div>

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
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <div className="mt-1 relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClasses("phone")}
                  placeholder="1234567890"
                  maxLength="10"
                  aria-invalid={hasError("phone")}
                  aria-describedby={
                    hasError("phone") ? "phone-error" : undefined
                  }
                />
                <Phone
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                {phoneChecking && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
                {!phoneChecking && phoneAvailable === true && (
                  <CheckCircle
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-green-500"
                    size={18}
                  />
                )}
                {!phoneChecking && phoneAvailable === false && (
                  <XCircle
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500"
                    size={18}
                  />
                )}
                {!phoneChecking &&
                  hasError("phone") &&
                  phoneAvailable === null && (
                    <AlertCircle
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                      size={18}
                    />
                  )}
              </div>
              {hasError("phone") && (
                <p id="phone-error" className="mt-1 text-sm text-red-600">
                  {formErrors.phone}
                </p>
              )}
              {!hasError("phone") && (
                <div className="mt-1 text-sm">{getPhoneStatusIcon()}</div>
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
                  autoComplete="new-password"
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
              {!hasError("password") && touched.password && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p
                    className={
                      formData.password.length >= 6 ? "text-green-600" : ""
                    }
                  >
                    ✓ At least 6 characters
                  </p>
                  <p
                    className={
                      /[a-z]/.test(formData.password) ? "text-green-600" : ""
                    }
                  >
                    ✓ Contains lowercase letter
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(formData.password) ? "text-green-600" : ""
                    }
                  >
                    ✓ Contains uppercase letter
                  </p>
                  <p
                    className={
                      /\d/.test(formData.password) ? "text-green-600" : ""
                    }
                  >
                    ✓ Contains number
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClasses("confirmPassword")}
                  placeholder="Confirm your password"
                  aria-invalid={hasError("confirmPassword")}
                  aria-describedby={
                    hasError("confirmPassword")
                      ? "confirmPassword-error"
                      : undefined
                  }
                />
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <button
                  type="button"
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
                {hasError("confirmPassword") && (
                  <AlertCircle
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                    size={18}
                  />
                )}
              </div>
              {hasError("confirmPassword") && (
                <p
                  id="confirmPassword-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {formErrors.confirmPassword}
                </p>
              )}
              {!hasError("confirmPassword") &&
                touched.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passwords match
                  </p>
                )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                onChange={handleTermsChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                aria-invalid={hasError("terms")}
              />
              <div className="ml-2">
                <label
                  htmlFor="terms"
                  className={`block text-sm ${
                    hasError("terms") ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-primary-600 hover:text-primary-500 underline"
                  >
                    Terms and Conditions
                  </button>
                </label>
                {hasError("terms") && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.terms}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || phoneChecking}
                className="w-full flex justify-center py-3 px-4 border rounded-lg shadow-sm text-sm font-medium text-black border-gray-600 bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        </div>
        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </motion.div>
    </div>
  );
};

export default Register;
