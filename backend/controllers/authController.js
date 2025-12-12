// controllers/authController.js
const AuthService = require("../services/authService");

// 🧩 Register User
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
    next(error); // Pass to universal error handler
  }
};

// 🧩 Login User
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

// 👤 Get User Profile
const getProfile = async (req, res, next) => {
  try {
    const result = await AuthService.getProfile(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ✏️ Update User Profile
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

// 🔐 Change Password
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

// ♻️ Refresh Token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshUserSession(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 🚪 Logout User
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

// Forgot password - Send OTP
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await AuthService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await AuthService.verifyOTP(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.resendOTP(email);

    res.status(200).json({
      success: true,
      message: "New OTP sent to your email",
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    await AuthService.resetPassword(resetToken, newPassword);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
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
};
