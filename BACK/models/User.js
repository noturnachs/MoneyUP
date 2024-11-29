const db = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const query = `
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      userData.username,
      userData.email,
      hashedPassword,
    ]);

    return result;
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
