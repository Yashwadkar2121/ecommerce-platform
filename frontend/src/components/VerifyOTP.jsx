import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Key, ArrowLeft, CheckCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { verifyOTP, clearError } from "../store/slices/authSlice";

const VerifyOTP = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [resendEnabled, setResendEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
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

  // Timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setResendEnabled(true);
    }
  }, [timer]);

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

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    if (value.length > 1) {
      // Handle paste
      const pastedValues = value
        .split("")
        .slice(0, 6)
        .filter((v) => /^\d+$/.test(v));
      const newOtp = [...otp];
      pastedValues.forEach((val, i) => {
        if (i < 6) newOtp[i] = val;
      });
      setOtp(newOtp);

      // Focus last input
      const lastIndex = Math.min(pastedValues.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setErrorMessage("Please enter a 6-digit OTP");
      return;
    }

    setErrorMessage("");
    setRedirecting(false);

    try {
      await dispatch(verifyOTP({ email, otp: otpString })).unwrap();

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (error) {
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    // Reset timer and OTP fields
    setTimer(600);
    setResendEnabled(false);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    setErrorMessage("");
    dispatch(clearError());
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
            <span className="text-sm font-medium text-gray-700">{email}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>
                  {redirecting
                    ? "OTP verified! Redirecting to reset password..."
                    : "OTP verified successfully!"}
                </span>
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
                    className="w-12 h-12 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                ))}
              </div>

              <div className="flex items-center justify-center mb-6">
                <Key className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Time remaining:{" "}
                  <span className="font-semibold">{formatTime(timer)}</span>
                </span>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.join("").length !== 6 || redirecting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                ) : (
                  "Verify OTP"
                )}
              </button>
            </div>

            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!resendEnabled || isLoading || redirecting}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendEnabled ? "Resend OTP" : "Resend OTP"}
              </button>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  <ArrowLeft className="inline mr-1 h-4 w-4" />
                  Use different email
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500"
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
