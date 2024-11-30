const db = require("../config/database");

class Category {
  static async getAll(userId) {
    const { rows } = await db.execute(
      `SELECT * FROM categories 
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY name ASC`,
      [userId]
    );
    return rows;
  }

  static async getByType(userId, type) {
    const { rows } = await db.execute(
      `SELECT * FROM categories 
       WHERE (user_id = $1 OR user_id IS NULL) 
       AND type = $2
       ORDER BY name ASC`,
      [userId, type]
    );
    return rows;
  }

  static async create(categoryData) {
    const { rows } = await db.execute(
      `INSERT INTO categories (name, type, user_id) 
       VALUES ($1, $2, $3)
       RETURNING *`,
      [categoryData.name, categoryData.type, categoryData.user_id]
    );
    return rows[0];
  }

  static async update(id, userId, categoryData) {
    const { rows } = await db.execute(
      `UPDATE categories 
       SET name = $1, type = $2 
       WHERE category_id = $3 AND user_id = $4
       RETURNING *`,
      [categoryData.name, categoryData.type, id, userId]
    );
    return rows[0];
  }

  static async delete(id, userId) {
    const { rows } = await db.execute(
      `DELETE FROM categories 
       WHERE category_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return rows[0];
  }

  static async findById(id, userId) {
    const { rows } = await db.execute(
      `SELECT * FROM categories 
       WHERE category_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [id, userId]
    );
    return rows[0];
  }
}

module.exports = Category;
