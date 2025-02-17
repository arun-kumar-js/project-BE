const bcrypt = require("bcrypt"); // Password encryption and decryption
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Products"); // Assuming you have a Product model
const nodemailer = require("nodemailer");
const cart = require("../models/cart");
const Auth = require("../Middlewares/auth");
const Razorpay = require("razorpay");
const CreateOrder = require("../models/createorder"); // Adjust path if needed
const crypto = require("crypto");
const Review = require("../models/review");
const auth = require("../Middlewares/auth");
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

const authcontroller = {
  // Register a new user
  register: async (request, response) => {
    try {
      const { name, email, password, role } = request.body;
      console.log(request.body);

      const user = await User.findOne({ email }); // Check if user exists
      if (user) {
        return response.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password
      const newUser = new User({ name, email, password: hashedPassword,role });
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

      response
        .status(200)
        .json({ message: "User logged in successfully", token: token });
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
    //console.log(request.headers.authorization);
    try {
      const decodedToken = jwt.verify(
        request.headers.authorization.split(" ")[1],
        process.env.SECRET_KEY
      );
      const userId = decodedToken.id;
    //  console.log(userId);

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
      // Get token from cookies or Authorization header
      let token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = { id: decoded.id };

      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      // Check if the product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Find user's cart and update it
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
      let token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = { id: decoded.id };

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
      let token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = { id: decoded.id };

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
      let token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = { id: decoded.id };
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
  // Get all orders
  getOrders: async (req, res) => {
    try {
      const token =
        req.headers.authorization && req.headers.authorization.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = { id: decoded.id };

      const orders = await createorders
        .find({ userId: req.user.id })
        .populate("products");

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
           // console.log("Email sent to seller:", info.response);
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
    try {
      // Check if Authorization header contains token
      const token =
        req.headers.authorization && req.headers.authorization.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      req.user = { id: decodedToken.id };
      res.json({ message: "Payment verified successfully" });
      //console.log("User verified:", req.user);

      // Continue payment verification logic...
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
addReview: async (req, res) => {
  const { productId, review, rating } = req.body;

  try {
    // Decode token to get the user ID
    const decodedToken = jwt.verify(
      req.headers.authorization.split(" ")[1],  // Use 'req' here
      process.env.SECRET_KEY
    );
    const userId = decodedToken.id;

    //console.log(userId);
    //console.log(req.body);

    // Create and save the new review
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
    res.status(500).json({ message: "Failed to submit review. Please try again." });
  }
},
  getReview: async (req, res) => {
    try {
      const productId = req.params.id;
      //console.log("Fetching reviews for product:", productId);

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

module.exports = authcontroller;
