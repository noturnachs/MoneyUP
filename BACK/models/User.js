const db = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const query = `
      INSERT INTO users 
        (name, email, password)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
      userData.email,
      hashedPassword,
    ]);

    return result;
  }

  static async findByEmail(email) {
    if (!email) return null;

    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      "SELECT user_id, name, email FROM users WHERE user_id = ?",
      [id]
    );
    return rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
