const db = require("../config/database");
const Goal = require("../models/Goal");
const { validateGoal } = require("../utils/helpers");

class GoalController {
  static async createGoal(req, res) {
    try {
      const { amount, description, targetDate } = req.body;
      const errors = validateGoal({ amount, description, targetDate });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      const goal = await Goal.create(req.user.id, {
        amount,
        description,
        targetDate,
      });

      res.json({ success: true, goal });
    } catch (error) {
      console.error("Error in createGoal:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create goal",
        error: error.message,
      });
    }
  }

  static async getGoals(req, res) {
    try {
      const goals = await Goal.findByUserId(req.user.id);
      res.json({ success: true, goals });
    } catch (error) {
      console.error("Error in getGoals:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch goals",
        error: error.message,
      });
    }
  }

  static async updateGoal(req, res) {
    try {
      const { id } = req.params;
      const { amount, description, targetDate } = req.body;

      const { isValid, errors } = validateGoal({
        amount,
        description,
        targetDate,
      });
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: errors.join(", "),
        });
      }

      const goal = await Goal.update(id, req.user.id, {
        amount,
        description,
        targetDate,
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: "Goal not found",
        });
      }

      res.json({ success: true, goal });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteGoal(req, res) {
    try {
      const { id } = req.params;
      const goal = await Goal.delete(id, req.user.id);

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: "Goal not found",
        });
      }

      res.json({ success: true, message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPrimaryGoal(req, res) {
    try {
      const [goals] = await db.execute(
        `SELECT * FROM goals 
         WHERE user_id = ? 
         AND is_completed = false 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [req.user.id]
      );

      res.json({
        success: true,
        goals,
      });
    } catch (error) {
      console.error("Error fetching primary goal:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch primary goal",
      });
    }
  }

  static async markAccomplished(req, res) {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const { amount } = req.body;

      // Mark goal as completed with completion date
      const [result] = await conn.execute(
        `UPDATE goals 
         SET is_completed = true,
             date_completed = CURRENT_DATE()
         WHERE goal_id = ? AND user_id = ?`,
        [req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({
          success: false,
          message: "Goal not found or unauthorized",
        });
      }

      await conn.commit();

      res.json({
        success: true,
        message: "Goal marked as accomplished",
      });
    } catch (error) {
      await conn.rollback();
      console.error("Error marking goal as accomplished:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark goal as accomplished",
      });
    } finally {
      conn.release();
    }
  }
}

module.exports = GoalController;
