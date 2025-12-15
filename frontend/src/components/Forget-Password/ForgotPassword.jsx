import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { forgotPassword, clearError } from "../../store/slices/authSlice";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [formErrors, setFormErrors] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60); // 60 seconds cooldown
  const [redirecting, setRedirecting] = useState(false);
  const [isFromVerifyOTP, setIsFromVerifyOTP] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Check if coming from VerifyOTP page
  useEffect(() => {
    if (location.state?.from === "verify-otp") {
      setIsFromVerifyOTP(true);
    }
  }, [location]);

  // Resend timer effect
  useEffect(() => {
    let timer;
    if (emailSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [emailSent, resendTimer]);

  // Auto-redirect to VerifyOTP page after OTP is sent
  useEffect(() => {
    if (emailSent && !redirecting) {
      // Redirect after 2 seconds to show success message
      const redirectTimer = setTimeout(() => {
        setRedirecting(true);
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);

      return () => clearTimeout(redirectTimer);
    }
  }, [emailSent, email, navigate, redirecting]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setFormErrors(emailError);
      return;
    }

    setFormErrors("");
    setRedirecting(false);

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setEmailSent(true);
      setShowSuccessMessage(true);
      setCanResend(false);
      setResendTimer(60); // Reset timer
    } catch (error) {
      console.log(error);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setFormErrors("");
    dispatch(clearError());
    setRedirecting(false);

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setCanResend(false);
      setResendTimer(60); // Reset timer
      setShowSuccessMessage(true);

      // Auto-redirect after resend
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleUseDifferentEmail = () => {
    setEmailSent(false);
    setEmail("");
    setFormErrors("");
    dispatch(clearError());
    setResendTimer(60);
    setCanResend(false);
    setRedirecting(false);
  };

  // Manual navigation if user wants to go immediately
  const navigateToVerifyOTP = () => {
    setRedirecting(true);
    navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
          {isFromVerifyOTP && (
            <p className="mt-2 text-sm text-blue-600">
              Please enter a different email address to receive a new OTP
            </p>
          )}
          <p className="mt-2 text-gray-600">
            Enter your email to receive a reset OTP
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
          {showSuccessMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>
                  OTP sent successfully!{" "}
                  {redirecting
                    ? "Redirecting..."
                    : "Redirecting in 2 seconds..."}
                </span>
              </div>
            </div>
          )}

          {emailSent ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit OTP to <strong>{email}</strong>. The OTP is
                valid for 10 minutes.
              </p>

              <div className="mb-6">
                <button
                  onClick={navigateToVerifyOTP}
                  disabled={redirecting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors mb-3 disabled:opacity-70"
                >
                  {redirecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Redirecting...
                    </>
                  ) : (
                    "Go to OTP Verification"
                  )}
                </button>

                <button
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading || redirecting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
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

              <div className="space-y-3">
                <button
                  onClick={handleUseDifferentEmail}
                  disabled={redirecting}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50"
                >
                  Use different email address
                </button>
                <div>
                  <button
                    onClick={handleBackToLogin}
                    disabled={redirecting}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500 flex items-center justify-center disabled:opacity-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                  {error}
                </div>
              )}

              {formErrors && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                  {formErrors}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors) setFormErrors("");
                      dispatch(clearError());
                    }}
                    className="w-full px-3 py-3 pl-11 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                    placeholder="Enter your registered email"
                  />
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the email associated with your account
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Back to Login
                  </Link>
                </p>
                <div>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500 flex items-center justify-center"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Login
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
