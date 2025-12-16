import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { forgotPassword, clearError } from "../../store/slices/authSlice";

// Constants
const RESEND_COOLDOWN = 60; // 60 seconds
const REDIRECT_DELAY = 2000;
const SUCCESS_MESSAGE_DURATION = 2000;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Utility functions
const validateEmail = (email) => {
  if (!email?.trim()) return "Email is required";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address";
  return "";
};

const ForgotPassword = () => {
  // State
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [redirecting, setRedirecting] = useState(false);
  const [isFromVerifyOTP, setIsFromVerifyOTP] = useState(false);

  // Hooks
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Derived values
  const isSubmitDisabled = useMemo(
    () => isLoading || redirecting,
    [isLoading, redirecting]
  );
  const isResendDisabled = useMemo(
    () => !canResend || isLoading || redirecting,
    [canResend, isLoading, redirecting]
  );

  // Effects
  useEffect(() => {
    if (location.state?.from === "verify-otp") {
      setIsFromVerifyOTP(true);
    }
  }, [location]);

  // Resend timer effect
  useEffect(() => {
    if (!emailSent || resendTimer <= 0) {
      setCanResend(resendTimer <= 0);
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [emailSent, resendTimer]);

  // Auto-redirect effect
  useEffect(() => {
    if (!emailSent || redirecting) return;

    const redirectTimer = setTimeout(() => {
      setRedirecting(true);
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    }, REDIRECT_DELAY);

    return () => clearTimeout(redirectTimer);
  }, [emailSent, email, navigate, redirecting]);

  // Event handlers
  const handleEmailChange = useCallback(
    (e) => {
      const value = e.target.value;
      setEmail(value);

      if (formError) setFormError("");
      dispatch(clearError());
    },
    [formError, dispatch]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setFormError(emailError);
      return;
    }

    setFormError("");
    setRedirecting(false);

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setEmailSent(true);
      setShowSuccessMessage(true);
      setCanResend(false);
      setResendTimer(RESEND_COOLDOWN);

      // Hide success message after delay
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, SUCCESS_MESSAGE_DURATION);
    } catch (error) {
      console.error("Forgot password error:", error);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setFormError("");
    dispatch(clearError());
    setRedirecting(false);

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setCanResend(false);
      setResendTimer(RESEND_COOLDOWN);
      setShowSuccessMessage(true);

      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, REDIRECT_DELAY);
    } catch (error) {
      console.error("Resend OTP error:", error);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login", { replace: true });
  };

  const handleUseDifferentEmail = () => {
    setEmailSent(false);
    setEmail("");
    setFormError("");
    dispatch(clearError());
    setResendTimer(RESEND_COOLDOWN);
    setCanResend(false);
    setRedirecting(false);
  };

  const navigateToVerifyOTP = () => {
    setRedirecting(true);
    navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
  };

  // Memoized components
  const renderSuccessState = useMemo(
    () => (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
        >
          <CheckCircle className="h-8 w-8 text-green-600" />
        </motion.div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check Your Email
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          We've sent a 6-digit OTP to{" "}
          <span className="font-semibold text-gray-800">{email}</span>. The OTP
          is valid for 10 minutes.
        </p>

        <div className="space-y-3">
          <button
            onClick={navigateToVerifyOTP}
            disabled={redirecting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {redirecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Redirecting...
              </>
            ) : (
              "Go to OTP Verification"
            )}
          </button>

          <button
            onClick={handleResendOTP}
            disabled={isResendDisabled}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent mr-2" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {canResend
                  ? "Resend OTP"
                  : `Resend available in ${resendTimer}s`}
              </>
            )}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleUseDifferentEmail}
            disabled={redirecting}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
          >
            Use different email address
          </button>

          <div>
            <button
              onClick={handleBackToLogin}
              disabled={redirecting}
              className="text-sm font-medium text-gray-600 hover:text-gray-700 flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    ),
    [email, redirecting, isLoading, canResend, resendTimer, isResendDisabled]
  );

  const renderFormState = useMemo(
    () => (
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Error Messages */}
        {(error || formError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm"
            role="alert"
          >
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
              <span>{error || formError}</span>
            </div>
          </motion.div>
        )}

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>

          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors duration-200"
              placeholder="Enter your registered email"
              aria-describedby="email-description"
              aria-invalid={!!formError}
            />

            <Mail
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
              aria-hidden="true"
            />
          </div>

          <p id="email-description" className="mt-2 text-xs text-gray-500">
            Enter the email associated with your account
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
              Sending OTP...
            </>
          ) : (
            "Send OTP"
          )}
        </button>

        {/* Navigation Links */}
        <div className="text-center space-y-3 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline transition-colors"
            >
              Back to Login
            </Link>
          </p>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-sm font-medium text-gray-600 hover:text-gray-700 flex items-center justify-center focus:outline-none focus:underline transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </button>
        </div>
      </form>
    ),
    [email, formError, error, isLoading, isSubmitDisabled, handleEmailChange]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Forgot Password
          </h1>

          {isFromVerifyOTP && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-blue-600"
            >
              Please enter a different email address to receive a new OTP
            </motion.p>
          )}

          <p className="mt-2 text-gray-600">
            Enter your email to receive a reset OTP
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 border border-gray-100">
          {/* Success Message */}
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm"
              role="alert"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>
                  OTP sent successfully!{" "}
                  {redirecting
                    ? "Redirecting..."
                    : `Redirecting in ${REDIRECT_DELAY / 1000} seconds...`}
                </span>
              </div>
            </motion.div>
          )}

          {emailSent ? renderSuccessState : renderFormState}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For security, OTP expires in 10 minutes. Check your spam folder if
            you don't see it.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
