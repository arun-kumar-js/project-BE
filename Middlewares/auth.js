const jwt = require('jsonwebtoken');
const { SECRET_KEY}=require('../utils/config');
const auth = {
    // middleware check user login tocken
    checkAuth: async (request, response, next) => {
        const token = request.cookies.token; // take token form cookies
        console.log(token);
      // cookie token not found
      if (!token) {
        return response.status(401).json({ message: "user not login " });
      }
      // verify token
      try {
          const decoded = jwt.verify(token, SECRET_KEY);
    
        
         
          request.userId = decoded.id
           console.log(request.userId);
        next(); // passing controll to next middleware
      } catch (error) {
        response.status(500).json({ message: error.message });
      }
    },
    
}
module.exports = auth;
