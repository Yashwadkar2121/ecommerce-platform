import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { resetPassword, clearError } from "../../store/slices/authSlice";

const ResetPassword = () => {
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

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  useEffect(() => {
    // console.log("Reset token in component:", resetToken); // Debug log
    // console.log("Email in component:", email); // Debug log

    if (!resetToken) {
      // console.log("No reset token found, redirecting to forgot-password");
      navigate("/forgot-password");
    }
  }, [resetToken, navigate, email]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (confirmPassword !== passwords.newPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value,
    });

    // Clear errors when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }

    dispatch(clearError());
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "newPassword") {
      setFormErrors({
        ...formErrors,
        [name]: validatePassword(value),
      });
    } else if (name === "confirmPassword") {
      setFormErrors({
        ...formErrors,
        [name]: validateConfirmPassword(value),
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(passwords.newPassword);
    const confirmError = validateConfirmPassword(passwords.confirmPassword);

    if (passwordError || confirmError) {
      setFormErrors({
        newPassword: passwordError,
        confirmPassword: confirmError,
      });
      return;
    }

    // console.log("Submitting password reset with token:", resetToken); // Debug log

    try {
      await dispatch(
        resetPassword({
          resetToken,
          newPassword: passwords.newPassword,
        })
      ).unwrap();

      setPasswordReset(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successful! Please login with your new password.",
          },
        });
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login page in 3 seconds...
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Click here to go to login immediately
            </button>
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
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-gray-600">
            Create a new password for your account
          </p>
          {email && <p className="mt-1 text-sm text-gray-500">For: {email}</p>}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.newPassword ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 pl-11 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm ${
                    formErrors.newPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  placeholder="Enter new password (min. 6 characters)"
                  autoComplete="new-password"
                />
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  aria-label={
                    showPasswords.newPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPasswords.newPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {formErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 pl-11 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm ${
                    formErrors.confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
                  }`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  aria-label={
                    showPasswords.confirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPasswords.confirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/verify-otp", { state: { email } })}
                className="text-sm font-medium text-gray-600 hover:text-gray-500"
              >
                <ArrowLeft className="inline mr-1 h-4 w-4" />
                Back to OTP verification
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
