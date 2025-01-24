const bcrypt = require("bcrypt"); // Password encryption and decryption
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/seller"); // Assuming you have a Product model
const nodemailer = require("nodemailer");
const {
  SECRET_KEY,
  GMAIL_PASSWORD,
  GMAIL_USER,
  MONGODB_URI,
  PORT,
} = require("../utils/config");

const authcontroller = {
  // Register a new user
  register: async (request, response) => {
    try {
      const { name, email, password } = request.body;

      const user = await User.findOne({ email }); // Check if user exists
      if (user) {
        return response.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      response.status(201).json({ message: "User created successfully" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },

  // Login user
  login: async (request, response) => {
    try {
      const { email, password } = request.body;

      const user = await User.findOne({ email });
      if (!user) {
        return response.status(400).json({ message: "User does not exist" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return response.status(400).json({ message: "Invalid password" });
      }

      // Create a token
      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });

      // Send token to HTTP cookies
      response.cookie("token", token, { httpOnly: true });
      response.status(200).json({ message: "User logged in successfully" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },

  // Logout user
  logout: async (request, response) => {
    try {
      response.clearCookie("token");
      response.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },

  // Get user profile
  me: async (request, response) => {
    try {
      const userId = request.userId;

      const user = await User.findById(userId).select("-password -__v");
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      response.status(200).json({ user });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },


  // Reset password
  resetPassword: async (request, response) => {
    console.log(request.body);
    try {
      const { email }  = request.body;
      console.log (email);
      
      const user = await User.findOne({ email });
      console.log("Found user:", user);
      
      if (!user) {
        return response
          .status(404)
          .json({ message: "No account found with this email" });
      }

      const crypto = require("crypto");
      const token = crypto.randomBytes(20).toString("hex");

      user.resetPassword = token;
      user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
      await user.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const message = {
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: "Password Reset",
        text: `Reset your password using the following token: ${token}`,
      };

      transporter.sendMail(message, (err) => {
        if (err) {
          return response
            .status(500)
            .json({ message: "Failed to send reset email", error: err });
        }
        response.status(200).json({ message: "Password reset email sent" });
      });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },

  // Update password
  updatePassword: async (request, response) => {
    try {
      const { token, password } = request.body;

      const user = await User.findOne({
        resetPassword: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return response
          .status(404)
          .json({ message: "Invalid or expired token" });
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetPassword = null;
      user.resetPasswordExpires = null;
      await user.save();

      response.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
};

module.exports = authcontroller;
