const Product = require("../models/Products");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Uploads folder
const PlacedOrder = require("../models/sellerOrederView");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const sellerController = {
  // Add a product
  addProduct: async (req, res) => {
    try {
      
      const { name, description, price, image } = req.body;
      const userId = req.userId; // Get user ID from middleware

      // Validate required fields
      if (!name || !description || !price || !image) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Ensure the image is a valid Base64 string
      if (!image.startsWith("data:image")) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      // Create new product
      const newProduct = new Product({
        name,
        description,
        price,
        image, // Store the Base64 string directly
        seller: userId, // Attach seller's ID
      });

      // Save product to database
      await newProduct.save();

      res.status(201).json({
        message: "Product added successfully",
        product: newProduct,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to add product",
        error: error.message,
      });
    }
  },
  // Get seller dashboard (list products by seller ID)
  Dashboard: async (req, res) => {
    try {
      const userId = req.userId; // Get the user ID from the middleware (auth)
      const products = await Product.find({ seller: userId });

      res.status(200).json({ products });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch products",
        error: error.message,
      });
    }
  },

  // Update product by ID
  updateProduct: async (req, res) => {
    try {
      const { productId, name, description, price, image ,user} = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Ensure that only the seller who owns the product can update it
      if (product.seller.toString() !== req.userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this product" });
      }

      // Update product fields
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.image = image || product.image;

      await product.save();

      res
        .status(200)
        .json({ message: "Product updated successfully", product });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update product", error: error.message });
    }
  },
  

  // Delete product by ID
  deleteProduct: async (req, res) => {
    try {
      const userId = req.userId; // Get the user ID from the middleware (auth)
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const product = await Product.findOneAndDelete({
        _id: productId,
        seller: userId,
      });

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product not found or not authorized" });
      }

      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete product",
        error: error.message,
      });
    }
  },
  // Get orders placed by customers
updateProduct: async (req, res) => {
  try {
    const { name, description, price, image, productId } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Validate input data
    if (!name || !description || !price || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (isNaN(price)) {
      return res.status(400).json({ message: "Price must be a number" });
    }

    // Check Authorization header
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }
    const token = req.headers.authorization.split(" ")[1];

    userId = jwt.verify(token, process.env.SECRET_KEY).id;

    // Find the product by _id and seller (userId)
    const product = await Product.findOne({ _id: productId, seller: userId });
    if (!product) {
      return res.status(404).json({ message: "Product not found or not authorized" });
    }

    // Update product details
    product.name = name;
    product.description = description;
    product.price = price;
    product.image = image;

    // Save the updated product
    await product.save();

  

    // Return success message
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
},

  placedOrders: async (req, res) => {
    try {
      const sellerId = req.params.sellerId;

      // Find products belonging to the seller
      const sellerProducts = await Product.find({ sellerId });

      // Extract product IDs
      const productIds = sellerProducts.map((product) => product._id);

      // Find orders that contain any of the seller's products
      const orders = await orders.find({
        "products.productId": { $in: productIds },
      });

      res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },
};
module.exports = sellerController;
