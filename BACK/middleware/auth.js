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

      const { rows } = await db.execute(
        `SELECT user_id, email, first_name, last_name, username, account_status 
         FROM users 
         WHERE user_id = $1 
         AND account_status = 'active'`,
        [decoded.userId]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const user = rows[0];
      req.user = {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
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
