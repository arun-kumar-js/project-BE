const express = require("express");
const sellerController = require("../controllers/sellerContoller");
const auth = require("../Middlewares/auth");

const sellerRouter = express.Router();

// Add product route (requires login and seller role)
sellerRouter.post(
  "/addProduct",
  auth.verifyLogin,
  auth.allowRoles(["seller"]),
  sellerController.addProduct
);

// Seller dashboard route (requires login and seller role)
sellerRouter.get(
  "/dashboard",
  auth.verifyLogin,
  auth.allowRoles(["seller"]),
  sellerController.Dashboard
);
// Update product route (requires login and seller role)
sellerRouter.post(
  "/updateProduct",
  auth.verifyLogin,
  auth.allowRoles(["seller"]),
  sellerController.updateProduct
);
// Delete product route (requires login and seller role)
sellerRouter.delete(
  "/deleteProduct",
  auth.verifyLogin,
  auth.allowRoles(["seller"]),
  sellerController.deleteProduct
);
// search option route (requires login)
sellerRouter.get("/search", auth.verifyLogin, sellerController.search);
sellerRouter.get(
  "/seller/deliverylist",
  auth.verifyLogin,
  auth.allowRoles(["seller"]),
  sellerController.placedOrders
);

module.exports = sellerRouter;
// update git