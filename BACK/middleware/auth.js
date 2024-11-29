const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = authMiddleware;
