const app=require("./app");
//import mongoose and store it in a variable called mongoose
const mongoose = require("mongoose");
const { MONGODB_URI, PORT } = require("./utils/config");
//import dotenv and store it in a variable called dotenv
 require("dotenv").config();
//create an instance of express and store it in a variable called app


// 


mongoose.connect(MONGODB_URI)
.then(() => {
  console.log("Connected to MongoDB");
  // starting server
  app.listen(PORT, () => {
    console.log("Server is running on port 3000");
  });
})
.catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});

