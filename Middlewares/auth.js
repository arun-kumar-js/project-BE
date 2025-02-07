const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../utils/config");
const User = require("../models/User"); // Import your User model

const express = require("express");

const app = express(); // Not strictly needed here if it's only middleware

// Middleware to check authentication


const checkAuth = (req, res, next) => {
  try {
    // Check if Authorization header exists
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")
    ) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Extract token from "Bearer <token>"
    const token = req.headers.authorization.split(" ")[1];

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Attach user data to request object
    req.userId = decoded.id; // Ensure JWT payload contains 'id'

    next(); // Continue to the next middleware
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired, please log in again" });
    }
    res.status(401).json({ message: "Token is not valid", error: err.message });
  }
};



// Middleware to check role-based access
const checkRole = (roles) => async (req, res, next) => {
  if (!Array.isArray(roles)) {
    return res
      .status(500)
      .json({ message: "Roles parameter must be an array." });
  }
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  req.userId = decoded.id; // Ensure JWT payload contains 'id'

  try {
    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.role = user.role;

    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: "User not allowed" });
    }

    next();
  } catch (err) {
    res.status(403).json({ message: "Access denied", error: err.message });
  }
};

module.exports = {
  checkAuth,
  checkRole,
};
