// routes/authRoutes.js
const express = require("express");
const auth = require("../Middlewares/auth");
const authRouter = express.Router();
const authController = require("../controllers/authController"); // Make sure it's authController

authRouter.post("/register", authController.register); // rigester here
authRouter.post("/login", authController.login); // login here
authRouter.post("/logout", authController.logout); // logout here
authRouter.get("/me", auth.checkAuth, authController.me); // get user here
authRouter.post("/reset", authController.resetPassword); // reset password here
authRouter.post("/update", authController.updatePassword); // update password here
authRouter.get("/getproduct", authController.getProducts); //get products here
authRouter.get("/product/:id", authController.ProductById); //  product by id here
authRouter.post("/addcart", auth.checkAuth, authController.addToCart); // add to cart here
authRouter.get("/getcart", auth.checkAuth, authController.getCart); // get cart deatils here
authRouter.delete("/removecart", auth.checkAuth, authController.removeFromCart); // product remove from cart here
authRouter.post("/order", auth.checkAuth, authController.order); // order here
authRouter.get("/getorder/:id", auth.checkAuth, authController.getOrders); //order by id here
authRouter.delete("/clearcart", auth.checkAuth, authController.clearCart); // clear cart here
authRouter.get("/getallorders", auth.checkAuth, authController.getAllOrders); // get all orders here
authRouter.post("/createrazorpayorder", authController.razorpayOrder); // create razorpay order here
authRouter.post("/createorder", auth.checkAuth, authController.createorder); // verify payment here
authRouter.post("/verify-payment", auth.checkAuth, authController.verifyPayment);
authRouter.post("/review"), auth.checkAuth, authController.addReview; // review here

module.exports = authRouter; // Export authRouter
