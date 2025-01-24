require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;
const SECRET_KEY = process.env.SECRET_KEY; 
const GMAIL = process.env.GMAIL_USER;
const PASSWORD = process.env.GMAIL_PASSWORD;
module.exports = {
  MONGODB_URI,
  PORT,
  SECRET_KEY,
  PASSWORD,
  GMAIL,
};


