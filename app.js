//import express and store it in a variable called express
const express = require("express");
const authRouter = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
app.use(express.json());
//response to the request from postman get request
app.use('/auth', authRouter);
//cookie parser

module.exports = app;