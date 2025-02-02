const express = require("express");
const sellerController = require("../controllers/sellerContoller");
const auth = require("../Middlewares/auth");

const sellerRouter = express.Router();

// Add product route (requires login and seller role)
sellerRouter.post(
  "/addProduct",
  auth.checkAuth,
  auth.checkRole(["seller"]),
  sellerController.addProduct
);

// Seller dashboard route (requires login and seller role)
sellerRouter.get(
  "/dashboard",
  auth.checkAuth,
  auth.checkRole(["seller"]),
  sellerController.Dashboard
);
// Update product route (requires login and seller role)
sellerRouter.post(
  "/updateProduct",
  auth.checkAuth,
  auth.checkRole(["seller"]),
  sellerController.updateProduct
);
// Delete product route (requires login and seller role)
sellerRouter.delete(
  "/deleteProduct",
  auth.checkAuth,
  auth.checkRole(["seller"]),
  sellerController.deleteProduct
);
// search option route (requires login)
sellerRouter.get("/search", auth.checkAuth, sellerController.search);
module.exports = sellerRouter;
// update git