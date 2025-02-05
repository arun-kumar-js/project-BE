const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  address: { type: String, required: true }, // Ensure lowercase "address"
  phoneNumber: { type: String, required: true },
  products: [
    {
      
productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  paymentId: { type: String },
  status: { type: String, default: "Paid" },
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
