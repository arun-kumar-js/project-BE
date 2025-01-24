const express = require("express");
const authcontroller = require("../controllers/authController");
const auth = require("../Middlewares/auth");
const authRouter = express.Router();

authRouter.post('/register', authcontroller.register);//register route
authRouter.post('/login', authcontroller.login);//login route
authRouter.post('/logout', authcontroller.logout);// logout route
authRouter.get("/me", auth.checkAuth, authcontroller.me);// profie view
authRouter.post("/reset", authcontroller.resetPassword);// reset password
authRouter.put("/update", auth.checkAuth, authcontroller.updatePassword);// update password

module.exports = authRouter; //exporting the authRouter