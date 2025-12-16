import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Key,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { verifyOTP, clearError, resendOTP } from "../../store/slices/authSlice";

// Constants
const OTP_LENGTH = 6;
const INITIAL_TIMER = 600; // 10 minutes
const MAX_VERIFICATION_ATTEMPTS = 3;
const RESEND_COOLDOWN = 30; // 30 seconds
const REDIRECT_DELAY = 1000;
const RESEND_SUCCESS_DURATION = 3000;

// Utility functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const generateInitialOtp = () => Array(OTP_LENGTH).fill("");

const VerifyOTP = () => {
  // State
  const [otp, setOtp] = useState(generateInitialOtp());
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  // Refs
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Selectors
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Derived values
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const email = queryParams.get("email") || "";
  const otpString = otp.join("");
  const isOtpComplete = otpString.length === OTP_LENGTH;
  const hasMaxAttempts = verificationAttempts >= MAX_VERIFICATION_ATTEMPTS;
  const isTimerExpired = timer <= 0;

  // Improved resend button logic
  const canResend =
    resendCooldown <= 0 && !isResending && !isTimerExpired && !hasMaxAttempts;
  const isDisabled = isLoading || redirecting || isResending || hasMaxAttempts;

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, OTP_LENGTH);
  }, []);

  // Timer for OTP validity
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Reset state when email changes
  useEffect(() => {
    const resetState = () => {
      setOtp(generateInitialOtp());
      setTimer(INITIAL_TIMER);
      setVerificationAttempts(0);
      setResendCooldown(0);
      setErrorMessage("");
      setShowSuccessMessage(false);
      setRedirecting(false);
      setShowResendSuccess(false);
      setResetToken(null);
      dispatch(clearError());
    };

    resetState();
  }, [email, dispatch]);

  // Event handlers
  const handleOtpChange = useCallback((index, value) => {
    // Validate numeric input
    if (value && !/^\d+$/.test(value)) return;

    if (value.length > 1) {
      // Handle paste
      const pastedValues = value
        .split("")
        .slice(0, OTP_LENGTH)
        .filter((v) => /^\d+$/.test(v));

      const newOtp = generateInitialOtp();
      pastedValues.forEach((val, i) => {
        if (i < OTP_LENGTH) newOtp[i] = val;
      });

      setOtp(newOtp);

      // Focus last input
      const lastIndex = Math.min(pastedValues.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
    } else {
      // Handle single digit input
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = value;
        return newOtp;
      });

      // Auto-focus next input
      if (value && index < OTP_LENGTH - 1) {
        requestAnimationFrame(() => {
          inputRefs.current[index + 1]?.focus();
        });
      }
    }
  }, []);

  const handleKeyDown = useCallback(
    (index, e) => {
      switch (e.key) {
        case "Backspace":
          if (!otp[index] && index > 0) {
            e.preventDefault();
            requestAnimationFrame(() => {
              inputRefs.current[index - 1]?.focus();
            });
          }
          break;
        case "ArrowLeft":
          if (index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
          }
          break;
        case "ArrowRight":
          if (index < OTP_LENGTH - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
          }
          break;
        default:
          break;
      }
    },
    [otp]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOtpComplete) {
      setErrorMessage("Please enter a 6-digit OTP");
      return;
    }

    if (hasMaxAttempts) {
      setErrorMessage(
        `Maximum verification attempts (${MAX_VERIFICATION_ATTEMPTS}) reached. Please request a new OTP.`
      );
      return;
    }

    if (isTimerExpired) {
      setErrorMessage("OTP has expired. Please request a new OTP.");
      return;
    }

    setErrorMessage("");
    setRedirecting(false);

    try {
      const result = await dispatch(
        verifyOTP({ email, otp: otpString })
      ).unwrap();

      const token = result.resetToken;
      setResetToken(token);
      setVerificationAttempts(0);
      setShowSuccessMessage(true);

      // Redirect after delay
      setTimeout(() => {
        navigate("/reset-password", {
          state: { resetToken: token, email },
          replace: true,
        });
      }, REDIRECT_DELAY);
    } catch (error) {
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);
      setOtp(generateInitialOtp());
      inputRefs.current[0]?.focus();

      if (newAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        setErrorMessage(
          `Maximum verification attempts reached. Please request a new OTP.`
        );
      }
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsResending(true);
    setErrorMessage("");
    dispatch(clearError());

    try {
      await dispatch(resendOTP(email)).unwrap();

      // Reset timer to full duration
      setTimer(INITIAL_TIMER);
      setOtp(generateInitialOtp());
      setVerificationAttempts(0);
      setResetToken(null);

      // Start cooldown timer
      setResendCooldown(RESEND_COOLDOWN);

      // Focus first input
      requestAnimationFrame(() => {
        inputRefs.current[0]?.focus();
      });

      // Show success message
      setShowResendSuccess(true);
      setTimeout(() => {
        setShowResendSuccess(false);
      }, RESEND_SUCCESS_DURATION);
    } catch (error) {
      console.error("Resend OTP error:", error);
      setErrorMessage(
        error.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    dispatch(clearError());
    navigate("/forgot-password", {
      state: { from: "verify-otp" },
      replace: true,
    });
  };

  const handleBackToLogin = () => {
    dispatch(clearError());
    navigate("/login", { replace: true });
  };

  // Memoized components
  const renderOtpInputs = useMemo(
    () =>
      otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={hasMaxAttempts || isDisabled || isTimerExpired}
          className={`w-12 h-12 text-center text-2xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
            hasMaxAttempts || isTimerExpired
              ? "border-gray-300 bg-gray-100 cursor-not-allowed"
              : digit
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          aria-label={`OTP digit ${index + 1}`}
          aria-disabled={hasMaxAttempts || isDisabled || isTimerExpired}
        />
      )),
    [
      otp,
      handleOtpChange,
      handleKeyDown,
      hasMaxAttempts,
      isDisabled,
      isTimerExpired,
    ]
  );

  const renderButtonContent = useMemo(() => {
    if (isLoading) return "Verifying...";
    if (redirecting) return "Redirecting...";
    if (hasMaxAttempts) return "Maximum attempts reached";
    if (isTimerExpired) return "OTP Expired";
    return "Verify OTP";
  }, [isLoading, redirecting, hasMaxAttempts, isTimerExpired]);

  const renderResendButtonContent = useMemo(() => {
    if (isResending) return "Sending...";
    if (resendCooldown > 0) return `Resend OTP (${resendCooldown}s)`;
    if (hasMaxAttempts) return "Maximum attempts reached";
    if (isTimerExpired) return "OTP Expired";
    return "Resend OTP";
  }, [isResending, resendCooldown, hasMaxAttempts, isTimerExpired]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Email Required
          </h2>
          <p className="mt-2 text-gray-600">
            Please provide an email address to verify OTP.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Go to Forgot Password
          </button>
        </div>
      </div>
    );
  }

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
              <Key className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Verify OTP
          </h1>
          <p className="mt-2 text-gray-600">
            Enter the 6-digit code sent to your email
          </p>

          <div className="mt-6 inline-flex items-center px-4 py-3 rounded-full bg-gray-50 border border-gray-200 max-w-md">
            <Mail className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {email}
            </span>
          </div>

          {verificationAttempts > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-4 text-sm ${
                hasMaxAttempts ? "text-red-600" : "text-yellow-600"
              }`}
            >
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>
                  Attempts: {verificationAttempts}/{MAX_VERIFICATION_ATTEMPTS}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 border border-gray-100">
          {/* Success Messages */}
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm"
              role="alert"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>OTP verified! Redirecting to reset password...</span>
              </div>
            </motion.div>
          )}

          {showResendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm"
              role="alert"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>New OTP sent to your email!</span>
              </div>
            </motion.div>
          )}

          {/* Error Messages */}
          {(error || errorMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm"
              role="alert"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>{error || errorMessage}</span>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* OTP Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter 6-digit OTP
              </label>
              <div className="flex justify-center gap-3 mb-6">
                {renderOtpInputs}
              </div>

              {/* Timer and Info */}
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 animate-pulse ${
                        timer < 60 ? "bg-red-500" : "bg-green-500"
                      }`}
                    />
                    <span>Valid for: </span>
                    <span
                      className={`font-semibold ml-1 ${
                        timer < 60
                          ? "text-red-600"
                          : timer < 120
                          ? "text-yellow-600"
                          : "text-gray-700"
                      }`}
                    >
                      {formatTime(timer)}
                    </span>
                  </div>
                </div>

                {isTimerExpired && (
                  <div className="text-sm text-red-600 font-medium">
                    OTP has expired. Please request a new one.
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                !isOtpComplete || isDisabled || hasMaxAttempts || isTimerExpired
              }
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              aria-busy={isLoading || redirecting}
            >
              {isLoading || redirecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                  {renderButtonContent}
                </>
              ) : (
                renderButtonContent
              )}
            </button>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend}
                  className={`flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    canResend
                      ? "text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  aria-label="Resend OTP"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent mr-2" />
                      {renderResendButtonContent}
                    </>
                  ) : (
                    <>
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          canResend ? "text-primary-600" : "text-gray-400"
                        }`}
                      />
                      {renderResendButtonContent}
                    </>
                  )}
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleUseDifferentEmail}
                  disabled={isDisabled}
                  className="flex-1 flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Different Email
                </button>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={isDisabled}
                  className="flex-1 flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For security reasons, OTP expires in 10 minutes and can only be used
            once. You can request a new OTP every 30 seconds.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
