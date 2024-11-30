const jwt = require("jsonwebtoken");
const User = require("../models/User");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
} = require("../utils/emailService");

exports.register = async (req, res) => {
  const client = await db.getConnection();

  try {
    await client.query("BEGIN");

    const {
      email,
      password,
      username,
      firstName,
      lastName,
      first_name,
      last_name,
    } = req.body;

    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;

    console.log("Registration data:", {
      email,
      username,
      firstName: finalFirstName,
      lastName: finalLastName,
    });

    if (!email || !password || !username || !finalFirstName || !finalLastName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        received: req.body,
        missing: {
          email: !email,
          password: !password,
          username: !username,
          firstName: !finalFirstName,
          lastName: !finalLastName,
        },
      });
    }

    const { rows } = await db.execute(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (parseInt(rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    const hashedPassword = await bcrypt.hash(password, 10);
    const {
      rows: [newUser],
    } = await client.query(
      `INSERT INTO users 
       (email, password, username, first_name, last_name, name, verification_token, verification_token_expires) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING user_id, email, username, first_name, last_name, name`,
      [
        email,
        hashedPassword,
        username,
        finalFirstName,
        finalLastName,
        `${finalFirstName} ${finalLastName}`,
        verificationToken,
        tokenExpires,
      ]
    );

    await client.query("COMMIT");

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      user: {
        id: newUser.user_id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        name: newUser.name,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Full request body:", req.body); // Debug log for entire body

    // Get identifier (email or username) and password from request
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
        received: req.body,
      });
    }

    console.log("Login attempt for:", identifier); // Debug log

    // Changed query to handle both email and username login
    const { rows } = await db.execute(
      `SELECT * FROM users 
       WHERE (email = $1 OR username = $1) 
       AND account_status = 'active'`,
      [identifier]
    );

    const user = rows[0];
    if (!user) {
      console.log("No user found for identifier:", identifier); // Debug log
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Add email verification check
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log("Invalid password for user:", identifier); // Debug log
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log("Login successful for user:", user.email); // Debug log

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  const client = await db.getConnection();

  try {
    await client.query("BEGIN");

    const userId = req.user.id;
    const { email, firstName, lastName, currentPassword, newPassword } =
      req.body;

    // First, check if email already exists for another user
    const emailCheckQuery = `
      SELECT user_id FROM users 
      WHERE email = $1 AND user_id != $2`;

    const { rows: existingUsers } = await client.query(emailCheckQuery, [
      email,
      userId,
    ]);

    if (existingUsers.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Email already in use by another account",
      });
    }

    // If password change is requested, verify current password
    if (currentPassword && newPassword) {
      const {
        rows: [user],
      } = await client.query("SELECT password FROM users WHERE user_id = $1", [
        userId,
      ]);

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Build update query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;

    if (email) {
      updateFields.push(`email = $${paramCounter}`);
      queryParams.push(email);
      paramCounter++;
    }

    if (firstName) {
      updateFields.push(`first_name = $${paramCounter}`);
      queryParams.push(firstName);
      paramCounter++;
    }

    if (lastName) {
      updateFields.push(`last_name = $${paramCounter}`);
      queryParams.push(lastName);
      paramCounter++;
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push(`password = $${paramCounter}`);
      queryParams.push(hashedPassword);
      paramCounter++;
    }

    // Add name update if first_name or last_name changes
    if (firstName || lastName) {
      updateFields.push(
        `name = CONCAT_WS(' ', COALESCE($${paramCounter}, first_name), COALESCE($${
          paramCounter + 1
        }, last_name))`
      );
      queryParams.push(firstName, lastName);
      paramCounter += 2;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add userId as the last parameter
    queryParams.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE user_id = $${paramCounter}
      RETURNING user_id, email, first_name, last_name, name`;

    const {
      rows: [updatedUser],
    } = await client.query(updateQuery, queryParams);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.user_id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

exports.deleteAccount = async (req, res) => {
  const client = await db.getConnection();

  try {
    await client.query("BEGIN");

    const userId = req.user.id;

    // Update user's account_status to 'deleted'
    await client.query(
      "UPDATE users SET account_status = 'deleted' WHERE user_id = $1",
      [userId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting account",
    });
  } finally {
    client.release(); // Release the client back to the pool
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
    const { rows } = await db.execute(
      `SELECT user_id, username, email, first_name, last_name 
       FROM users 
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: rows[0].user_id,
        username: rows[0].username,
        email: rows[0].email,
        firstName: rows[0].first_name,
        lastName: rows[0].last_name,
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
    // Check both query parameters and request body
    const field = req.query.field || req.body.field;
    const value = req.query.value || req.body.value;

    console.log("Query:", req.query); // Debug
    console.log("Body:", req.body); // Debug

    if (!field || !value) {
      return res.status(400).json({
        success: false,
        message: "Field and value are required",
        received: {
          query: req.query,
          body: req.body,
        },
      });
    }

    if (!["email", "username"].includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field specified",
      });
    }

    const { rows } = await db.execute(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE ${field} = $1`,
      [value]
    );

    const exists = parseInt(rows[0].count) > 0;

    res.json({
      success: true,
      available: !exists,
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
    const userId = req.user.id;
    const { threshold } = req.body;

    if (threshold === undefined || threshold === null) {
      return res.status(400).json({
        success: false,
        message: "Threshold value is required",
      });
    }

    // Updated query to use PostgreSQL syntax
    const { rows } = await db.execute(
      `UPDATE users 
       SET account_threshold = $1 
       WHERE user_id = $2 
       RETURNING account_threshold`,
      [threshold, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      threshold: rows[0].account_threshold,
      message: "Threshold updated successfully",
    });
  } catch (error) {
    console.error("Error updating threshold:", error);
    res.status(500).json({
      success: false,
      message: "Error updating threshold",
      error: error.message,
    });
  }
};

exports.getThreshold = async (req, res) => {
  try {
    const userId = req.user.id;

    // Updated query to use PostgreSQL syntax
    const { rows } = await db.execute(
      `SELECT account_threshold 
       FROM users 
       WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      threshold: rows[0].account_threshold,
    });
  } catch (error) {
    console.error("Error getting threshold:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving threshold",
      error: error.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const { rows } = await db.execute(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL 
       WHERE verification_token = $1 
       AND verification_token_expires > NOW() 
       RETURNING user_id`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying email",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1);

    const { rows } = await db.execute(
      `UPDATE users 
       SET reset_password_token = $1, 
           reset_password_expires = $2 
       WHERE email = $3 
       AND account_status = 'active' 
       RETURNING user_id`,
      [resetToken, tokenExpires, email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await db.execute(
      `UPDATE users 
       SET password = $1, 
           reset_password_token = NULL, 
           reset_password_expires = NULL 
       WHERE reset_password_token = $2 
       AND reset_password_expires > NOW() 
       RETURNING user_id`,
      [hashedPassword, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};

exports.verifyEmailChange = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    // Check if email is already in use
    const { rows: existingUser } = await client.query(
      "SELECT * FROM users WHERE email = $1 AND user_id != $2",
      [newEmail, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 30 * 60000); // 30 minutes from now

    // Store verification code in database
    await client.query(
      `INSERT INTO email_verifications (user_id, email, code, expires_at, type)
       VALUES ($1, $2, $3, $4, 'email_change')
       ON CONFLICT (user_id, type) 
       DO UPDATE SET email = $2, code = $3, expires_at = $4, verified = false`,
      [userId, newEmail, verificationCode, expiresAt]
    );

    // Send verification email using the existing utility function
    await sendVerificationCodeEmail(newEmail, verificationCode);

    res.json({
      success: true,
      message: "Verification code sent to new email address",
    });
  } catch (error) {
    console.error("Email change verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending verification code",
    });
  } finally {
    client.release();
  }
};

exports.confirmEmailChange = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { code, newEmail } = req.body;
    const userId = req.user.id;

    // Check verification code
    const { rows } = await client.query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 
       AND email = $2 
       AND code = $3 
       AND expires_at > NOW()
       AND type = 'email_change'
       AND NOT verified`,
      [userId, newEmail, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Begin transaction
    await client.query("BEGIN");

    // Update user's email
    await client.query(
      "UPDATE users SET email = $1, email_verified = true WHERE user_id = $2",
      [newEmail, userId]
    );

    // Mark verification as used
    await client.query(
      "UPDATE email_verifications SET verified = true WHERE user_id = $1 AND type = $2",
      [userId, "email_change"]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Email updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Email change confirmation error:", error);
    res.status(500).json({
      success: false,
      message: "Error confirming email change",
    });
  } finally {
    client.release();
  }
};
