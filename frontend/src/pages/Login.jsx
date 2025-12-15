import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Shield,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { loginUser, clearError } from "../store/slices/authSlice";

// Constants - extracted for better maintainability
const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  TIME_WINDOW: 5 * 60 * 1000,
  LOCKOUT_DURATION: 15 * 60 * 1000,
};

const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
    sanitize: (value) => value.trim().toLowerCase(),
  },
  password: {
    required: true,
    minLength: 6,
    validate: (value) => {
      if (!value) return "";

      const errors = [];
      if (value.length < 6) errors.push("at least 6 characters");
      if (!/[A-Z]/.test(value)) errors.push("one uppercase letter");
      if (!/[a-z]/.test(value)) errors.push("one lowercase letter");
      if (!/\d/.test(value)) errors.push("one number");
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
        errors.push("one special character");

      return errors.length > 0
        ? `Password must contain ${errors.join(", ")}`
        : "";
    },
    sanitize: (value) =>
      value.replace(/[<>]/g, "").replace(/\s\s+/g, " ").trim(),
  },
};

const INITIAL_STATE = {
  formData: { email: "", password: "" },
  formErrors: { email: "", password: "", form: "" },
  touched: { email: false, password: false },
  rateLimit: { attempts: 0, lastAttempt: null, lockoutUntil: null },
};

// Utility functions outside component - prevents recreation
const sanitizeInput = (value, fieldName) => {
  if (!value) return value;
  const sanitizer = VALIDATION_RULES[fieldName]?.sanitize;
  return sanitizer ? sanitizer(value) : value.trim();
};

const validateField = (name, value) => {
  const rules = VALIDATION_RULES[name];
  if (!rules) return "";

  if (rules.required && !value.trim()) {
    return "This field is required";
  }

  if (rules.minLength && value.length < rules.minLength) {
    return rules.message || `Minimum ${rules.minLength} characters required`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.message;
  }

  if (rules.validate) {
    return rules.validate(value);
  }

  return "";
};

