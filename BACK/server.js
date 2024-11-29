const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/database");

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
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/analytics", require("./routes/analytics"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
