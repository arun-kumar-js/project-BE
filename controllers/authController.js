const bcrypt = require("bcrypt"); // Password encryption and decryption
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/seller"); // Assuming you have a Product model
const nodemailer = require("nodemailer");
const cart = require("../models/cart");
const auth = require("../Middlewares/auth");
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
  // geting all the products
  getProducts: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const products = await Product.find()
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalProducts = await Product.countDocuments();

      res.status(200).json({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  /// Reset password
    resetPassword: async (request, response) => {
      try {
        const { email } = request.body;
  
        const user = await User.findOne({ email });
  
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
          const { code, password } = request.body;
    
          // Query the user
          const user = await User.findOne({
            resetPassword: code, // Ensure token matches
            resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
          });
    
          if (!user) {
            return response
              .status(404)
              .json({ message: "Invalid or expired reset code" });
          }
    
          // Update the user's password
          const hashPassword = await bcrypt.hash(password, 10);
          user.password = hashPassword;
          user.resetPassword = null;
          user.resetPasswordExpires = null;
          await user.save();
    
          response
            .status(200)
            .json({ message: "Password has been successfully reset" });
        } catch (error) {
          console.error("Error during password reset:", error.message);
          response.status(500).json({ message: "Internal server error" });
        }
      },
    
    
    //get product by id 
  ProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Error fetching product details" });
    }
  },

  addToCart: async (req, res) => {
    try {
      const decodedToken = jwt.verify(
        req.cookies.token,
        process.env.SECRET_KEY
      );
      req.user = { id: decodedToken.id };

      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      // Check ii have f the product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userCart = await cart.findOneAndUpdate(
        { userId: req.user.id },
        { $addToSet: { products: productId } },
        { new: true, upsert: true }
      );

      return res
        .status(200)
        .json({ message: "Product added to cart", cart: userCart });
    } catch (error) {
      console.error("Error adding to cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getCart: async (req, res) => {
    try {
      const decodedToken = jwt.verify(
        req.cookies.token,
        process.env.SECRET_KEY
      );
      req.user = { id: decodedToken.id };

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userCart = await cart
        .findOne({ userId: req.user.id })
        .populate("products");

      return res.status(200).json({ cart: userCart });
    } catch (error) {
      console.error("Error fetching cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
  removeFromCart: async (req, res) => {
    try {
      const decodedToken = jwt.verify(
        req.cookies.token,
        process.env.SECRET_KEY
      );
      req.user = { id: decodedToken.id };

      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userCart = await cart.findOneAndUpdate(
        { userId: req.user.id },
        { $pull: { products: productId } },
        { new: true }
      );

      return res
        .status(200)
        .json({ message: "Product removed from cart", cart: userCart });
    } catch (error) {
      console.error("Error removing from cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = authcontroller;
