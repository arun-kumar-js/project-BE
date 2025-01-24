const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // Single image URL
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the seller (user ID)
  
});

module.exports = mongoose.model("Product", productSchema);
