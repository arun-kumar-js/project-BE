const app = require("./app");
const mongoose = require("mongoose");
const { MONGODB_URI, PORT } = require("./utils/config");

(async () => {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true, // Ensures the latest connection string parser is used
      useUnifiedTopology: true, // Enables the new server discovery and monitoring engine
    });
    console.log("Connected to the MongoDB database");

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);

    // Graceful exit on database connection failure
    process.exit(1);
  }

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Promise Rejection:", reason);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1); // Exit the process on critical error
  });
})();
