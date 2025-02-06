// Import express and store it in a variable called express
const express = require("express");
const authRouter = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const sellerRouter = require("./routes/sellerRoutes");
const cors = require("cors");

// Create an Express app
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: "https://starlit-cupcake-cc6d26.netlify.app", // Adjust based on your frontend URL for future deploy
    credentials: true,
  })
);

// Routes
app.use("/auth", authRouter);
app.use("/auth/seller", sellerRouter);
app.use(
  cors({
    origin: "https://starlit-cupcake-cc6d26.netlify.app",
    credentials: true,
  })
);

// Export the Express app
module.exports = app;
