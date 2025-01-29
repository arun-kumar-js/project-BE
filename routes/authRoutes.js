// routes/authRoutes.js
const express = require("express");
const auth = require("../Middlewares/auth");
const authRouter = express.Router();
const authController = require("../controllers/authController"); // Make sure it's authController

authRouter.post("/register", authController.register); // Change to authController
authRouter.post("/login", authController.login); // Change to authController
authRouter.post("/logout", authController.logout); // Change to authController
authRouter.get("/me", auth.checkAuth, authController.me); // Change to authController
authRouter.post("/reset", authController.resetPassword); // Change to authController
authRouter.post("/update", authController.updatePassword); // Change to authController
authRouter.get("/getproduct", authController.getProducts); // Change to authController
authRouter.get("/product/:id", authController.ProductById); // Change to authController
authRouter.post("/addcart", auth.checkAuth, authController.addToCart); // Change to authController
authRouter.get("/getcart", auth.checkAuth, authController.getCart); // Change to authController
authRouter.delete("/removecart", auth.checkAuth, authController.removeFromCart); // Change to authController

module.exports = authRouter; // Export authRouter
