const db = require("../config/database");

class Category {
  static async getAll(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM categories 
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY name ASC`,
      [userId]
    );
    return rows;
  }

  static async getByType(userId, type) {
    const [rows] = await db.execute(
      `SELECT * FROM categories 
       WHERE (user_id = ? OR user_id IS NULL) 
       AND type = ?
       ORDER BY name ASC`,
      [userId, type]
    );
    return rows;
  }

  static async create(categoryData) {
    const [result] = await db.execute(
      `INSERT INTO categories (name, type, user_id) 
       VALUES (?, ?, ?)`,
      [categoryData.name, categoryData.type, categoryData.user_id]
    );
    return result;
  }

  static async update(id, userId, categoryData) {
    const [result] = await db.execute(
      `UPDATE categories 
       SET name = ?, type = ? 
       WHERE category_id = ? AND user_id = ?`,
      [categoryData.name, categoryData.type, id, userId]
    );
    return result;
  }

  static async delete(id, userId) {
    const [result] = await db.execute(
      `DELETE FROM categories 
       WHERE category_id = ? AND user_id = ?`,
      [id, userId]
    );
    return result;
  }

  static async findById(id, userId) {
    const [rows] = await db.execute(
      `SELECT * FROM categories 
       WHERE category_id = ? AND (user_id = ? OR user_id IS NULL)`,
      [id, userId]
    );
    return rows[0];
  }
}

module.exports = Category;
