//import express and store it in a variable called express
const express = require("express");
//create an instance of express and store it in a variable called app
const app = express(); 
//response to the request from postman get request
app.get("/", (req, res) => {
    res.json({message:'hello world -GET'})
});




// starting server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
