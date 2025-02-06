const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../utils/config");
const User = require("../models/User");

const auth = {
  // Middleware to check if the user is authenticated
  verifyLogin: async (req, res, next) => {
    try {
      // Get the token from HTTP-only cookies
      const token = req.cookies.token;

      // If the token does not exist, return an error message
      if (!token) {
        return res
          .status(401)
          .json({ message: "Access denied. No token provided." });
      }

      // Verify the token
      const verified = jwt.verify(token, SECRET_KEY);
      req.userId = verified.id; // Attach user ID to request object

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  },

  // Middleware to authorize the user based on the role
  allowRoles: (roles) => {
    return async (req, res, next) => {
      try {
        // Get the user from the database
        const user = await User.findById(req.userId);

        // If user does not exist
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Check if the user's role is in the allowed roles array
        if (!roles.includes(user.role)) {
          return res
            .status(403)
            .json({ message: "Forbidden: You do not have access" });
        }

        next();
      } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
      }
    };
  },
};

module.exports = auth;
