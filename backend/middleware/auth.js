const jwt = require("jsonwebtoken");
const { Session } = require("../models/mongodb/Session");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists in MongoDB
    const session = await Session.findOne({
      userId: decoded.userId,
      token: token,
    });

    if (!session) {
      return res
        .status(401)
        .json({ error: "Invalid token or session expired." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
