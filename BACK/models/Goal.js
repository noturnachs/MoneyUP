const db = require("../config/database");

class Goal {
  static async create(userId, { amount, description, targetDate }) {
    try {
      const { rows } = await db.execute(
        `INSERT INTO goals (user_id, amount, description, target_date) 
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, amount, description, targetDate]
      );
      return rows[0];
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const { rows } = await db.execute(
        `SELECT * FROM goals 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error finding goals:", error);
      throw error;
    }
  }

  static async update(goalId, userId, { amount, description, targetDate }) {
    try {
      const { rows } = await db.execute(
        `UPDATE goals 
         SET amount = $1, description = $2, target_date = $3 
         WHERE goal_id = $4 AND user_id = $5
         RETURNING *`,
        [amount, description, targetDate, goalId, userId]
      );
      return rows[0];
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  }

  static async delete(goalId, userId) {
    try {
      const { rows } = await db.execute(
        `DELETE FROM goals 
         WHERE goal_id = $1 AND user_id = $2
         RETURNING *`,
        [goalId, userId]
      );
      return rows[0];
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }

  static async markAccomplished(goalId, userId) {
    try {
      const { rows } = await db.execute(
        `UPDATE goals 
         SET is_completed = true, 
             date_completed = CURRENT_DATE
         WHERE goal_id = $1 AND user_id = $2
         RETURNING *`,
        [goalId, userId]
      );
      return rows[0];
    } catch (error) {
      console.error("Error marking goal as accomplished:", error);
      throw error;
    }
  }
}

module.exports = Goal;
