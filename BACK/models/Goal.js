const db = require("../config/database");

class Goal {
  static async create(userId, { amount, description, targetDate }) {
    try {
      const [result] = await db.execute(
        "INSERT INTO goals (user_id, amount, description, target_date) VALUES (?, ?, ?, ?)",
        [userId, amount, description, targetDate]
      );
      return {
        goal_id: result.insertId,
        user_id: userId,
        amount,
        description,
        target_date: targetDate,
      };
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error finding goals:", error);
      throw error;
    }
  }

  static async findPrimaryGoal(userId) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      return rows[0];
    } catch (error) {
      console.error("Error finding primary goal:", error);
      throw error;
    }
  }

  static async update(goalId, userId, { amount, description, targetDate }) {
    try {
      const [result] = await db.execute(
        "UPDATE goals SET amount = ?, description = ?, target_date = ? WHERE goal_id = ? AND user_id = ?",
        [amount, description, targetDate, goalId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  }

  static async delete(goalId, userId) {
    try {
      const [result] = await db.execute(
        "DELETE FROM goals WHERE goal_id = ? AND user_id = ?",
        [goalId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }
}

module.exports = Goal;
