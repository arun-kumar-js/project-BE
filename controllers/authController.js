const bcrypt = require("bcrypt"); // Password encryption and decryption
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/seller"); // Assuming you have a Product model
const nodemailer = require("nodemailer");
const cart = require("../models/cart");
const Auth = require("../Middlewares/auth").default;
const Razorpay = require("razorpay");
const CreateOrder = require("../models/createorder"); // Adjust path if needed
const crypto = require("crypto");
const Review = require("../models/review");
const auth = require("../Middlewares/auth").default;
const createorders = require("../models/createorder");
const orders = require("../models/createorder");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const {
  SECRET_KEY,
  GMAIL_PASSWORD,
  GMAIL_USER,
  MONGODB_URI,
  PORT,
} = require("../utils/config");
const mongoose = require("mongoose");

const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      // Example register logic
      const { username, email, password } = req.body;

      // Check if user already exists (example)
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user logic (example)
      const newUser = new User({ username, email, password });
      await newUser.save();

      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Login user
  login: async (request, response) => {
    try {
      const { email, password } = request.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return response.status(400).json({ message: "User does not exist" });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return response.status(400).json({ message: "Invalid password" });
      }

      // Create a token
      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });

      // Set token in HTTP cookies
      response.cookie("token", token, {
        httpOnly: true,
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production", // Set secure in production
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      // Send token and user ID in response
      response.status(200).json({
        message: "User logged in successfully",
        token, // Send token in response (optional)
        userID: user._id, // Send user ID separately
      });
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
  me: async (req, res) => {
    try {
      const userId = req.userId; // Ensure `userId` is set in middleware
      const user = await User.findById(userId).select("-password -__v");
      if (!user) return res.status(404).json({ message: "User not found" });

      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: error.message });
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
  clearCart: async (req, res) => {
    try {
      const decodedToken = jwt.verify(
        req.cookies.token,
        process.env.SECRET_KEY
      );
      req.user = { id: decodedToken.id };

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userCart = await cart.findOneAndDelete({ userId: req.user.id });

      return res.status(200).json({ message: "Cart cleared", cart: userCart });
    } catch (error) {
      console.error("Error clearing cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getOrders: async (req, res) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const orders = await createorders.find({ userId }).populate("products");

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }

      return res.status(200).json({ orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
  razorpayOrder: async (req, res) => {
    try {
      const { amount } = req.body;

      // Validate the amount
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const options = {
        amount: amount * 100, // Convert to paise
        currency: "INR",
        receipt: `order_rcpt_${Date.now()}_${Math.floor(
          Math.random() * 1000000
        )}`, // Unique receipt with timestamp
      };

      const order = await razorpay.orders.create(options);
      res.json({ orderId: order.id });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({
        error: error.message || "Razorpay order creation failed",
        details: error.stack, // Add stack trace for better debugging
      });
    }
  },
  createOrder: async (req, res) => {
    const {
      userId,
      name,
      address,
      phoneNumber,
      products,
      totalPrice,
      paymentId,
    } = req.body;

    if (!userId || !totalPrice) {
      return res.status(400).json({
        error: "User ID, total price, and payment ID are required",
      });
    }

    try {
      const newOrder = new CreateOrder({
        userId,
        name,
        address,
        phoneNumber,
        products,
        totalPrice,
        paymentId,
      });

      await newOrder.save();

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: newOrder,
      });
      if (res.status(201)) {
        // Add any additional logic here if needed
        const sellerEmail = "mobiledoctorsdm@gmail.com";

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: sellerEmail,
          subject: "New Order Received",
          text: `You have received a new order from ${name}. Order details: ${JSON.stringify(
            newOrder
          )}`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("Error sending email to seller:", err);
          } else {
            console.log("Email sent to seller:", info.response);
          }
        });
      }
    } catch (error) {
      console.error("Error creating order:", error);
      res
        .status(400)
        .json({ success: false, message: "Failed to store order" });
    }
  },
  deleteOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      // // console.log("Received request to delete order with ID:", orderId);

      // Use the Order model to find and delete the order
      const deletedOrder = await orders.findByIdAndDelete(orderId);

      if (!deletedOrder) {
        // console.log("Order not found in database.");
        return res.status(404).json({ message: "Order not found" });
      }

      // console.log("Order deleted successfully:", deletedOrder);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Error deleting order" });
    }
  },
  verifyPayment: async (req, res) => {
    // console.log("Cookies received:", req.cookies);
    try {
      const decodedToken = jwt.verify(
        req.cookies.token,
        process.env.SECRET_KEY
      );
      req.user = { id: decodedToken.id };
      // console.log(req.user);

      // 2. Razorpay signature verification
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;
      // console.log(razorpay_payment_id, razorpay_order_id, razorpay_signature);
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature === razorpay_signature) {
        // Payment is successful
        res.status(200).json({ message: "Payment verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid payment signature" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  addReview: async (req, res) => {
    const { productId, review, rating } = req.body;
    // Assuming you have middleware that attaches the user to the request
    const decodedToken = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
    const userId = decodedToken.id;
    console.log(req.body);
    try {
      const newReview = new Review({
        productId,
        userId,
        review,
        rating,
      });

      await newReview.save();
      res.status(201).json({ message: "Review submitted successfully!" });
    } catch (error) {
      console.error("Error saving review:", error);
      res
        .status(500)
        .json({ message: "Failed to submit review. Please try again." });
    }
  },
  getReview: async (req, res) => {
    try {
      const productId = req.params.id;
      console.log("Fetching reviews for product:", productId);

      const reviews = await Review.find({ productId }).populate(
        "userId",
        "name"
      ); // Populate user name only

      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  },
};


module.exports = authController; 
// Export the authController
