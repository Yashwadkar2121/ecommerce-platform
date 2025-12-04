const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/mysql/User");
const Session = require("../models/mongodb/Session");
const PasswordResetToken = require("../models/mysql/PasswordResetToken");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");
const { sendEmail } = require("../services/emailService");

// 🧩 Register User
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({ email, password, firstName, lastName });
    const tokens = generateTokens(user.id, user.role);

    // In register and login functions, update Session creation:
    await Session.create({
      userId: user.id, // Already a number - no need for toString()
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ error: "Registration failed" });
  }
};

// 🧩 Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tokens = generateTokens(user.id, user.role);

    // In register and login functions, update Session creation:
    await Session.create({
      userId: user.id, // Already a number - no need for toString()
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

// ♻️ Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    // Verify token
    const decoded = await verifyRefreshToken(refreshToken);

    // 🛠️ FIX: Now we can directly use decoded.id
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Find session - Use Number type to match Session schema
    const session = await Session.findOne({
      userId: Number(userId),
      token: refreshToken,
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const tokens = generateTokens(userId, decoded.role);

    // Update session
    session.token = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    res.json({ tokens });
  } catch (error) {
    console.error("❌ Refresh Token Error:", error.message);
    console.error("Error stack:", error.stack);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// 🚪 Logout User
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // Check if session exists - FIXED: Use Number type to match schema
    const session = await Session.findOne({
      userId: Number(req.user.id), // Convert to Number to match schema
      token: refreshToken,
    });

    if (!session) {
      // Debug: Check all sessions for this user
      const userSessions = await Session.find({ userId: Number(req.user.id) });

      return res.status(404).json({
        error: "Session not found. Please log in again.",
      });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({
        error: "Session expired. Please log in again.",
      });
    }

    // Delete session (logout)
    await Session.deleteOne({ _id: session._id });

    return res.json({
      message: "✅ Logged out successfully",
      sessionDeleted: true,
    });
  } catch (error) {
    console.error("❌ Logout Error:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ error: "Logout failed" });
  }
};

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Forgot password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User with this email does not exist",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing tokens for this email
    await PasswordResetToken.destroy({ where: { email } });

    // Create new token
    await PasswordResetToken.create({
      email,
      token: otp,
      expiresAt,
    });

    // Send email with OTP
    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Use the OTP below to proceed:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; letter-spacing: 10px; font-size: 32px;">${otp}</h1>
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #777; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process forgot password request",
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the token
    const tokenRecord = await PasswordResetToken.findOne({
      where: { email, token: otp },
    });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await PasswordResetToken.destroy({ where: { email, token: otp } });
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    // Check if token already used
    if (tokenRecord.used) {
      return res.status(400).json({
        success: false,
        error: "OTP has already been used",
      });
    }

    // Mark token as used
    await tokenRecord.update({ used: true });

    // Create a temporary reset token for the next step
    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Check if token is for password reset
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({
        success: false,
        error: "Invalid token purpose",
      });
    }

    const { email } = decoded;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete all reset tokens for this email
    await PasswordResetToken.destroy({ where: { email } });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Password Reset Successful",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #777; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  generateOTP,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
