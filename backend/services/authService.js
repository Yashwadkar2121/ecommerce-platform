const { User } = require("../models/mysql/User");
const { Session } = require("../models/mongodb/Session");
const { generateTokens } = require("../utils/jwt");

class AuthService {
  async registerUser(userData) {
    const { email, password, firstName, lastName } = userData;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    const tokens = generateTokens(user.id, user.role);

    await Session.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  async loginUser(email, password, userAgent, ipAddress) {
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
        role: user.role,
      },
      tokens,
    };
  }

  async logoutUser(userId, tokens) {
    await Session.deleteMany({
      userId: userId,
      token: { $in: tokens },
    });
  }

  async refreshUserSession(refreshToken, userAgent, ipAddress) {
    const session = await Session.findOne({ token: refreshToken });
    if (!session) {
      throw new Error("Invalid refresh token");
    }

    const { verifyRefreshToken, generateTokens } = require("../utils/jwt");
    const decoded = verifyRefreshToken(refreshToken);

    const tokens = generateTokens(decoded.userId, decoded.role);

    // Update session with new refresh token
    session.token = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    session.userAgent = userAgent;
    session.ipAddress = ipAddress;
    await session.save();

    return { tokens };
  }
}

module.exports = new AuthService();
