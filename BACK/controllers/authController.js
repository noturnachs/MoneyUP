const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/database");

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Check if username or email already exists
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      "INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both identifier and password",
      });
    }

    const [users] = await db.execute(
      "SELECT id, first_name, last_name, username, email, password FROM users WHERE email = ? OR username = ?",
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    const userData = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    res.json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

exports.updateProfile = async (req, res) => {
  let connection;
  try {
    const { firstName, lastName, email, currentPassword, newPassword } =
      req.body;
    const userId = req.user.id;

    // Get a connection from the pool
    connection = await db.getConnection();

    // Start transaction
    await connection.beginTransaction();

    try {
      // If changing password, verify current password
      if (newPassword) {
        const [users] = await connection.execute(
          "SELECT password FROM users WHERE id = ?",
          [userId]
        );

        if (users.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const isValidPassword = await bcrypt.compare(
          currentPassword,
          users[0].password
        );

        if (!isValidPassword) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute("UPDATE users SET password = ? WHERE id = ?", [
          hashedPassword,
          userId,
        ]);
      }

      // Update user information
      await connection.execute(
        "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
        [firstName, lastName, email, userId]
      );

      // Get updated user data
      const [updatedUsers] = await connection.execute(
        "SELECT id, first_name, last_name, username, email FROM users WHERE id = ?",
        [userId]
      );

      if (updatedUsers.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = updatedUsers[0];
      const userData = {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      };

      // Commit the transaction
      await connection.commit();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userData,
      });
    } catch (error) {
      // Rollback on error
      if (connection) {
        await connection.rollback();
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.beginTransaction();

    try {
      // Delete user's transactions
      await db.execute("DELETE FROM transactions WHERE user_id = ?", [userId]);

      // Delete user's expenses
      await db.execute("DELETE FROM expenses WHERE user_id = ?", [userId]);

      // Delete user
      await db.execute("DELETE FROM users WHERE id = ?", [userId]);

      await db.commit();

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, first_name, last_name, username, email FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];
    const userData = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
    });
  }
};
