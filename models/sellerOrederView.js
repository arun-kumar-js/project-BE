const mongoose = require("mongoose");
const placedOrderSchema = new mongoose.Schema({
  buyerId: String,
  sellerId: String,
  products: [{ productId: String, quantity: Number }],
  status: String, // e.g., 'Pending', 'Shipped'
  totalAmount: Number,
});

const PlacedOrder = mongoose.model("PlacedOrder", placedOrderSchema);
module.exports = PlacedOrder;