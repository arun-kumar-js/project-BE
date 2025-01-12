 const bcrypt = require("bcrypt");//password encryption and decryption
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const authcontroller = {
    register: async (request, response) => {
        try {
            const { name, email, password } = request.body;
            const user = await User.findOne({ email });// find user by email already exists or not
            if (user) {
                return response.status(400).json({ message: "User already exists" });// if user exists then return message
            }
            const hashedPassword = await bcrypt.hash(password, 10);// password encryption

            newUser = new User({ name, email, password: hashedPassword });// if user not exists then create new user
            await newUser.save();
            response.status(201).json({ message: "User created successfully" });
        
        } catch (error) {
            response.status(500).json({ message: error.message });
        }
    },
        login: async (request, response) => {
            try {
                const { email, password } = request.body;
                const user = await User.findOne({ email });
                if (!user) {
                    return response.status(400).json({ message: "User does not exist" });
                }
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return response.status(400).json({ message: "Invalid password" });
                }
                //create token
                const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" });
                // send token to http cokies
                response.cookie("token", token, { httpOnly: true });
                
                response.status(200).json({ message: "User logged in successfully" });
            } catch (error) {
                response.status(500).json({ message: error.message });
            }
    },
        logout: async (request, response) => {
            try {
                response.clearCookie("token");
                response.status(200).json({ message: "User logged out successfully" });
            } catch (error) {
                response.status(500).json({ message: error.message });
            }
    },
        me: async (request, response) => {
            try {
                const userId = request.userId; //user id getting and saved
                // geting user id data from server
                const user = await User.findById(userId);
                //respone user data
                response.status(200).json({user});

            } catch (error) {
                response.status(500).json({ message: error.message });
            }
        }
};
module.exports = authcontroller;                