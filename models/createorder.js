const mongoose = require("mongoose")

const createorderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  razorpayOrderId: { type: String, required: false },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created",
  },
  createdAt: { type: Date, default: Date.now },
});

const CreateOrder = mongoose.model("CreateOrder", createorderSchema);

module.exports = CreateOrder;


