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

// Initial state objects
const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const initialFormErrors = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  terms: "",
};

const initialTouched = {
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
  terms: false,
};

const Register = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState(initialFormErrors);
  const [touched, setTouched] = useState(initialTouched);
  const [showTerms, setShowTerms] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const [phoneStatusMessage, setPhoneStatusMessage] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Format phone input to only allow digits and limit to 10
  const formatPhone = useCallback((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, 10);
  }, []);

  // Validate a single field
  const validateField = useCallback(
    (name, value, confirmValue = null) => {
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

      if (name === "confirmPassword") {
        const passwordValue = confirmValue || formData.password;
        if (value !== passwordValue) {
          return "Passwords do not match";
        }
      }

      return "";
    },
    [formData.password]
  );

  // Check phone availability
  const checkPhoneAvailability = useCallback(async (phone) => {
    if (!phone || phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
      setPhoneAvailable(null);
      setPhoneStatusMessage(
        phone.length > 0
          ? `${phone.length}/10 digits`
          : "Enter exactly 10 digits"
      );
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
        // Clear phone error if previously set
        setFormErrors((prev) => ({
          ...prev,
          phone: "",
        }));
      } else {
        setPhoneAvailable(false);
        const errorMsg = data.error || "Phone number already in use";
        setPhoneStatusMessage(errorMsg);
        // Set form error
        setFormErrors((prev) => ({
          ...prev,
          phone: errorMsg,
        }));
      }
    } catch (error) {
      console.error("Phone check error:", error);
      setPhoneAvailable(null);
      setPhoneStatusMessage("Unable to check phone availability");
    } finally {
      setPhoneChecking(false);
    }
  }, []);

  // Debounced phone check effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (formData.phone.length === 10 && /^[0-9]{10}$/.test(formData.phone)) {
        checkPhoneAvailability(formData.phone);
      } else {
        setPhoneAvailable(null);
        setPhoneStatusMessage(
          formData.phone.length > 0
            ? `${formData.phone.length}/10 digits`
            : "Enter exactly 10 digits"
        );
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.phone, checkPhoneAvailability]);

  // Handle field change
  const handleChange = useCallback(
    (e) => {
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

      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));

      // Clear server error when user types
      if (error) {
        dispatch(clearError());
      }

      // Validate field if it's been touched or form was submitted
      if (touched[name] || formSubmitted) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: validateField(name, formattedValue),
          // Clear confirm password error if password changes
          ...(name === "password" && formData.confirmPassword
            ? {
                confirmPassword: validateField(
                  "confirmPassword",
                  formData.confirmPassword,
                  formattedValue
                ),
              }
            : {}),
        }));
      }
    },
    [
      error,
      touched,
      formSubmitted,
      formData,
      dispatch,
      formatPhone,
      validateField,
    ]
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

      // Check phone availability when user leaves phone field
      if (name === "phone" && formData.phone.length === 10) {
        checkPhoneAvailability(formData.phone);
      }
    },
    [formData, validateField, checkPhoneAvailability]
  );

  // Handle terms checkbox
  const handleTermsChange = useCallback((e) => {
    const isChecked = e.target.checked;
    setTouched((prev) => ({
      ...prev,
      terms: true,
    }));
    setFormErrors((prev) => ({
      ...prev,
      terms: isChecked ? "" : "You must agree to the terms and conditions",
    }));
  }, []);

  // Validate all fields
  const validateAll = useCallback(() => {
    const errors = {};
    let isValid = true;

    // Validate form fields
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

    // Validate phone format
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, [formData, touched.terms, phoneAvailable, validateField]);

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
        if (firstErrorField && firstErrorField !== "terms") {
          document.getElementById(firstErrorField)?.focus();
        }
        return;
      }

      const { ...registerData } = formData;
      dispatch(registerUser(registerData));
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
        "appearance-none block w-full px-3 py-2 pl-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-200";

      if (hasError(fieldName)) {
        return (
          baseClasses +
          " border-red-300 focus:border-red-500 focus:ring-red-200"
        );
      }

      if (touched[fieldName] && !formErrors[fieldName]) {
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
    [hasError, touched, formErrors]
  );

  // Helper to get phone status icon and color
  const getPhoneStatusIcon = useMemo(() => {
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
  }, [phoneChecking, phoneAvailable, phoneStatusMessage]);

  // Password validation status
  const passwordValidation = useMemo(
    () => ({
      minLength: formData.password.length >= 6,
      hasLowercase: /[a-z]/.test(formData.password),
      hasUppercase: /[A-Z]/.test(formData.password),
      hasNumber: /\d/.test(formData.password),
      passwordsMatch:
        formData.password === formData.confirmPassword &&
        formData.confirmPassword.length > 0,
    }),
    [formData.password, formData.confirmPassword]
  );

  // Memoized form fields to prevent unnecessary re-renders
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
        autoComplete: "email",
        gridCols: "col-span-2",
      },
      {
        id: "phone",
        label: "Phone Number",
        type: "tel",
        placeholder: "1234567890",
        icon: Phone,
        autoComplete: "tel",
        gridCols: "col-span-2",
      },
      {
        id: "password",
        label: "Password",
        type: showPassword ? "text" : "password",
        placeholder: "Enter your password",
        icon: Lock,
        autoComplete: "new-password",
        showToggle: true,
        onToggle: () => setShowPassword(!showPassword),
        gridCols: "col-span-2",
      },
      {
        id: "confirmPassword",
        label: "Confirm Password",
        type: showConfirmPassword ? "text" : "password",
        placeholder: "Confirm your password",
        icon: Lock,
        autoComplete: "new-password",
        showToggle: true,
        onToggle: () => setShowConfirmPassword(!showConfirmPassword),
        gridCols: "col-span-2",
      },
    ],
    [showPassword, showConfirmPassword]
  );

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
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fadeIn">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {formFields.map((field) => (
                <div key={field.id} className={field.gridCols}>
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
                      required
                      value={formData[field.id]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClasses(field.id)}
                      placeholder={field.placeholder}
                      aria-invalid={hasError(field.id)}
                      aria-describedby={
                        hasError(field.id) ? `${field.id}-error` : undefined
                      }
                      maxLength={field.id === "phone" ? 10 : undefined}
                    />
                    <field.icon
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={18}
                    />

                    {/* Phone status indicators */}
                    {field.id === "phone" && phoneChecking && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      </div>
                    )}
                    {field.id === "phone" &&
                      !phoneChecking &&
                      phoneAvailable === true && (
                        <CheckCircle
                          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-green-500"
                          size={18}
                        />
                      )}
                    {field.id === "phone" &&
                      !phoneChecking &&
                      phoneAvailable === false && (
                        <XCircle
                          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500"
                          size={18}
                        />
                      )}

                    {/* Show toggle button for password fields */}
                    {field.showToggle && (
                      <button
                        type="button"
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500 transition-colors"
                        onClick={field.onToggle}
                        aria-label={
                          field.type === "text"
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {field.type === "text" ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
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
                    <p
                      id={`${field.id}-error`}
                      className="mt-1 text-sm text-red-600 animate-fadeIn"
                    >
                      {formErrors[field.id]}
                    </p>
                  )}

                  {/* Phone status message */}
                  {field.id === "phone" && !hasError(field.id) && (
                    <div className="mt-1 text-sm">{getPhoneStatusIcon}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Password validation hints */}
            {touched.password && !hasError("password") && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs">
                <p
                  className={`font-medium ${
                    passwordValidation.minLength
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {passwordValidation.minLength ? "✓" : "○"} At least 6
                  characters
                </p>
                <p
                  className={`${
                    passwordValidation.hasLowercase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {passwordValidation.hasLowercase ? "✓" : "○"} Contains
                  lowercase letter
                </p>
                <p
                  className={`${
                    passwordValidation.hasUppercase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {passwordValidation.hasUppercase ? "✓" : "○"} Contains
                  uppercase letter
                </p>
                <p
                  className={`${
                    passwordValidation.hasNumber
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {passwordValidation.hasNumber ? "✓" : "○"} Contains number
                </p>
              </div>
            )}

            {/* Password match indicator */}
            {touched.confirmPassword &&
              formData.confirmPassword.length > 0 &&
              !hasError("confirmPassword") && (
                <p className="text-sm flex items-center animate-fadeIn">
                  {passwordValidation.passwordsMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-gray-500">
                      Passwords do not match
                    </span>
                  )}
                </p>
              )}

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                onChange={handleTermsChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-offset-1"
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
                    className="text-primary-600 hover:text-primary-500 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
                  >
                    Terms and Conditions
                  </button>
                </label>
                {hasError("terms") && (
                  <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                    {formErrors.terms}
                  </p>
                )}
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || phoneChecking}
                className="w-full flex justify-center items-center py-3 px-4 border rounded-lg shadow-sm text-sm font-medium text-black border-gray-600 bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Creating Account...
                  </>
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
