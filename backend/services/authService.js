// services/AuthService.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/mysql/User");
const Session = require("../models/mongodb/Session");
const PasswordResetToken = require("../models/mysql/PasswordResetToken");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");
const { sendEmail } = require("./emailService");
const { Op } = require("sequelize"); // Import Sequelize operators

class AuthService {
  // Register User
  async registerUser(userData, userAgent = "", ipAddress = "") {
    const { email, password, firstName, lastName, phone } = userData;

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new Error("Email already registered");
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        throw new Error("Phone number already in use");
      }
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
    });

    const tokens = generateTokens(user.id, user.role);

    await Session.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      tokens,
    };
  }

  // Login User
  async loginUser(email, password, userAgent = "", ipAddress = "") {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const tokens = generateTokens(user.id, user.role);

    await Session.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      tokens,
    };
  }

  // Get User Profile
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
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
    };
  }

  // Update User Profile
  async updateProfile(userId, updateData) {
    const { firstName, lastName, phone } = updateData;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check phone uniqueness if phone is being changed
    if (phone !== undefined && phone !== user.phone) {
      // If phone is being cleared (set to empty/null)
      if (!phone || phone === "") {
        // Allow clearing phone number
        // console.log(`Clearing phone number for user ${userId}`);
      } else {
        // Check if new phone number already exists
        const existingUser = await User.findOne({
          where: { phone },
          attributes: ["id", "email"],
        });

        if (existingUser && existingUser.id !== userId) {
          throw new Error("Phone number already in use by another account");
        }
      }
    }

    // Update only allowed fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (phone !== undefined) {
      // Convert empty string to null
      updateFields.phone = phone && phone.trim() !== "" ? phone : null;
    }

    await user.update(updateFields);

    return {
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
    };
  }

  // Change Password
  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error("Both current and new password are required");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
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
  }

  // Refresh Token
  async refreshUserSession(refreshToken) {
    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const decoded = await verifyRefreshToken(refreshToken);
    const userId = decoded.id;

    if (!userId) {
      throw new Error("Invalid token payload");
    }

    const session = await Session.findOne({
      userId: Number(userId),
      token: refreshToken,
    });

    if (!session) {
      throw new Error("Invalid refresh token");
    }

    const tokens = generateTokens(userId, decoded.role);

    session.token = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    return { tokens };
  }

  // Logout User
  async logoutUser(userId, refreshToken) {
    if (!userId) {
      throw new Error("Unauthorized user");
    }

    if (!refreshToken) {
      throw new Error("Refresh token required");
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
  }

  // Generate OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Verify OTP - FIXED VERSION
  async verifyOTP(email, otp) {
    try {
      // console.log(`🔍 Verifying OTP for email: ${email}, OTP: ${otp}`);

      // Validate inputs
      if (!email || !otp) {
        throw new Error("Email and OTP are required");
      }

      // Find the token record with additional logging
      const tokenRecord = await PasswordResetToken.findOne({
        where: {
          email: email.trim().toLowerCase(), // Normalize email
          token: otp.trim(), // Trim whitespace from OTP
        },
      });

      // console.log(`📊 OTP Record found: ${!!tokenRecord}`);
      if (tokenRecord) {
        // console.log(`📅 OTP expires at: ${tokenRecord.expiresAt}`);
        // console.log(`⏰ Current time: ${new Date()}`);
        // console.log(`✅ OTP used status: ${tokenRecord.used}`);
      }

      if (!tokenRecord) {
        // Check if any OTP exists for this email (for debugging)
        const anyToken = await PasswordResetToken.findOne({
          where: { email: email.trim().toLowerCase() },
        });
        if (anyToken) {
          // console.log( `ℹ️ Found OTP for email but different code: ${anyToken.token}`
          // console.log(`ℹ️ That OTP expires at: ${anyToken.expiresAt}`);
        } else {
          // console.log(`❌ No OTP found for email: ${email}`);
        }
        throw new Error("Invalid OTP");
      }

      // Check if OTP is expired
      if (new Date() > tokenRecord.expiresAt) {
        // console.log(`⏰ OTP expired at: ${tokenRecord.expiresAt}`);
        // Clean up expired OTP
        await PasswordResetToken.destroy({ where: { email, token: otp } });
        throw new Error("OTP has expired. Please request a new one.");
      }

      // Check if OTP has already been used
      if (tokenRecord.used) {
        // console.log(`⚠️ OTP already used`);
        throw new Error("OTP has already been used. Please request a new one.");
      }

      // Mark OTP as used
      await tokenRecord.update({ used: true });
      // console.log(`✅ OTP marked as used`);

      // Generate reset token
      const resetToken = jwt.sign(
        {
          email: email.trim().toLowerCase(),
          purpose: "password_reset",
          timestamp: Date.now(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      // console.log(`✅ Reset token generated for: ${email}`);

      return {
        resetToken,
        message: "OTP verified successfully",
      };
    } catch (error) {
      console.error(`❌ OTP Verification Error: ${error.message}`);
      throw error;
    }
  }

  // Resend OTP - FIXED VERSION
  async resendOTP(email) {
    try {
      // console.log(`🔄 Resending OTP for email:`, email);
      // console.log(`📝 Email type:`, typeof email);
      // console.log(`📝 Email value:`, email);

      // Handle if email is an object (from req.body)
      let actualEmail;
      if (typeof email === "object" && email !== null) {
        // If email is an object with an email property
        if (email.email) {
          actualEmail = email.email;
          // console.log(`🔍 Extracted email from object:`, actualEmail);
        } else {
          throw new Error("Email object must contain an 'email' property");
        }
      } else if (typeof email === "string") {
        actualEmail = email;
      } else {
        throw new Error(
          `Email must be a string or object, received: ${typeof email}`
        );
      }

      // Now validate the actual email string
      if (!actualEmail) {
        throw new Error("Email is required");
      }

      const normalizedEmail = actualEmail.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("Email cannot be empty");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error("Invalid email format");
      }

      // Check if user exists
      const user = await User.findOne({ where: { email: normalizedEmail } });
      if (!user) {
        // For security, don't reveal if user exists or not
        // console.log(`⚠️ User not found for email: ${normalizedEmail}`);
        return {
          success: true,
          message:
            "If an account exists with this email, a new OTP has been sent",
        };
      }

      // console.log(`✅ User found: ${user.email}`);

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // console.log(`🔑 Generated OTP: ${otp}, Expires: ${expiresAt}`);

      // Delete existing OTPs for this email
      const deletedCount = await PasswordResetToken.destroy({
        where: { email: normalizedEmail },
      });
      // console.log(`🗑️ Deleted ${deletedCount} old OTPs`);

      // Create new OTP
      await PasswordResetToken.create({
        email: normalizedEmail,
        token: otp,
        expiresAt: expiresAt,
        used: false,
      });

      // console.log(`💾 New OTP saved to database`);

      // Send email with new OTP
      try {
        await sendEmail({
          to: normalizedEmail,
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
        });
        // console.log(`📧 Email sent successfully to: ${normalizedEmail}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError.message);
        // Don't throw error - OTP is saved, just email failed
      }

      return {
        success: true,
        message: "New OTP sent successfully",
        expiresAt,
      };
    } catch (error) {
      console.error(`❌ Resend OTP Error: ${error.message}`);
      throw error;
    }
  }

  // Forgot password - Send OTP (with improvements)
  async forgotPassword(email) {
    try {
      // console.log(`📧 Forgot password request for: ${email}`);

      const normalizedEmail = email.trim().toLowerCase();

      const user = await User.findOne({ where: { email: normalizedEmail } });
      if (!user) {
        // console.log(`❌ User not found: ${normalizedEmail}`);
        // Don't tell the user the email doesn't exist (security)
        return {
          message: "If an account exists with this email, an OTP will be sent",
        };
      }

      // console.log(`✅ User found: ${user.id} - ${user.email}`);

      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // console.log(`🔑 Generated OTP: ${otp}, Expires: ${expiresAt}`);

      // Delete existing OTPs for this email
      const deletedCount = await PasswordResetToken.destroy({
        where: { email: normalizedEmail },
      });
      // console.log(`🗑️ Deleted ${deletedCount} old OTPs`);

      // Create new OTP
      await PasswordResetToken.create({
        email: normalizedEmail,
        token: otp,
        expiresAt,
        used: false,
      });

      // console.log(`💾 OTP saved to database`);

      // Send email with OTP
      try {
        await sendEmail({
          to: normalizedEmail,
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
        });
        // console.log(`📧 Email sent successfully to: ${normalizedEmail}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError.message);
        // Continue even if email fails
      }

      return {
        message: "OTP sent successfully",
        expiresAt,
      };
    } catch (error) {
      console.error(`❌ Forgot Password Error: ${error.message}`);
      throw error;
    }
  }

  // Reset password - FIXED VERSION
  async resetPassword(resetToken, newPassword) {
    try {
      // console.log(`🔑 Resetting password with token`);

      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        // console.log(`✅ Token decoded successfully for: ${decoded.email}`);
      } catch (error) {
        console.error(`❌ Token verification failed: ${error.message}`);
        throw new Error("Invalid or expired reset token");
      }

      if (decoded.purpose !== "password_reset") {
        console.error(`❌ Invalid token purpose: ${decoded.purpose}`);
        throw new Error("Invalid token purpose");
      }

      const { email } = decoded;
      const normalizedEmail = email.trim().toLowerCase();

      // console.log(`🔍 Looking for user: ${normalizedEmail}`);

      const user = await User.findOne({ where: { email: normalizedEmail } });
      if (!user) {
        console.error(`❌ User not found: ${normalizedEmail}`);
        throw new Error("User not found");
      }

      // console.log(`✅ User found: ${user.id}`);

      // Validate new password
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Update password
      user.password = newPassword;
      await user.save();
      // console.log(`✅ Password updated for user: ${user.id}`);

      // Clean up all OTPs for this email
      await PasswordResetToken.destroy({ where: { email: normalizedEmail } });
      // console.log(`🗑️ Cleared OTPs for email: ${normalizedEmail}`);

      // Send confirmation email
      try {
        await sendEmail({
          to: normalizedEmail,
          subject: "Password Reset Successful",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Successful</h2>
              <p>Your password has been successfully reset.</p>
              <p>If you didn't make this change, please contact support immediately.</p>
            </div>
          `,
        });
        // console.log(`📧 Confirmation email sent to: ${normalizedEmail}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError.message);
        // Don't throw error - password was reset successfully
      }

      return {
        message: "Password reset successfully",
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error(`❌ Reset Password Error: ${error.message}`);
      throw error;
    }
  }

  // Check phone availability
  async checkPhoneAvailability(phone) {
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return {
        available: false,
        error: "Invalid phone format. Must be exactly 10 digits.",
      };
    }

    const existingUser = await User.findOne({
      where: { phone },
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

  // Check email availability
  async checkEmailAvailability(email) {
    if (!email) {
      return {
        available: false,
        error: "Email is required",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        available: false,
        error: "Invalid email format",
      };
    }

    // Check if email is too long
    if (email.length > 255) {
      return {
        available: false,
        error: "Email is too long (max 255 characters)",
      };
    }

    const existingUser = await User.findOne({
      where: { email },
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
