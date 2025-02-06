
const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/authController");
const auth = require("../Middlewares/auth");

authRouter.post("/register", authController.register); // Register a new user
authRouter.post("/login", authController.login); // Log in
authRouter.post("/logout", authController.logout); // Log out
authRouter.get("/me", auth.verifyLogin, authController.me); //..........// Get user info
authRouter.post("/reset", authController.resetPassword); // Reset password
authRouter.post("/update", authController.updatePassword); // Update password

// Products
authRouter.get("/products", authController.getProducts); // Get all products
authRouter.get("/product/:id", authController.ProductById); // Get product by ID
authRouter.get("/getproduct"), authController.getProducts; // Get product by ID

// Cart
authRouter.post("/addcart", auth.verifyLogin, authController.addToCart); // Add to cart
authRouter.get("/getcart", auth.verifyLogin, authController.getCart); // Get cart details
authRouter.delete("/removecart", auth.verifyLogin, authController.removeFromCart); // Remove item from cart
authRouter.delete("/clearcart", auth.verifyLogin, authController.clearCart); // Clear all items from cart

// Orders
authRouter.get("/getorder/:id", auth.verifyLogin, authController.getOrders); // Get order by ID
authRouter.post("/createorder", auth.verifyLogin, authController.createOrder); // Create a new order
authRouter.delete("/order/:id", authController.deleteOrder); // Delete an order

// Razorpay
authRouter.post("/createrazorpayorder", authController.razorpayOrder); // Create Razorpay order
authRouter.post(
  "/verify-payment",
  auth.verifyLogin,
  authController.verifyPayment
); // Verify Razorpay payment

// Product Reviews
authRouter.post("/product/review", auth.verifyLogin, authController.addReview); // Add review for a product
authRouter.get("/product/reviews/:id", authController.getReview); // Get reviews for a product

module.exports = authRouter; // Export the authRouter
