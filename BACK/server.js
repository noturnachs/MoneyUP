const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
const testConnection = async () => {
  try {
    await db.execute("SELECT 1");
    console.log("Connected to MySQL database");
  } catch (error) {
    console.error("Could not connect to MySQL database:", error);
    process.exit(1);
  }
};

testConnection();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/income", require("./routes/income"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/analytics", require("./routes/analytics"));
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
