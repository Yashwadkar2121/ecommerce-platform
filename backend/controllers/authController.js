// controllers/authController.js
const AuthService = require("../services/authService");

// Register User
const register = async (req, res, next) => {
  try {
    const result = await AuthService.registerUser(
      req.body,
      req.get("User-Agent"),
      req.ip
    );

    res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(
      email,
      password,
      req.get("User-Agent"),
      req.ip
    );

    res.json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get User Profile
const getProfile = async (req, res, next) => {
  try {
    const result = await AuthService.getProfile(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Update User Profile
const updateProfile = async (req, res, next) => {
  try {
    const result = await AuthService.updateProfile(req.user.id, req.body);

    res.json({
      message: "Profile updated successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshUserSession(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Logout User
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logoutUser(req.user?.id, refreshToken);

    res.json({
      message: "✅ Logged out successfully",
      sessionDeleted: true,
    });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    const result = await AuthService.verifyOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: result.message,
      resetToken: result.resetToken,
    });
  } catch (error) {
    console.error(`❌ OTP Verification Controller Error: ${error.message}`);

    return res.status(400).json({
      success: false,
      error: error.message || "OTP verification failed",
    });
  }
};

// Forgot Password controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const result = await AuthService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error(`❌ Forgot Password Controller Error: ${error.message}`);

    return res.status(400).json({
      success: false,
      error: error.message || "Failed to process forgot password request",
    });
  }
};

// Resend OTP controller
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const result = await AuthService.resendOTP(email);

    return res.status(200).json({
      success: result.success !== false, // Default to true if not specified
      message: result.message || "OTP resent successfully",
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error(`❌ Resend OTP Controller Error: ${error.message}`);
    console.error(`❌ Full error stack:`, error);

    return res.status(400).json({
      success: false,
      error: error.message || "Failed to resend OTP",
    });
  }
};

// Reset Password controller
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Reset token and new password are required",
      });
    }

    const result = await AuthService.resetPassword(resetToken, newPassword);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error(`❌ Reset Password Controller Error: ${error.message}`);

    return res.status(400).json({
      success: false,
      error: error.message || "Failed to reset password",
    });
  }
};

// Check phone availability
const checkPhoneAvailability = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const result = await AuthService.checkPhoneAvailability(phone);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Check email availability
const checkEmailAvailability = async (req, res, next) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    const result = await AuthService.checkEmailAvailability(decodedEmail);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  forgotPassword,
  verifyOTP,
  resendOTP,
  resetPassword,
  checkPhoneAvailability,
  checkEmailAvailability,
};
