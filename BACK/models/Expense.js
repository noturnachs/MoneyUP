const db = require("../config/database");

class Expense {
  static async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT * FROM expenses 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async create(expenseData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { user_id, amount, description, category, date } = expenseData;

      const [result] = await connection.execute(
        `INSERT INTO expenses 
         (user_id, amount, description, category, date) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, amount, description, category, date || new Date()]
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

  static async getMonthlyExpenses(userId) {
    const [rows] = await db.execute(
      `SELECT 
         DATE_FORMAT(date, '%Y-%m') as month,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = ?
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC`,
      [userId]
    );
    return rows;
  }

  static async getRecentExpenses(userId, limit = 10) {
    const [rows] = await db.execute(
      `SELECT * FROM expenses 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  static async delete(expenseId, userId) {
    const [result] = await db.execute(
      `DELETE FROM expenses 
       WHERE expense_id = ? AND user_id = ?`,
      [expenseId, userId]
    );
    return result;
  }

  static async getExpensesByCategory(userId, timeframe = null) {
    let dateFilter = "";
    const params = [userId];

    if (timeframe) {
      switch (timeframe) {
        case "daily":
          dateFilter = "AND DATE(date) = CURDATE()";
          break;
        case "weekly":
          dateFilter = "AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
          break;
        case "monthly":
          dateFilter = "AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
          break;
      }
    }

    const [rows] = await db.execute(
      `SELECT 
         category,
         COUNT(*) as count,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = ? ${dateFilter}
       GROUP BY category
       ORDER BY total DESC`,
      params
    );
    return rows;
  }
}

module.exports = Expense;
