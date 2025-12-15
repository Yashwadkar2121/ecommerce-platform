import { useState, useEffect, useCallback, useMemo } from "react";
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
import { authService } from "../services/authService";
import TermsModal from "../components/TermsModal";

// Configuration objects
const CONFIG = {
  EMAIL: {
    DOMAIN_TYPO_MAP: {
      gmil: "gmail",
      gmal: "gmail",
      gmai: "gmail",
      yaho: "yahoo",
      yhoo: "yahoo",
      yaoo: "yahoo",
      hotmal: "hotmail",
      outlok: "outlook",
    },
    TLD_TYPO_MAP: {
      con: "com",
      cpm: "com",
      cop: "com",
      om: "com",
      cm: "com",
    },
    COMMON_DOMAINS: [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
    ],
  },
  VALIDATION: {
    PATTERNS: {
      EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      PHONE: /^[0-9]{10}$/,
      NAME: /^[A-Za-zÀ-ÿ\s\-']+$/,
      PASSWORD:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    },
    MESSAGES: {
      REQUIRED: (field) => `${field} is required`,
      MIN_LENGTH: (min) => `Minimum ${min} characters required`,
      MAX_LENGTH: (max) => `Maximum ${max} characters allowed`,
      PATTERN: (field, msg) => msg || `Invalid ${field.toLowerCase()} format`,
      PASSWORD:
        "Must contain uppercase, lowercase, number, and special character (@$!%*?&)",
    },
  },
  DEBOUNCE: {
    PHONE: 800,
    EMAIL: 600,
  },
};

// Initial states
const INITIAL_STATE = {
  FORM_DATA: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  },
  FORM_ERRORS: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: "",
  },
  TOUCHED: {
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    terms: false,
  },
};

// Error message mapping for user-friendly messages
const ERROR_MESSAGES = {
  "Network Error": "Unable to connect. Please check your internet connection.",
  Timeout: "Request timed out. Please try again.",
  "Email already registered":
    "This email is already registered. Please use a different email or try logging in.",
  "Phone already in use": "This phone number is already registered.",
  "Invalid credentials": "Invalid email or password. Please try again.",
  "Session expired": "Your session has expired. Please log in again.",
  default: "An unexpected error occurred. Please try again.",
};

