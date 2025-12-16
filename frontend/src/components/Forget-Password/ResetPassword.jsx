import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { resetPassword, clearError } from "../../store/slices/authSlice";

// Constants
const MIN_PASSWORD_LENGTH = 6;
const REDIRECT_DELAY = 3000;
const TOKEN_VALIDITY_CHECK_DELAY = 100;

const ResetPassword = () => {
  // State
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [formErrors, setFormErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordReset, setPasswordReset] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Selectors
  const { isLoading: authLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Derived values
  const resetToken = location.state?.resetToken;
  const email = location.state?.email;
  const isLoading = authLoading || isSubmitting;
  const isFormValid = useMemo(
    () =>
      passwords.newPassword.length >= MIN_PASSWORD_LENGTH &&
      passwords.confirmPassword === passwords.newPassword &&
      !formErrors.newPassword &&
      !formErrors.confirmPassword,
    [passwords, formErrors]
  );

  // Effects
  useEffect(() => {
    // Check token validity with debounce
    const timer = setTimeout(() => {
      if (!resetToken) {
        setTokenError(true);

        // Optimized redirect with state preservation
        const redirectTimer = setTimeout(() => {
          navigate("/forgot-password", {
            replace: true,
            state: {
              email: email || "",
              error:
                "Invalid or expired reset token. Please request a new OTP.",
            },
          });
        }, REDIRECT_DELAY);

        return () => clearTimeout(redirectTimer);
      }
    }, TOKEN_VALIDITY_CHECK_DELAY);

    return () => clearTimeout(timer);
  }, [resetToken, navigate, email]);

  // Validation functions
  const validatePassword = useCallback((password) => {
    if (!password) return "Password is required";
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return "";
  }, []);

  const validateConfirmPassword = useCallback(
    (confirmPassword, newPassword) => {
      if (!confirmPassword) return "Please confirm your password";
      if (confirmPassword !== newPassword) {
        return "Passwords do not match";
      }
      return "";
    },
    []
  );

  // Event handlers
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setPasswords((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear field-specific error
      if (formErrors[name]) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }

      dispatch(clearError());
    },
    [formErrors, dispatch]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;

      if (name === "newPassword") {
        setFormErrors((prev) => ({
          ...prev,
          [name]: validatePassword(value),
        }));
      } else if (name === "confirmPassword") {
        setFormErrors((prev) => ({
          ...prev,
          [name]: validateConfirmPassword(value, passwords.newPassword),
        }));
      }
    },
    [validatePassword, validateConfirmPassword, passwords.newPassword]
  );

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Client-side validation
      const passwordError = validatePassword(passwords.newPassword);
      const confirmError = validateConfirmPassword(
        passwords.confirmPassword,
        passwords.newPassword
      );

      if (passwordError || confirmError) {
        setFormErrors({
          newPassword: passwordError,
          confirmPassword: confirmError,
        });
        return;
      }

      if (!isFormValid || !resetToken) return;

      setIsSubmitting(true);

      try {
        await dispatch(
          resetPassword({
            resetToken,
            newPassword: passwords.newPassword,
          })
        ).unwrap();

        setPasswordReset(true);

        // Optimized redirect with cleanup
        const redirectTimer = setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: {
              email: email || "",
              message:
                "Password reset successful! Please login with your new password.",
            },
          });
        }, REDIRECT_DELAY);

        return () => clearTimeout(redirectTimer);
      } catch (error) {
        console.error("Password reset error:", error);
        // Error is already handled by Redux slice
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      passwords,
      validatePassword,
      validateConfirmPassword,
      isFormValid,
      resetToken,
      dispatch,
      navigate,
      email,
    ]
  );

  // Navigation handlers
  const handleBackToForgotPassword = useCallback(() => {
    navigate("/forgot-password", {
      replace: true,
      state: { email: email || "" },
    });
  }, [navigate, email]);

  const handleGoToLogin = useCallback(() => {
    navigate("/login", {
      replace: true,
      state: {
        email: email || "",
        message: passwordReset
          ? "Password reset successful! Please login with your new password."
          : "",
      },
    });
  }, [navigate, email, passwordReset]);

  // Memoized components
  const renderPasswordField = useCallback(
    (fieldName, label, placeholder) => (
      <div>
        <label
          htmlFor={fieldName}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={fieldName}
            name={fieldName}
            type={showPasswords[fieldName] ? "text" : "password"}
            value={passwords[fieldName]}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2.5 pl-11 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm transition-colors ${
              formErrors[fieldName]
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
            } ${isLoading ? "bg-gray-50 cursor-not-allowed" : ""}`}
            placeholder={placeholder}
            autoComplete="new-password"
            disabled={isLoading}
            aria-invalid={!!formErrors[fieldName]}
            aria-describedby={
              formErrors[fieldName] ? `${fieldName}-error` : undefined
            }
          />
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
            aria-hidden="true"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-100 rounded p-1"
            onClick={() => togglePasswordVisibility(fieldName)}
            disabled={isLoading}
            aria-label={
              showPasswords[fieldName]
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            aria-pressed={showPasswords[fieldName]}
          >
            {showPasswords[fieldName] ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
        {formErrors[fieldName] && (
          <p
            id={`${fieldName}-error`}
            className="mt-1.5 text-sm text-red-600 flex items-center"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {formErrors[fieldName]}
          </p>
        )}
      </div>
    ),
    [
      passwords,
      showPasswords,
      formErrors,
      isLoading,
      handleChange,
      handleBlur,
      togglePasswordVisibility,
    ]
  );

  // Render states
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
            >
              <AlertCircle className="h-6 w-6 text-red-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid or Expired Token
            </h2>
            <p className="text-gray-600 mb-6">
              Your reset token is invalid or has expired.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to forgot password page...
            </p>
            <button
              onClick={handleBackToForgotPassword}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100 rounded-lg transition-colors"
              aria-label="Go to forgot password page"
            >
              Click here to go immediately
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"
            >
              <CheckCircle className="h-6 w-6 text-green-600" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              Password Reset Successful!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 mb-6"
            >
              Your password has been successfully reset.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-500 mb-4"
            >
              Redirecting to login page in 3 seconds...
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={handleGoToLogin}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100 rounded-lg transition-colors"
                aria-label="Go to login page"
              >
                Click here to go to login immediately
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <div className="mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 mb-3">
              <Lock className="h-5 w-5 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Create a new password for your account
          </p>
          {email && (
            <p className="text-xs text-gray-500 bg-gray-50 inline-block px-3 py-1 rounded-full">
              For: <span className="font-medium">{email}</span>
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Global Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Password Fields */}
            {renderPasswordField(
              "newPassword",
              "New Password",
              `Enter new password (min. ${MIN_PASSWORD_LENGTH} characters)`
            )}

            {renderPasswordField(
              "confirmPassword",
              "Confirm New Password",
              "Confirm new password"
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-black bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99]"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>

            {/* Navigation */}
            <div className="text-center pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleBackToForgotPassword}
                disabled={isLoading}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-100 rounded px-2 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Back to forgot password"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Forgot Password
              </button>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Choose a strong password that you haven't used before.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
