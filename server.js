const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const cors = require("cors");
require("dotenv").config();
const { MONGODB_URI, PORT = 3000 } = require("./utils/config");
const app = require("./app");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// app.use(
//   cors({
//     origin: [
//       "https://starlit-cupcake-cc6d26.netlify.app",
//       "http://localhost:5174",
//     ], // Specify the allowed origin
//     credentials: true, // Allow credentials (cookies, etc.)
//   })
);
app.use(
  cors({
    origin: "*", // Allow all origins for dev testing
    credentials: true,
  })
);
app.use(express.json());
app.use(cors());

// Create Razorpay order
app.post("/create-razorpay-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 1, // Convert to paise
      currency: "INR",
      receipt: `order_rcpt_${Math.floor(Math.random() * 1000000)}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Razorpay order creation failed" });
  }
});

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to the MongoDB database");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1);
  }

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Promise Rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
  });
})();
