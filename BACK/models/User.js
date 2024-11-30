const db = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const { rows } = await db.execute(
      `INSERT INTO users 
         (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
        userData.email,
        hashedPassword,
      ]
    );

    return rows[0];
  }

  static async findByEmail(email) {
    if (!email) return null;

    const { rows } = await db.execute("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.execute(
      "SELECT user_id, name, email, account_threshold FROM users WHERE user_id = $1",
      [id]
    );
    return rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateThreshold(userId, threshold) {
    const { rows } = await db.execute(
      `UPDATE users 
       SET account_threshold = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [threshold, userId]
    );
    return rows[0];
  }

  static async getThreshold(userId) {
    const { rows } = await db.execute(
      "SELECT account_threshold FROM users WHERE user_id = $1",
      [userId]
    );
    return rows[0]?.account_threshold || null;
  }
}

module.exports = User;
