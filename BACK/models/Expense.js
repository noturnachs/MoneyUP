const db = require("../config/database");

class Expense {
  static async findByUserId(userId) {
    const { rows } = await db.execute(
      `SELECT * FROM expenses 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async create(expenseData) {
    const client = await db.getConnection();
    try {
      await client.query("BEGIN");

      const { user_id, amount, description, category, date } = expenseData;

      const { rows } = await client.query(
        `INSERT INTO expenses 
         (user_id, amount, description, category, date) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, amount, description, category, date || new Date()]
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

  static async getMonthlyExpenses(userId) {
    const { rows } = await db.execute(
      `SELECT 
         TO_CHAR(date, 'YYYY-MM') as month,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = $1
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month DESC`,
      [userId]
    );
    return rows;
  }

  static async getRecentExpenses(userId, limit = 10) {
    const { rows } = await db.execute(
      `SELECT * FROM expenses 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  static async delete(expenseId, userId) {
    const { rows } = await db.execute(
      `DELETE FROM expenses 
       WHERE expense_id = $1 AND user_id = $2
       RETURNING *`,
      [expenseId, userId]
    );
    return rows[0];
  }

  static async getExpensesByCategory(userId, timeframe = null) {
    let dateFilter = "";
    const params = [userId];

    if (timeframe) {
      switch (timeframe) {
        case "daily":
          dateFilter = "AND DATE(date) = CURRENT_DATE";
          break;
        case "weekly":
          dateFilter = "AND date >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case "monthly":
          dateFilter = "AND date >= CURRENT_DATE - INTERVAL '30 days'";
          break;
      }
    }

    const { rows } = await db.execute(
      `SELECT 
         category,
         COUNT(*) as count,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = $1 ${dateFilter}
       GROUP BY category
       ORDER BY total DESC`,
      params
    );
    return rows;
  }
}

module.exports = Expense;
