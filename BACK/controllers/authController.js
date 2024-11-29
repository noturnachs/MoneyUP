const jwt = require("jsonwebtoken");
const User = require("../models/User");
const db = require("../config/database");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;

    // Check if email already exists
    const [existingEmail] = await db.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if username already exists
    const [existingUsername] = await db.execute(
      "SELECT user_id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
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
    const { email, password } = req.body;
    console.log("Login attempt:", { email, password: "provided" });

    // Find user by email
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
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
  try {
    const userId = req.user.id;

    // Begin transaction
    await db.beginTransaction();

    try {
      // Delete user's expenses
      await db.execute("DELETE FROM expenses WHERE user_id = ?", [userId]);

      // Delete user's income records
      await db.execute("DELETE FROM income WHERE user_id = ?", [userId]);

      // Delete user's categories
      await db.execute("DELETE FROM categories WHERE user_id = ?", [userId]);

      // Finally delete the user
      await db.execute("DELETE FROM users WHERE user_id = ?", [userId]);

      // Commit transaction
      await db.commit();

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      // Rollback in case of error
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting account",
    });
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
