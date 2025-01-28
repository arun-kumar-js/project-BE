const express = require("express");
const authcontroller = require("../controllers/authController");
const auth = require("../Middlewares/auth");
const authRouter = express.Router();

authRouter.post('/register', authcontroller.register);//register route
authRouter.post('/login', authcontroller.login);//login route
authRouter.post('/logout', authcontroller.logout);// logout route
authRouter.get("/me", auth.checkAuth, authcontroller.me);// profie view
authRouter.post("/reset", authcontroller.resetPassword);// reset password
authRouter.post("/update",  authcontroller.updatePassword);// update password
authRouter.get("/getproduct", authcontroller.getProducts);// all products.... public route
authRouter.get("/product/:id", authcontroller.ProductById);// get product by id
authRouter.post("/addcart", auth.checkAuth, authcontroller.addToCart);// add to cart
authRouter.get("/getcart", auth.checkAuth, authcontroller.getCart);// get cart












module.exports = authRouter; //exporting the authRouter
