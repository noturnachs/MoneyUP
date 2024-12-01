const db = require("../config/database");
const Goal = require("../models/Goal");
const { validateGoal } = require("../utils/helpers");

class GoalController {
  static async createGoal(req, res) {
    try {
      const { amount, description, targetDate } = req.body;
      const now = new Date();

      // Set default target date if none provided
      const finalTargetDate = targetDate
        ? new Date(targetDate)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const errors = validateGoal({
        amount,
        description,
        targetDate: finalTargetDate,
      });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Log the data being sent to create
      console.log("Creating goal with data:", {
        amount,
        description,
        target_date: finalTargetDate,
        created_at: now,
      });

      const goal = await Goal.create(req.user.id, {
        amount,
        description,
        target_date: finalTargetDate,
      });

      res.json({
        success: true,
        goal: {
          ...goal,
          created_at: goal.created_at.toISOString(),
          target_date: goal.target_date.toISOString(),
          date_completed: goal.date_completed
            ? new Date(goal.date_completed).toISOString()
            : null,
        },
      });
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
      res.json({
        success: true,
        goals: goals.map((goal) => ({
          ...goal,
          created_at: goal.created_at
            ? new Date(goal.created_at).toISOString()
            : null,
          target_date: goal.target_date
            ? new Date(goal.target_date).toISOString()
            : null,
          date_completed: goal.date_completed
            ? new Date(goal.date_completed).toISOString()
            : null,
        })),
      });
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
      const now = new Date();

      // Ensure target_date is not null when updating
      if (!targetDate) {
        return res.status(400).json({
          success: false,
          message: "Target date is required",
        });
      }

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
        target_date: new Date(targetDate),
        updated_at: now,
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: "Goal not found",
        });
      }

      res.json({
        success: true,
        goal: {
          ...goal,
          created_at: new Date(goal.created_at).toISOString(),
          updated_at: new Date(goal.updated_at).toISOString(),
          target_date: new Date(goal.target_date).toISOString(),
          date_completed: goal.date_completed
            ? new Date(goal.date_completed).toISOString()
            : null,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
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
      const { rows } = await db.execute(
        `SELECT * FROM goals 
         WHERE user_id = $1 
         AND is_completed = false 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [req.user.id]
      );

      res.json({
        success: true,
        goal: rows[0] || null,
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
    const client = await db.getConnection();

    try {
      await client.query("BEGIN");

      const now = new Date();
      const { rows } = await client.query(
        `UPDATE goals 
         SET is_completed = true,
             date_completed = $3
         WHERE goal_id = $1 AND user_id = $2
         RETURNING *`,
        [req.params.id, req.user.id, now]
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Goal not found or unauthorized",
        });
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Goal marked as accomplished",
        goal: {
          ...rows[0],
          created_at: rows[0].created_at
            ? new Date(rows[0].created_at).toISOString()
            : null,
          target_date: rows[0].target_date
            ? new Date(rows[0].target_date).toISOString()
            : null,
          date_completed: rows[0].date_completed
            ? new Date(rows[0].date_completed).toISOString()
            : null,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error marking goal as accomplished:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark goal as accomplished",
      });
    } finally {
      client.release();
    }
  }
}

module.exports = GoalController;
