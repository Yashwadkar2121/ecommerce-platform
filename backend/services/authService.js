const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/mysql/User");
const Session = require("../models/mongodb/Session");
const PasswordResetToken = require("../models/mysql/PasswordResetToken");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");
const { sendEmail } = require("./emailService");
const { Op } = require("sequelize");

// Constants
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_EXPIRY = "15m";

// Email templates
const EMAIL_TEMPLATES = {
  passwordResetOTP: (otp) => ({
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Use the OTP below to reset your password:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; letter-spacing: 10px; font-size: 32px;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
      </div>
    `,
  }),
  passwordChanged: () => ({
    subject: "Password Changed Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Your password was successfully changed on ${new Date().toLocaleDateString()}.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      </div>
    `,
  }),
  newOTP: (otp) => ({
    subject: "New Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Password Reset OTP</h2>
        <p>A new OTP has been generated for your password reset request:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; letter-spacing: 10px; font-size: 32px;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),
  passwordResetSuccess: () => ({
    subject: "Password Reset Successful",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      </div>
    `,
  }),
};

class AuthService {
  // ========== CORE HELPER METHODS ==========

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  normalizeEmail(email) {
    return email ? email.trim().toLowerCase() : "";
  }

  normalizePhone(phone) {
    return phone ? phone.replace(/\D/g, "").trim() : null;
  }

  formatUserResponse(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      ...(user.createdAt && { createdAt: user.createdAt }),
      ...(user.updatedAt && { updatedAt: user.updatedAt }),
    };
  }

  // ========== SESSION MANAGEMENT ==========

  createSession(userId, refreshToken, userAgent = "", ipAddress = "") {
    return Session.create({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      userAgent,
      ipAddress,
    });
  }

  generateResetToken(email) {
    return jwt.sign(
      {
        email: this.normalizeEmail(email),
        purpose: "password_reset",
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRY },
    );
  }

  // ========== EMAIL MANAGEMENT ==========

  async sendEmailSafely(to, template, templateData = {}) {
    try {
      const templateConfig = EMAIL_TEMPLATES[template](templateData);
      await sendEmail({
        to,
        ...templateConfig,
      });
      return true;
    } catch (error) {
      console.error(
        `Failed to send ${template} email to ${to}:`,
        error.message,
      );
      return false;
    }
  }

  // ========== OTP MANAGEMENT ==========
  async cleanExpiredOTPs(email) {
    try {
      const deletedCount = await PasswordResetToken.destroy({
        where: {
          email: this.normalizeEmail(email),
          expiresAt: { [Op.lt]: new Date() },
        },
      });
      return deletedCount;
    } catch (error) {
      console.error("Failed to clean expired OTPs:", error.message);
      return 0;
    }
  }

  // NEW: Centralized OTP creation method
  async createNewOTP(email) {
    const normalizedEmail = this.normalizeEmail(email);

    // Clean expired OTPs first
    await this.cleanExpiredOTPs(normalizedEmail);

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY);

    // Delete existing OTPs for this email
    await PasswordResetToken.destroy({
      where: { email: normalizedEmail },
    });

    // Create new OTP
    await PasswordResetToken.create({
      email: normalizedEmail,
      token: otp,
      expiresAt,
      used: false,
    });

    return { otp, expiresAt, email: normalizedEmail };
  }

  // NEW: Centralized user existence check with security
  async checkUserExists(email, throwError = false) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user && throwError) {
      throw new Error("User not found");
    }

    return { exists: !!user, user, email: normalizedEmail };
  }

  // ========== AUTH METHODS ==========

  async registerUser(userData, userAgent = "", ipAddress = "") {
    const { email, password, firstName, lastName, phone } = userData;

    // Email availability check
    const emailCheck = await this.checkEmailAvailability(email);
    if (!emailCheck.available) {
      throw new Error(emailCheck.error); // "Email already registered"
    }

    // Phone availability check (if provided)
    if (phone) {
      const phoneCheck = await this.checkPhoneAvailability(phone);
      if (!phoneCheck.available) {
        throw new Error(phoneCheck.error); // "Phone number already in use" or invalid format
      }
    }

    // create user
    const user = await User.create({
      email: this.normalizeEmail(email),
      password,
      firstName,
      lastName,
      phone: phone ? this.normalizePhone(phone) : null,
    });

    const tokens = generateTokens(user.id, user.role);
    await this.createSession(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  async loginUser(email, password, userAgent = "", ipAddress = "") {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await User.scope("withPassword").findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const tokens = generateTokens(user.id, user.role);
    await this.createSession(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      user: this.formatUserResponse(user),
    };
  }

  async updateProfile(userId, updateData) {
    const { firstName, lastName, phone } = updateData;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Business logic for phone uniqueness
    if (phone !== undefined && phone !== user.phone) {
      const normalizedPhone = this.normalizePhone(phone);

      if (normalizedPhone) {
        const existingUser = await User.findOne({
          where: { phone: normalizedPhone },
        });

        if (existingUser && existingUser.id !== userId) {
          throw new Error("Phone number already in use by another account");
        }
      }
    }

    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (phone !== undefined) {
      updateFields.phone = phone ? this.normalizePhone(phone) : null;
    }

    await user.update(updateFields);
    return {
      user: this.formatUserResponse(user),
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    user.password = newPassword;
    await user.save();

    // Send notification email
    await this.sendEmailSafely(user.email, "passwordChanged");

    return { message: "Password changed successfully" };
  }

  async refreshUserSession(refreshToken) {
    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      throw new Error("Invalid token payload");
    }

    const session = await Session.findOne({
      userId: Number(decoded.id),
      token: refreshToken,
    });

    if (!session) {
      throw new Error("Invalid refresh token");
    }

    const tokens = generateTokens(decoded.id, decoded.role);
    session.token = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
    await session.save();

    return { tokens };
  }

  async logoutUser(userId, refreshToken) {
    if (!userId || !refreshToken) {
      throw new Error("User ID and refresh token are required");
    }

    const session = await Session.findOne({
      userId: Number(userId),
      token: refreshToken,
    });

    if (!session) {
      throw new Error("Session not found. Please log in again.");
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      throw new Error("Session expired. Please log in again.");
    }

    await Session.deleteOne({ _id: session._id });
    return { message: "Logged out successfully" };
  }

  async forgotPassword(email) {
    const { exists, email: normalizedEmail } =
      await this.checkUserExists(email);

    if (!exists) {
      // Security: Don't reveal if user exists
      return {
        message: "If an account exists with this email, an OTP will be sent",
      };
    }

    const { otp, expiresAt } = await this.createNewOTP(email);

    // Send OTP email
    await this.sendEmailSafely(normalizedEmail, "passwordResetOTP", otp);

    return {
      message: "OTP sent successfully",
      expiresAt,
    };
  }

  async verifyOTP(email, otp) {
    const normalizedEmail = this.normalizeEmail(email);
    const trimmedOTP = otp.trim();

    const tokenRecord = await PasswordResetToken.findOne({
      where: {
        email: normalizedEmail,
        token: trimmedOTP,
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid OTP");
    }

    // Check if OTP is expired
    if (new Date() > tokenRecord.expiresAt) {
      await PasswordResetToken.destroy({
        where: { email: normalizedEmail, token: trimmedOTP },
      });
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Check if OTP has been used
    if (tokenRecord.used) {
      throw new Error("OTP has already been used. Please request a new one.");
    }

    // Mark OTP as used
    await tokenRecord.update({ used: true });

    // Generate reset token
    const resetToken = this.generateResetToken(normalizedEmail);

    return {
      resetToken,
      message: "OTP verified successfully",
    };
  }

  async resendOTP(email) {
    // Handle different email input formats
    let actualEmail;
    if (typeof email === "object" && email !== null && email.email) {
      actualEmail = email.email;
    } else if (typeof email === "string") {
      actualEmail = email;
    } else {
      throw new Error(`Invalid email format. Received: ${typeof email}`);
    }

    const { exists, email: normalizedEmail } =
      await this.checkUserExists(actualEmail);

    if (!exists) {
      return {
        success: true,
        message:
          "If an account exists with this email, a new OTP has been sent",
      };
    }

    const { otp, expiresAt } = await this.createNewOTP(normalizedEmail);

    // Send new OTP email
    await this.sendEmailSafely(normalizedEmail, "newOTP", otp);

    return {
      success: true,
      message: "New OTP sent successfully",
      expiresAt,
    };
  }

  async resetPassword(resetToken, newPassword) {
    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired reset token");
    }

    if (decoded.purpose !== "password_reset") {
      throw new Error("Invalid token purpose");
    }

    const normalizedEmail = this.normalizeEmail(decoded.email);

    // Find user
    const user = await User.scope("withPassword").findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clean up all OTPs for this email
    await PasswordResetToken.destroy({
      where: { email: normalizedEmail },
    });

    // Send confirmation email
    await this.sendEmailSafely(normalizedEmail, "passwordResetSuccess");

    return {
      message: "Password reset successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async checkPhoneAvailability(phone) {
    const normalizedPhone = this.normalizePhone(phone);

    const existingUser = await User.findOne({
      where: { phone: normalizedPhone },
      attributes: ["id", "email"],
    });

    if (existingUser) {
      return {
        available: false,
        error: "Phone number already in use",
        userId: existingUser.id,
      };
    }

    return {
      available: true,
      message: "Phone number is available",
    };
  }

  async checkEmailAvailability(email) {
    const normalizedEmail = this.normalizeEmail(email);

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
      attributes: ["id", "email", "firstName"],
    });

    if (existingUser) {
      return {
        available: false,
        error: "Email already registered",
        userId: existingUser.id,
        userEmail: existingUser.email,
      };
    }

    return {
      available: true,
      message: "Email is available",
    };
  }
}

module.exports = new AuthService();
