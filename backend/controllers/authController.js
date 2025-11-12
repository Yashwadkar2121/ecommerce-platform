const jwt = require("jsonwebtoken");
const { User } = require("../models/mysql/User");
const { Session } = require("../models/mongodb/Session");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
    res.status(500).json({ error: "Registration failed" });
  }
};

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
        role: user.role,
      },
      tokens,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    const session = await Session.findOne({
      userId: decoded.userId,
      token: refreshToken,
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(decoded.userId, decoded.role);

    // Update session with new refresh token
    session.token = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    res.json({ tokens });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const { refreshToken } = req.body;

    await Session.deleteMany({
      $or: [
        { userId: req.user.userId, token: refreshToken },
        { userId: req.user.userId, token: token },
      ],
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
};