const Register = () => {
  // State management
  const [formData, setFormData] = useState(INITIAL_STATE.FORM_DATA);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [formErrors, setFormErrors] = useState(INITIAL_STATE.FORM_ERRORS);
  const [touched, setTouched] = useState(INITIAL_STATE.TOUCHED);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState({ phone: false, email: false });
  const [availability, setAvailability] = useState({
    phone: null,
    email: null,
  });
  const [statusMessage, setStatusMessage] = useState({ phone: "", email: "" });
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redux and routing
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  // Clear auth error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Format phone input
  const formatPhone = useCallback(
    (value) => value.replace(/\D/g, "").slice(0, 10),
    []
  );

  // Email validation with typo detection
  const validateEmail = useCallback((email) => {
    if (!email?.trim()) return CONFIG.VALIDATION.MESSAGES.REQUIRED("Email");

    if (!CONFIG.VALIDATION.PATTERNS.EMAIL.test(email)) {
      return "Please enter a valid email address (e.g., name@example.com)";
    }

    const [localPart, domain] = email.toLowerCase().split("@");
    const domainParts = domain.split(".");
    const domainName = domainParts[0];
    const tld = domainParts.slice(1).join(".");

    // Check for domain typos
    if (CONFIG.EMAIL.DOMAIN_TYPO_MAP[domainName]) {
      return `Did you mean ${localPart}@${CONFIG.EMAIL.DOMAIN_TYPO_MAP[domainName]}.${tld}?`;
    }

    // Check for TLD typos
    if (CONFIG.EMAIL.TLD_TYPO_MAP[tld]) {
      return `Did you mean ${localPart}@${domainName}.${CONFIG.EMAIL.TLD_TYPO_MAP[tld]}?`;
    }

    // Basic domain validation
    if (domain.includes("..")) return "Email contains consecutive dots";
    if (domainName.length < 2) return "Domain name too short";
    if (tld.length < 2 || tld.length > 6) return "Invalid domain extension";

    return "";
  }, []);

  // Generate email suggestions with XSS protection
  const generateSuggestions = useCallback((email) => {
    if (!email?.includes("@")) {
      setEmailSuggestions([]);
      return;
    }

    const [localPart, domain] = email.split("@");
    // Sanitize inputs to prevent XSS
    const sanitizedLocalPart = localPart.replace(/[<>]/g, "");
    const sanitizedDomain = domain.replace(/[<>]/g, "");

    const suggestions = new Set();

    // Domain typo corrections
    if (CONFIG.EMAIL.DOMAIN_TYPO_MAP[sanitizedDomain]) {
      suggestions.add(
        `${sanitizedLocalPart}@${CONFIG.EMAIL.DOMAIN_TYPO_MAP[sanitizedDomain]}.com`
      );
    }

    // Common domain alternatives
    CONFIG.EMAIL.COMMON_DOMAINS.forEach((commonDomain) => {
      if (commonDomain !== sanitizedDomain)
        suggestions.add(`${sanitizedLocalPart}@${commonDomain}`);
    });

    setEmailSuggestions(Array.from(suggestions).slice(0, 3));
  }, []);

  // Check availability (generic for both email and phone)
  const checkAvailability = useCallback(async (type, value) => {
    const isEmail = type === "email";
    const pattern = isEmail
      ? CONFIG.VALIDATION.PATTERNS.EMAIL
      : CONFIG.VALIDATION.PATTERNS.PHONE;

    if (!value || !pattern.test(value)) {
      setAvailability((prev) => ({ ...prev, [type]: null }));
      setStatusMessage((prev) => ({
        ...prev,
        [type]: isEmail ? "Enter a valid email" : `${value.length}/10 digits`,
      }));
      return;
    }

    setLoading((prev) => ({ ...prev, [type]: true }));
    setStatusMessage((prev) => ({ ...prev, [type]: "Checking..." }));

    try {
      const service = isEmail
        ? authService.checkEmailAvailability
        : authService.checkPhoneAvailability;
      const response = await service(value);
      const { available, error: apiError } = response.data;
      const defaultMsg = isEmail
        ? "Email already registered"
        : "Phone already in use";

      setAvailability((prev) => ({ ...prev, [type]: available }));
      setStatusMessage((prev) => ({
        ...prev,
        [type]: available ? "Available" : apiError || defaultMsg,
      }));

      if (available) {
        setFormErrors((prev) => ({ ...prev, [type]: "" }));
      } else {
        setFormErrors((prev) => ({ ...prev, [type]: apiError || defaultMsg }));
      }
    } catch {
      setAvailability((prev) => ({ ...prev, [type]: null }));
      setStatusMessage((prev) => ({ ...prev, [type]: "Check failed" }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  }, []);

  // Field validation
  const validateField = useCallback(
    (name, value, confirmValue = null) => {
      const field = name.toLowerCase();

      // Required check
      if (!value?.trim() && field !== "phone") {
        return CONFIG.VALIDATION.MESSAGES.REQUIRED(name);
      }

      // Field-specific validation
      switch (field) {
        case "email":
          return validateEmail(value);

        case "password":
          if (!CONFIG.VALIDATION.PATTERNS.PASSWORD.test(value)) {
            return CONFIG.VALIDATION.MESSAGES.PASSWORD;
          }
          return "";

        case "confirmpassword":
          return value !== (confirmValue || formData.password)
            ? "Passwords do not match"
            : "";

        case "phone":
          return !CONFIG.VALIDATION.PATTERNS.PHONE.test(value)
            ? "Must be exactly 10 digits"
            : "";

        default: // firstName, lastName
          if (value.length < 2) return CONFIG.VALIDATION.MESSAGES.MIN_LENGTH(2);
          if (value.length > 50)
            return CONFIG.VALIDATION.MESSAGES.MAX_LENGTH(50);
          if (!CONFIG.VALIDATION.PATTERNS.NAME.test(value)) {
            return "Only letters, spaces, hyphens, and apostrophes allowed";
          }
          return "";
      }
    },
    [validateEmail, formData.password]
  );

  // Debounced availability checks
  useEffect(() => {
    const timer = setTimeout(() => {
      if (CONFIG.VALIDATION.PATTERNS.EMAIL.test(formData.email)) {
        generateSuggestions(formData.email);
        checkAvailability("email", formData.email);
      } else {
        setEmailSuggestions([]);
        setAvailability((prev) => ({ ...prev, email: null }));
        setStatusMessage((prev) => ({
          ...prev,
          email: formData.email ? "Enter a valid email" : "",
        }));
      }
    }, CONFIG.DEBOUNCE.EMAIL);

    return () => clearTimeout(timer);
  }, [formData.email, generateSuggestions, checkAvailability]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (CONFIG.VALIDATION.PATTERNS.PHONE.test(formData.phone)) {
        checkAvailability("phone", formData.phone);
      } else {
        setAvailability((prev) => ({ ...prev, phone: null }));
        setStatusMessage((prev) => ({
          ...prev,
          phone: formData.phone ? `${formData.phone.length}/10 digits` : "",
        }));
      }
    }, CONFIG.DEBOUNCE.PHONE);

    return () => clearTimeout(timer);
  }, [formData.phone, checkAvailability]);

  // Field handlers
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const formattedValue = name === "phone" ? formatPhone(value) : value;

      // Reset suggestions for email
      if (name === "email" && value !== formData.email) {
        setEmailSuggestions([]);
      }

      setFormData((prev) => ({ ...prev, [name]: formattedValue }));

      // Clear server error on typing
      if (error) dispatch(clearError());

      // Real-time validation
      if (touched[name]) {
        const errorMsg = validateField(name, formattedValue);
        setFormErrors((prev) => ({
          ...prev,
          [name]: errorMsg,
          ...(name === "password" && {
            confirmPassword: validateField(
              "confirmPassword",
              formData.confirmPassword,
              formattedValue
            ),
          }),
          ...(name === "confirmPassword" && {
            confirmPassword: validateField(
              "confirmPassword",
              formattedValue,
              formData.password
            ),
          }),
        }));
      }
    },
    [error, touched, formData, dispatch, formatPhone, validateField]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const errorMsg = validateField(name, formData[name]);
      setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
    },
    [formData, validateField]
  );

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      // Sanitize suggestion to prevent XSS
      const sanitized = suggestion.replace(/[<>]/g, "");
      setFormData((prev) => ({ ...prev, email: sanitized }));
      setTouched((prev) => ({ ...prev, email: true }));
      setEmailSuggestions([]);
      const error = validateField("email", sanitized);
      setFormErrors((prev) => ({ ...prev, email: error }));
      if (!error) checkAvailability("email", sanitized);
    },
    [validateField, checkAvailability]
  );

  const handleTermsChange = useCallback((e) => {
    const isChecked = e.target.checked;
    setTermsAccepted(isChecked);
    setTouched((prev) => ({ ...prev, terms: true }));
    setFormErrors((prev) => ({
      ...prev,
      terms: isChecked ? "" : "You must agree to the terms",
    }));
  }, []);

  // Form validation and submission
  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      errors[field] = error;
      if (error) isValid = false;
    });

    // Validate terms
    if (!termsAccepted) {
      errors.terms = "You must agree to the terms";
      isValid = false;
    }

    // Check availability
    if (availability.phone === false) {
      errors.phone = "Phone number already registered";
      isValid = false;
    }
    if (availability.email === false) {
      errors.email = "Email already registered";
      isValid = false;
    }

    // Password confirmation validation (redundant check)
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Password strength validation
    if (!CONFIG.VALIDATION.PATTERNS.PASSWORD.test(formData.password)) {
      errors.password = CONFIG.VALIDATION.MESSAGES.PASSWORD;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [formData, termsAccepted, availability, validateField]);

  // Final validation checklist before submission
  const performFinalValidation = useCallback(() => {
    const issues = [];

    // Check all required fields
    if (!formData.firstName.trim()) issues.push("First name");
    if (!formData.lastName.trim()) issues.push("Last name");
    if (!formData.email.trim()) issues.push("Email");
    if (!formData.phone.trim()) issues.push("Phone");
    if (!formData.password) issues.push("Password");

    // Check password strength
    if (!CONFIG.VALIDATION.PATTERNS.PASSWORD.test(formData.password)) {
      issues.push("Password strength requirements");
    }

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      issues.push("Password confirmation");
    }

    // Check terms
    if (!termsAccepted) issues.push("Terms and conditions");

    // Check availability
    if (availability.phone === false || availability.email === false) {
      issues.push("Account availability");
    }

    return issues;
  }, [formData, termsAccepted, availability]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (isSubmitting) return;
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(touched).reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate form - stop if invalid
      if (!validateForm()) {
        // Find and focus first error
        const errorFields = Object.keys(formErrors).filter(
          (field) => formErrors[field]
        );
        if (errorFields.length > 0) {
          document.getElementById(errorFields[0])?.focus();
        }
        setIsSubmitting(false);
        return;
      }

      // Double-check availability before submission
      if (availability.phone === false || availability.email === false) {
        setFormErrors((prev) => ({
          ...prev,
          phone: availability.phone === false ? "Phone already registered" : "",
          email: availability.email === false ? "Email already registered" : "",
        }));
        setIsSubmitting(false);
        return;
      }

      // Run final validation checklist
      const validationIssues = performFinalValidation();
      if (validationIssues.length > 0) {
        setFormErrors((prev) => ({
          ...prev,
          _form: `Please fix the following: ${validationIssues.join(", ")}`,
        }));
        setIsSubmitting(false);
        return;
      }

      try {
        // Prepare registration data with trimming
        const registrationData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          password: formData.password,
        };

        await dispatch(registerUser(registrationData)).unwrap();

        // Success - form will be reset by redirect
      } catch (error) {
        // Error handling is already in Redux state
        console.error("Registration failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      touched,
      validateForm,
      formErrors,
      availability,
      formData,
      dispatch,
      performFinalValidation,
      isSubmitting,
    ]
  );

  // Helper functions
  const hasError = useCallback(
    (field) => touched[field] && formErrors[field],
    [touched, formErrors]
  );

  const getInputClasses = useCallback(
    (field) => {
      const base =
        "appearance-none block w-full px-3 py-2 pl-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-200";

      if (hasError(field))
        return `${base} border-red-300 focus:border-red-500 focus:ring-red-200`;
      if (touched[field] && !formErrors[field])
        return `${base} border-green-300 focus:border-primary-500 focus:ring-primary-200`;
      return `${base} border-gray-300 focus:border-primary-500 focus:ring-primary-200`;
    },
    [hasError, touched, formErrors]
  );

  // Password validation status
  const passwordValidation = useMemo(
    () => ({
      minLength: formData.password.length >= 6,
      hasLowercase: /[a-z]/.test(formData.password),
      hasUppercase: /[A-Z]/.test(formData.password),
      hasNumber: /\d/.test(formData.password),
      hasSpecial: /[@$!%*?&]/.test(formData.password),
      passwordsMatch:
        formData.password === formData.confirmPassword &&
        formData.confirmPassword.length > 0,
    }),
    [formData.password, formData.confirmPassword]
  );

  // Form fields configuration
  const formFields = useMemo(
    () => [
      {
        id: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "First name",
        icon: User,
        gridCols: "col-span-1",
      },
      {
        id: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Last name",
        icon: User,
        gridCols: "col-span-1",
      },
      {
        id: "email",
        label: "Email address",
        type: "email",
        placeholder: "Enter your email",
        icon: Mail,
        gridCols: "col-span-2",
      },
      {
        id: "phone",
        label: "Phone Number",
        type: "tel",
        placeholder: "1234567890",
        icon: Phone,
        gridCols: "col-span-2",
      },
      {
        id: "password",
        label: "Password",
        type: showPassword.password ? "text" : "password",
        placeholder: "Enter your password",
        icon: Lock,
        gridCols: "col-span-2",
      },
      {
        id: "confirmPassword",
        label: "Confirm Password",
        type: showPassword.confirm ? "text" : "password",
        placeholder: "Confirm password",
        icon: Lock,
        gridCols: "col-span-2",
      },
    ],
    [showPassword]
  );

  // Status icons
  const StatusIcon = ({ type }) => {
    const isChecking = loading[type];
    const isAvailable = availability[type];

    if (isChecking)
      return (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
        </div>
      );

    if (isAvailable === true)
      return (
        <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
      );
    if (isAvailable === false)
      return (
        <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
      );

    return null;
  };

  // Get user-friendly error message
  const getErrorMessage = (error) => {
    return ERROR_MESSAGES[error] || error || ERROR_MESSAGES.default;
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
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              sign in
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
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fadeIn">
                {getErrorMessage(error)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {formFields.map(
                ({ id, label, type, placeholder, icon: Icon, gridCols }) => (
                  <div key={id} className={gridCols}>
                    <label
                      htmlFor={id}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={id}
                        name={id}
                        type={type}
                        value={formData[id]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={getInputClasses(id)}
                        placeholder={placeholder}
                        aria-invalid={hasError(id)}
                        maxLength={id === "phone" ? 10 : undefined}
                      />
                      <Icon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={18}
                      />

                      {/* Status indicators */}
                      {(id === "email" || id === "phone") && (
                        <StatusIcon type={id} />
                      )}

                      {/* Password toggle */}
                      {(id === "password" || id === "confirmPassword") && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              [id === "password" ? "password" : "confirm"]:
                                !prev[
                                  id === "password" ? "password" : "confirm"
                                ],
                            }))
                          }
                          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                          aria-label={
                            type === "text" ? "Hide password" : "Show password"
                          }
                        >
                          {type === "text" ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      )}

                      {/* Error icon */}
                      {hasError(id) && (
                        <AlertCircle
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                          size={18}
                        />
                      )}
                    </div>

                    {/* Error message */}
                    {hasError(id) && (
                      <p
                        id={`${id}-error`}
                        className="mt-1 text-sm text-red-600 animate-fadeIn"
                      >
                        {formErrors[id]}
                      </p>
                    )}

                    {/* Status message */}
                    {(id === "phone" || id === "email") &&
                      !hasError(id) &&
                      statusMessage[id] && (
                        <p className="mt-1 text-xs text-gray-500">
                          {statusMessage[id]}
                        </p>
                      )}

                    {/* Email suggestions */}
                    {id === "email" && emailSuggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">Did you mean:</p>
                        <div className="flex flex-wrap gap-2">
                          {emailSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Password validation */}
            {(touched.password || formData.password) && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs">
                <p className="font-medium text-gray-700 mb-1">
                  Password must contain:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(passwordValidation)
                    .filter(
                      ([key]) => !["minLength", "passwordsMatch"].includes(key)
                    )
                    .map(([key, isValid]) => (
                      <p
                        key={key}
                        className={`flex items-center ${
                          isValid ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        <span className="mr-1">{isValid ? "✓" : "✗"}</span>
                        {key === "hasLowercase" && "Lowercase letter"}
                        {key === "hasUppercase" && "Uppercase letter"}
                        {key === "hasNumber" && "Number"}
                        {key === "hasSpecial" && "Special character"}
                      </p>
                    ))}
                </div>
                <p
                  className={`mt-1 flex items-center ${
                    passwordValidation.minLength
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  <span className="mr-1">
                    {passwordValidation.minLength ? "✓" : "✗"}
                  </span>
                  At least 6 characters (Current: {formData.password.length})
                </p>
                {formErrors.password && (
                  <p className="mt-2 text-red-600 font-medium bg-red-50 p-2 rounded">
                    {formErrors.password}
                  </p>
                )}
              </div>
            )}

            {/* Password match indicator */}
            {formData.confirmPassword && (
              <div
                className={`p-2 rounded-lg text-sm ${
                  passwordValidation.passwordsMatch
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <div className="flex items-center">
                  {passwordValidation.passwordsMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={handleTermsChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                aria-invalid={hasError("terms")}
              />
              <label
                htmlFor="terms"
                className={`ml-2 text-sm ${
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
            </div>
            {hasError("terms") && (
              <p className="mt-1 text-sm text-red-600">{formErrors.terms}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isLoading || loading.phone || loading.email || isSubmitting
              }
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
