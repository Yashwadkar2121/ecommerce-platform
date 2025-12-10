import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Key, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { verifyOTP, clearError, resendOTP } from "../../store/slices/authSlice";

const OTP_LENGTH = 6;
const INITIAL_TIMER = 600; // 10 minutes in seconds for OTP validity
const MAX_VERIFICATION_ATTEMPTS = 3; // Limit for OTP verification attempts
const RESEND_COOLDOWN = 30; // 30 seconds cooldown for resend

const VerifyOTP = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isLoading, error, resetToken } = useAppSelector(
    (state) => state.auth
  );

  // Get email from URL query params
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email") || "";

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, OTP_LENGTH);
  }, []);

  // Timer effect for OTP validity
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setResendEnabled(true);
    }
  }, [resendCooldown]);

  // Show success message on component mount (coming from ForgotPassword)
  useEffect(() => {
    if (email) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [email]);

  // Watch for resetToken and navigate when it's available
  useEffect(() => {
    if (resetToken && !redirecting) {
      setRedirecting(true);

      // Add a small delay for better UX
      setTimeout(() => {
        navigate("/reset-password", {
          state: {
            resetToken,
            email,
          },
        });
      }, 1000);
    }
  }, [resetToken, navigate, email, redirecting]);

  const handleOtpChange = useCallback((index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    if (value.length > 1) {
      // Handle paste
      const pastedValues = value
        .split("")
        .slice(0, OTP_LENGTH)
        .filter((v) => /^\d+$/.test(v));
      const newOtp = Array(OTP_LENGTH).fill("");
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
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }
    }
  }, []);

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        // Move to previous input on backspace
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      } else if (e.key === "ArrowLeft" && index > 0) {
        // Move left with arrow key
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        // Move right with arrow key
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== OTP_LENGTH) {
      setErrorMessage("Please enter a 6-digit OTP");
      return;
    }

    // Check verification attempts limit
    if (verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      setErrorMessage(
        `Maximum verification attempts (${MAX_VERIFICATION_ATTEMPTS}) reached. Please request a new OTP.`
      );
      return;
    }

    setErrorMessage("");
    setRedirecting(false);

    try {
      await dispatch(verifyOTP({ email, otp: otpString })).unwrap();

      // Reset verification attempts on success
      setVerificationAttempts(0);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (error) {
      // Increment verification attempts on error
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);

      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();

      // Show attempt limit message if reached
      if (newAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        setErrorMessage(
          `Maximum verification attempts reached. Please request a new OTP.`
        );
      }
    }
  };

  const handleResendOTP = async () => {
    if (!resendEnabled || resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    setErrorMessage("");
    dispatch(clearError());

    try {
      // Call the resend OTP API
      await dispatch(resendOTP({ email })).unwrap();

      // Reset OTP timer to 10 minutes
      setTimer(INITIAL_TIMER);

      // Clear OTP fields
      setOtp(Array(OTP_LENGTH).fill(""));

      // Reset verification attempts
      setVerificationAttempts(0);

      // Set resend cooldown
      setResendCooldown(RESEND_COOLDOWN);
      setResendEnabled(false);

      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

      // Show resend success message
      setShowResendSuccess(true);
      setTimeout(() => {
        setShowResendSuccess(false);
      }, 3000);
    } catch (error) {
      setErrorMessage(
        error.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    navigate("/forgot-password");
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
          <p className="mt-2 text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-gray-100">
            <Mail className="h-4 w-4 mr-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
              {email}
            </span>
          </div>

          {/* Verification attempts counter */}
          {verificationAttempts > 0 && (
            <div
              className={`mt-2 text-sm ${
                verificationAttempts >= MAX_VERIFICATION_ATTEMPTS
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>
                  Verification attempts: {verificationAttempts}/
                  {MAX_VERIFICATION_ATTEMPTS}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Success Message for OTP verification */}
          {showSuccessMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>
                  {redirecting
                    ? "OTP verified! Redirecting to reset password..."
                    : "OTP verified successfully!"}
                </span>
              </div>
            </div>
          )}

          {/* Success Message for OTP resend */}
          {showResendSuccess && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>New OTP sent to your email!</span>
              </div>
            </div>
          )}

          {/* Redirecting Message */}
          {redirecting && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span>Redirecting to reset password page...</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {(error || errorMessage) && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                {error || errorMessage}
              </div>
            )}

            <div className="text-center">
              <div className="flex justify-center space-x-2 mb-6">
                {otp.map((digit, index) => (
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
                    disabled={verificationAttempts >= MAX_VERIFICATION_ATTEMPTS}
                    className={`w-12 h-12 text-center text-2xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      verificationAttempts >= MAX_VERIFICATION_ATTEMPTS
                        ? "border-red-300 bg-gray-100 cursor-not-allowed"
                        : digit
                        ? "border-green-300"
                        : "border-gray-300"
                    }`}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center mb-2">
                  <Key className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    OTP valid for:{" "}
                    <span
                      className={`font-semibold ${
                        timer < 60 ? "text-red-600" : ""
                      }`}
                    >
                      {formatTime(timer)}
                    </span>
                  </span>
                </div>

                {/* Resend cooldown timer */}
                {resendCooldown > 0 && (
                  <div className="text-sm text-gray-500">
                    Resend available in:{" "}
                    <span className="font-semibold">
                      {resendCooldown} seconds
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={
                  isLoading ||
                  otp.join("").length !== OTP_LENGTH ||
                  redirecting ||
                  verificationAttempts >= MAX_VERIFICATION_ATTEMPTS
                }
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : redirecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Redirecting...
                  </>
                ) : verificationAttempts >= MAX_VERIFICATION_ATTEMPTS ? (
                  "Maximum attempts reached"
                ) : (
                  "Verify OTP"
                )}
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={
                    !resendEnabled ||
                    isLoading ||
                    redirecting ||
                    isResending ||
                    resendCooldown > 0 ||
                    verificationAttempts >= MAX_VERIFICATION_ATTEMPTS
                  }
                  className="w-full text-sm font-medium text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                      Resending...
                    </span>
                  ) : resendCooldown > 0 ? (
                    `Resend available in ${resendCooldown}s`
                  ) : verificationAttempts >= MAX_VERIFICATION_ATTEMPTS ? (
                    "Maximum attempts reached"
                  ) : (
                    "Resend OTP"
                  )}
                </button>

                {verificationAttempts >= MAX_VERIFICATION_ATTEMPTS && (
                  <div className="text-xs text-red-500">
                    Maximum verification attempts reached. Please resend OTP.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleUseDifferentEmail}
                  disabled={isLoading || redirecting || isResending}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="inline mr-1 h-4 w-4" />
                  Use different email
                </button>
                <div>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={isLoading || redirecting || isResending}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="inline mr-1 h-4 w-4" />
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
