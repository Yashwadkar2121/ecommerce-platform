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
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || null, // Store null if empty
    });

    const tokens = generateTokens(user.id, user.role);

    await Session.create({
      userId: user.id,
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
        phone: user.phone,
        role: user.role,
      },
      tokens,
    });
  } catch (error) {
    console.error("Registration Error:", error.message);

    // Handle unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path;
      if (field === "phone") {
        return res.status(400).json({ error: "Phone number already in use" });
      }
      if (field === "email") {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

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

    await Session.create({
      userId: user.id,
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
        phone: user.phone,
        role: user.role,
      },
      tokens,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

// 👤 Get User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error.message);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

// ✏️ Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check phone uniqueness if phone is being changed
    if (phone !== undefined && phone !== user.phone) {
      // If phone is being cleared (set to empty/null)
      if (!phone || phone === "") {
        // Allow clearing phone number - no uniqueness check needed
        console.log(`Clearing phone number for user ${userId}`);
      } else {
        // Check if new phone number already exists
        const existingUser = await User.findOne({
          where: { phone },
          attributes: ["id", "email"],
        });

        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({
            error: "Phone number already in use by another account",
          });
        }
      }
    }

    // Update only allowed fields
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) {
      // Convert empty string to null to avoid unique constraint issues
      updateData.phone = phone && phone.trim() !== "" ? phone : null;
    }

    await user.update(updateData);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);

    // Handle unique constraint error
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0]?.path;
      if (field === "phone") {
        return res.status(400).json({
          error: "Phone number already in use by another account",
        });
      }
    }

    res.status(500).json({ error: "Failed to update profile" });
  }
};

// 🔐 Change Password (Improved version)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Changed Successfully",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed</h2>
            <p>Your password was successfully changed on ${new Date().toLocaleDateString()}.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send password change email:", emailError);
    }

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// ♻️ Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const session = await Session.findOne({
      userId: Number(userId),
      token: refreshToken,
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(userId, decoded.role);

    session.token = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    res.json({ tokens });
  } catch (error) {
    console.error("❌ Refresh Token Error:", error.message);
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

    const session = await Session.findOne({
      userId: Number(req.user.id),
      token: refreshToken,
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found. Please log in again.",
      });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({
        error: "Session expired. Please log in again.",
      });
    }

    await Session.deleteOne({ _id: session._id });

    return res.json({
      message: "✅ Logged out successfully",
      sessionDeleted: true,
    });
  } catch (error) {
    console.error("❌ Logout Error:", error.message);
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

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User with this email does not exist",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetToken.destroy({ where: { email } });

    await PasswordResetToken.create({
      email,
      token: otp,
      expiresAt,
    });

    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Use the OTP below to reset your password:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; letter-spacing: 10px; font-size: 32px;">${otp}</h1>
          </div>
          <p>This OTP is valid for 10 minutes.</p>
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

    const tokenRecord = await PasswordResetToken.findOne({
      where: { email, token: otp },
    });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    if (new Date() > tokenRecord.expiresAt) {
      await PasswordResetToken.destroy({ where: { email, token: otp } });
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    if (tokenRecord.used) {
      return res.status(400).json({
        success: false,
        error: "OTP has already been used",
      });
    }

    await tokenRecord.update({ used: true });

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

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({
        success: false,
        error: "Invalid token purpose",
      });
    }

    const { email } = decoded;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    user.password = newPassword;
    await user.save();

    await PasswordResetToken.destroy({ where: { email } });

    await sendEmail({
      to: email,
      subject: "Password Reset Successful",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
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

// Add this function to check phone availability
const checkPhoneAvailability = async (req, res) => {
  try {
    const { phone } = req.params;

    console.log("🔍 Checking phone availability for:", phone);

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      console.log("❌ Invalid phone format:", phone);
      return res.status(400).json({
        available: false,
        error: "Invalid phone format. Must be exactly 10 digits.",
      });
    }

    console.log("🔍 Querying database for phone:", phone);
    const existingUser = await User.findOne({
      where: { phone },
      attributes: ["id", "email"],
    });

    console.log("🔍 Database result:", existingUser ? "Found" : "Not found");

    if (existingUser) {
      console.log("❌ Phone already exists, user email:", existingUser.email);
      return res.status(200).json({
        available: false,
        error: "Phone number already in use",
        userId: existingUser.id,
      });
    }

    console.log("✅ Phone is available");
    return res.status(200).json({
      available: true,
      message: "Phone number is available",
    });
  } catch (error) {
    console.error("💥 Check Phone Error:", error.message);
    console.error("💥 Error stack:", error.stack);
    return res.status(500).json({
      available: false,
      error: "Failed to check phone availability: " + error.message,
    });
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
  generateOTP,
  forgotPassword,
  verifyOTP,
  resetPassword,
  checkPhoneAvailability,
};
