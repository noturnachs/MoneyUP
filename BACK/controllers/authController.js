const jwt = require("jsonwebtoken");
const User = require("../models/User");
const db = require("../config/database");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;

    // Check if email or username already exists
    const [existingUser] = await db.execute(
      "SELECT user_id, email, username FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUser.length > 0) {
      // Specify which field is taken
      if (existingUser[0].email === email) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }
      if (existingUser[0].username === username) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, username, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check if identifier is empty
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: identifier
          ? "Password is required"
          : "Email or username is required",
      });
    }

    // First check if user exists regardless of status
    const [users] = await db.execute(
      "SELECT * FROM users WHERE (email = ? OR username = ?)",
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "No account found with this email/username",
      });
    }

    const user = users[0];

    // Check if account is deleted
    if (user.account_status === "deleted") {
      return res.status(401).json({
        success: false,
        message: "Your account has been deleted as per your request",
      });
    }

    // Check if account is active
    if (user.account_status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, currentPassword, newPassword } =
      req.body;
    const userId = req.user.id;

    // Start building the query and parameters
    let updateFields = [];
    let params = [];
    let query = "UPDATE users SET ";

    // Add first name if provided
    if (firstName !== undefined) {
      updateFields.push("first_name = ?");
      params.push(firstName);
    }

    // Add last name if provided
    if (lastName !== undefined) {
      updateFields.push("last_name = ?");
      params.push(lastName);
    }

    // Add email if provided
    if (email !== undefined) {
      // Check if email is already taken by another user
      const [existingUser] = await db.execute(
        "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
        [email, userId]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use",
        });
      }

      updateFields.push("email = ?");
      params.push(email);
    }

    // Handle password update if provided
    if (newPassword && currentPassword) {
      // Verify current password
      const [user] = await db.execute(
        "SELECT password FROM users WHERE user_id = ?",
        [userId]
      );

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user[0].password
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?");
      params.push(hashedPassword);
    }

    // Add user_id to params
    params.push(userId);

    // Complete the query
    query += updateFields.join(", ") + " WHERE user_id = ?";

    // Execute update
    await db.execute(query, params);

    // Fetch updated user data
    const [updatedUser] = await db.execute(
      "SELECT user_id, email, first_name, last_name FROM users WHERE user_id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser[0].user_id,
        email: updatedUser[0].email,
        firstName: updatedUser[0].first_name,
        lastName: updatedUser[0].last_name,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

exports.deleteAccount = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.user.id;

    // Begin transaction
    await connection.beginTransaction();

    try {
      // Update user's account_status to 'deleted'
      await connection.execute(
        "UPDATE users SET account_status = 'deleted' WHERE user_id = ?",
        [userId]
      );

      // Commit transaction
      await connection.commit();

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting account",
    });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify token",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [user] = await db.execute(
      "SELECT user_id, username, email, first_name, last_name FROM users WHERE user_id = ?",
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user[0].user_id,
        username: user[0].username,
        email: user[0].email,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { field, value } = req.body;

    if (!["username", "email"].includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field",
      });
    }

    const [existing] = await db.execute(
      `SELECT user_id FROM users WHERE ${field} = ?`,
      [value]
    );

    res.json({
      success: true,
      available: existing.length === 0,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking availability",
    });
  }
};

exports.updateThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;
    const userId = req.user.id;

    // Validate threshold value
    if (
      threshold !== null &&
      (isNaN(parseFloat(threshold)) || parseFloat(threshold) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Threshold must be a positive number or null",
      });
    }

    // Update threshold in database
    const [result] = await db.execute(
      "UPDATE users SET account_threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [threshold, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Threshold updated successfully",
      threshold: threshold,
    });
  } catch (error) {
    console.error("Error updating threshold:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update threshold",
    });
  }
};

exports.getThreshold = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's threshold
    const [result] = await db.execute(
      "SELECT account_threshold FROM users WHERE user_id = ?",
      [userId]
    );

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      threshold: result[0].account_threshold,
    });
  } catch (error) {
    console.error("Error getting threshold:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get threshold",
    });
  }
};
