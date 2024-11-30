const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { testEmailConnection } = require("./utils/emailService");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
const testConnection = async () => {
  try {
    await db.execute("SELECT 1");
    console.log("Connected to PostgreSQL database");
  } catch (error) {
    console.error("Could not connect to PostgreSQL database:", error);
    process.exit(1);
  }
};

testConnection();

// Add this after your other startup code
testEmailConnection().then((isConnected) => {
  if (isConnected) {
    console.log("✉️ Email service connected successfully");
  } else {
    console.error("❌ Failed to connect to email service");
  }
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/income", require("./routes/income"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/goals", require("./routes/goals"));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
