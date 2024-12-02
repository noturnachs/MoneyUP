const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { testEmailConnection } = require("./utils/emailService");

// Import routes
const authRoutes = require("./routes/auth");
const incomeRoutes = require("./routes/income");
const expenseRoutes = require("./routes/expenses");
const categoryRoutes = require("./routes/categories");
const analyticsRoutes = require("./routes/analytics");
const goalRoutes = require("./routes/goals");
const subscriptionRoutes = require("./routes/subscriptions");
const paymentRoutes = require("./routes/payments");

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

// Email service test
testEmailConnection().then((isConnected) => {
  if (isConnected) {
    console.log("✉️ Email service connected successfully");
  } else {
    console.error("❌ Failed to connect to email service");
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);

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
