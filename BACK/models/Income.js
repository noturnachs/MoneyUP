const db = require("../config/database");

class Income {
  static async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM income 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async create(incomeData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        user_id,
        amount,
        description,
        date,
        category_id = null,
      } = incomeData;

      const [result] = await connection.execute(
        `INSERT INTO income 
         (user_id, category_id, amount, description, date) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, category_id, amount, description, date || new Date()]
      );

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id, userId) {
    const [result] = await db.execute(
      `DELETE FROM income 
       WHERE income_id = ? AND user_id = ?`,
      [id, userId]
    );
    return result;
  }

  static async getRecentIncome(userId, limit = 10) {
    const [rows] = await db.execute(
      `SELECT * FROM income 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }
}

module.exports = Income;
