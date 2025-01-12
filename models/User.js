const express = require('express');
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({

    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }, createAt:{
        type: Date,
        default: Date.now
}





});






module.exports=mongoose.model('user',userSchema,'users');


