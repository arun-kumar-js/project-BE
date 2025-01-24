const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../utils/config");
const User = require("../models/User"); // Import your User model
const express = require("express");

const app = express(); // Not strictly needed here if it's only middleware

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Attach user data to the request object
    req.userId = decoded.id;

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid", error: err.message });
  }
};

// Middleware to check role-based access
const checkRole = (roles) => async (req, res, next) => {

  try {
    // Ensure `req.userId` is already populated by `checkAuth`
    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch the user's role from the database
    const user = await User.findById(req.userId); // Assumes `req.userId` corresponds to `_id` in the database
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.role = user.role; // Attach the role to the request object
    

    // Check if the user's role is allowed
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
