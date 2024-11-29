const jwt = require("jsonwebtoken");
const db = require("../config/database");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is missing",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [users] = await db.execute(
        "SELECT user_id, email, first_name, last_name, username, account_status FROM users WHERE user_id = ? AND account_status = 'active'",
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = {
        id: users[0].user_id,
        email: users[0].email,
        firstName: users[0].first_name,
        lastName: users[0].last_name,
        username: users[0].username,
      };

      next();
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = authMiddleware;
