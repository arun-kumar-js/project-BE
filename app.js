// Import express and store it in a variable called express
const express = require("express");
const authRouter = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const sellerRouter = require("./routes/sellerRoutes");

// Create an Express app
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/seller", sellerRouter);

// Export the Express app
module.exports = app;