const Login = () => {
  const [formData, setFormData] = useState(INITIAL_STATE.formData);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState(INITIAL_STATE.formErrors);
  const [touched, setTouched] = useState(INITIAL_STATE.touched);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimit, setRateLimit] = useState(INITIAL_STATE.rateLimit);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, isUserLoaded } = useAppSelector(
    (state) => state.auth
  );

  // Combined refs into one object
  const timersRef = useRef({
    submit: null,
    idle: null,
    passwordVisibility: null,
  });

  // Cleanup all timers
  const cleanupTimers = useCallback(() => {
    Object.values(timersRef.current).forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
  }, []);

  // Redirect if authenticated - optimized dependency array
  useEffect(() => {
    if (isUserLoaded && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isUserLoaded, navigate]);

  // Clear auth error on mount
  useEffect(() => {
    dispatch(clearError());
    return cleanupTimers;
  }, [dispatch, cleanupTimers]);

  // Rate limit persistence - single effect for both load/save
  useEffect(() => {
    const savedRateLimit = localStorage.getItem("loginRateLimit");
    if (savedRateLimit) {
      const parsed = JSON.parse(savedRateLimit);
      const now = Date.now();

      if (parsed.lockoutUntil && now > parsed.lockoutUntil) {
        localStorage.removeItem("loginRateLimit");
        setRateLimit(INITIAL_STATE.rateLimit);
      } else {
        setRateLimit(parsed);
      }
    }
  }, []); // Only run on mount

  useEffect(() => {
    if (rateLimit.attempts > 0 || rateLimit.lockoutUntil) {
      localStorage.setItem("loginRateLimit", JSON.stringify(rateLimit));
    } else {
      localStorage.removeItem("loginRateLimit");
    }
  }, [rateLimit]);

  // Session timeout warning - memoized event handlers
  useEffect(() => {
    const resetIdleTimer = () => {
      if (timersRef.current.idle) clearTimeout(timersRef.current.idle);

      if (isAuthenticated) {
        timersRef.current.idle = setTimeout(() => {
          console.warn("Your session will expire soon due to inactivity");
        }, 14 * 60 * 1000);
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      cleanupTimers();
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, [isAuthenticated, cleanupTimers]);

  // Memoized validation functions
  const validateAll = useCallback(() => {
    const errors = {};
    let isValid = true;

    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field, value);
      errors[field] = error;
      if (error) isValid = false;
    });

    setFormErrors((prev) => ({ ...prev, ...errors }));
    return isValid;
  }, [formData]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();

    // Check lockout
    if (rateLimit.lockoutUntil && now < rateLimit.lockoutUntil) {
      const remainingMinutes = Math.ceil(
        (rateLimit.lockoutUntil - now) / 1000 / 60
      );
      return `Too many failed attempts. Please try again in ${remainingMinutes} minute${
        remainingMinutes !== 1 ? "s" : ""
      }.`;
    }

    // Check attempts
    if (rateLimit.attempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
      if (
        rateLimit.lastAttempt &&
        now - rateLimit.lastAttempt < RATE_LIMIT_CONFIG.TIME_WINDOW
      ) {
        const lockoutUntil = now + RATE_LIMIT_CONFIG.LOCKOUT_DURATION;
        setRateLimit((prev) => ({ ...prev, lockoutUntil }));
        return `Too many attempts. Account locked for 15 minutes.`;
      } else {
        // Reset if outside time window
        setRateLimit(INITIAL_STATE.rateLimit);
      }
    }

    return "";
  }, [rateLimit]);

  // Event handlers - optimized with early returns
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const sanitizedValue = sanitizeInput(value, name);

      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));

      // Clear errors
      if (error) dispatch(clearError());
      if (formErrors.form) {
        setFormErrors((prev) => ({ ...prev, form: "" }));
      }

      // Validate if needed
      if (touched[name] || isSubmitting) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: validateField(name, sanitizedValue),
        }));
      }
    },
    [error, touched, isSubmitting, dispatch, formErrors.form]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;

      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate on blur
      const error = validateField(name, formData[name]);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    },
    [formData]
  );

  const togglePasswordVisibility = useCallback(() => {
    if (timersRef.current.passwordVisibility) {
      clearTimeout(timersRef.current.passwordVisibility);
    }

    if (!showPassword) {
      setShowPassword(true);
      timersRef.current.passwordVisibility = setTimeout(() => {
        setShowPassword(false);
      }, 3000);
    } else {
      setShowPassword(false);
    }
  }, [showPassword]);

  // Main submit handler - optimized flow
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Early returns for invalid states
      if (isSubmitting || isLoading) return;
      if (rateLimit.lockoutUntil && Date.now() < rateLimit.lockoutUntil) return;

      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(touched).reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      );
      setTouched(allTouched);

      // Rate limit check
      const rateLimitError = checkRateLimit();
      if (rateLimitError) {
        setFormErrors((prev) => ({ ...prev, form: rateLimitError }));
        setIsSubmitting(false);
        return;
      }

      // Form validation
      if (!validateAll()) {
        timersRef.current.submit = setTimeout(() => {
          const firstErrorField = Object.entries(formErrors).find(
            ([field, error]) => error && field !== "form"
          )?.[0];

          if (firstErrorField) {
            document.getElementById(firstErrorField)?.focus();
          }
        }, 0);

        setRateLimit((prev) => ({
          ...prev,
          attempts: prev.attempts + 1,
          lastAttempt: Date.now(),
        }));

        setIsSubmitting(false);
        return;
      }

      try {
        // Debounce and submit
        await new Promise((resolve) => setTimeout(resolve, 300));
        const result = await dispatch(loginUser(formData));

        if (loginUser.fulfilled.match(result)) {
          setRateLimit(INITIAL_STATE.rateLimit);
        } else {
          setRateLimit((prev) => ({
            ...prev,
            attempts: prev.attempts + 1,
            lastAttempt: Date.now(),
          }));
        }
      } catch (err) {
        console.error("Login error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      isLoading,
      touched,
      validateAll,
      formErrors,
      formData,
      dispatch,
      checkRateLimit,
      rateLimit.lockoutUntil,
    ]
  );

  // Memoized computed values
  const hasError = useCallback(
    (fieldName) => touched[fieldName] && formErrors[fieldName],
    [touched, formErrors]
  );

  const getInputClasses = useCallback(
    (fieldName) => {
      const baseClasses =
        "w-full px-3 py-2 pl-11 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm transition-colors duration-200";

      if (hasError(fieldName)) {
        return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200`;
      }

      if (
        touched[fieldName] &&
        !formErrors[fieldName] &&
        formData[fieldName].trim()
      ) {
        return `${baseClasses} border-green-300 focus:border-primary-500 focus:ring-primary-200`;
      }

      return `${baseClasses} border-gray-300 focus:border-primary-500 focus:ring-primary-200`;
    },
    [hasError, touched, formErrors, formData]
  );

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
        description: "Enter your email address in format: name@example.com",
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
        description:
          "Password must be at least 6 characters with uppercase, lowercase, number, and special character",
      },
    ],
    [showPassword]
  );

  const passwordRequirements = useMemo(
    () => [
      { test: /^.{6,}$/, label: "At least 6 characters" },
      { test: /[A-Z]/, label: "One uppercase letter" },
      { test: /[a-z]/, label: "One lowercase letter" },
      { test: /\d/, label: "One number" },
      {
        test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        label: "One special character",
      },
    ],
    []
  );

  const renderLockoutMessage = useCallback(() => {
    if (!rateLimit.lockoutUntil) return null;

    const now = Date.now();
    if (now < rateLimit.lockoutUntil) {
      const remainingMinutes = Math.ceil(
        (rateLimit.lockoutUntil - now) / 1000 / 60
      );
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-start"
          role="alert"
        >
          <Clock className="mr-2 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <strong className="font-medium">Account temporarily locked</strong>
            <p className="mt-1">
              Too many failed attempts. Please try again in {remainingMinutes}{" "}
              minute{remainingMinutes !== 1 ? "s" : ""}.
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  }, [rateLimit.lockoutUntil]);

  // Loading state
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

  const isLocked =
    rateLimit.lockoutUntil && Date.now() < rateLimit.lockoutUntil;
  const isDisabled = isLoading || isSubmitting || isLocked;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Shield className="text-primary-600 mr-2" size={24} />
            <h2 className="text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <p className="mt-2 text-gray-600">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
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
            {/* Form-level errors */}
            {(error || formErrors.form) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-4 py-3 rounded-lg text-sm ${
                  formErrors.form
                    ? "bg-amber-50 border border-amber-200 text-amber-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
                role="alert"
              >
                {formErrors.form || error}
              </motion.div>
            )}

            {/* Lockout message */}
            {renderLockoutMessage()}

            {/* Form fields */}
            {formFields.map((field) => {
              const hasFieldError = hasError(field.id);

              return (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
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
                      aria-invalid={hasFieldError}
                      aria-describedby={
                        hasFieldError
                          ? `${field.id}-error ${field.id}-description`
                          : `${field.id}-description`
                      }
                      aria-required="true"
                      disabled={isLocked}
                    />
                    <field.icon
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={18}
                      aria-hidden="true"
                    />

                    {field.showToggle && (
                      <button
                        type="button"
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={togglePasswordVisibility}
                        disabled={isLocked}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-controls="password"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    )}

                    {hasFieldError && (
                      <AlertCircle
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                        size={18}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div id={`${field.id}-description`} className="sr-only">
                    {field.description}
                  </div>

                  {hasFieldError && (
                    <motion.p
                      id={`${field.id}-error`}
                      className="mt-1 text-sm text-red-600 flex items-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle
                        size={14}
                        className="mr-1 mt-0.5 flex-shrink-0"
                      />
                      {formErrors[field.id]}
                    </motion.p>
                  )}
                </div>
              );
            })}

            {/* Password requirements hint */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Password must contain:</p>
              <ul className="space-y-1">
                {passwordRequirements.map((req, index) => {
                  const isMet = req.test.test(formData.password);
                  return (
                    <li
                      key={index}
                      className={`flex items-center ${
                        isMet ? "text-green-600" : ""
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          isMet ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Forgot password link */}
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-disabled={isLocked}
                  tabIndex={isLocked ? -1 : 0}
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isDisabled}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                aria-busy={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : isLocked ? (
                  "Account Locked"
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
