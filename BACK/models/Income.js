const db = require("../config/database");

class Income {
  static async findByUserId(userId) {
    const { rows } = await db.execute(
      `SELECT * FROM income 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async create(incomeData) {
    const client = await db.getConnection();
    try {
      await client.query("BEGIN");

      const { user_id, amount, description, date, category_id } = incomeData;

      const { rows } = await client.query(
        `INSERT INTO income 
         (user_id, category_id, amount, description, date) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, category_id, amount, description, date || new Date()]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id, userId) {
    const { rows } = await db.execute(
      `DELETE FROM income 
       WHERE income_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return rows[0];
  }

  static async getRecentIncome(userId, limit = 10) {
    const { rows } = await db.execute(
      `SELECT * FROM income 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }
}

module.exports = Income;
