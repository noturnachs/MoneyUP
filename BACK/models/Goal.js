const db = require("../config/database");

class Goal {
  static async create(userId, data) {
    const { amount, description, target_date } = data;
    const now = new Date();

    // Ensure target_date is set
    const finalTargetDate =
      target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { rows } = await db.execute(
      `INSERT INTO goals 
       (user_id, amount, description, target_date, created_at, current_amount, is_completed) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        userId,
        amount,
        description,
        finalTargetDate,
        now,
        0, // current_amount starts at 0
        false, // is_completed starts as false
      ]
    );

    return rows[0];
  }

  static async findByUserId(userId) {
    const { rows } = await db.execute(
      "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  static async update(goalId, userId, data) {
    const { amount, description, target_date } = data;

    // Ensure target_date is set for updates
    if (!target_date) {
      throw new Error("Target date is required for updates");
    }

    const { rows } = await db.execute(
      `UPDATE goals 
       SET amount = $1, 
           description = $2, 
           target_date = $3
       WHERE goal_id = $4 AND user_id = $5 
       RETURNING *`,
      [amount, description, target_date, goalId, userId]
    );

    return rows[0];
  }

  static async delete(goalId, userId) {
    const { rows } = await db.execute(
      "DELETE FROM goals WHERE goal_id = $1 AND user_id = $2 RETURNING *",
      [goalId, userId]
    );
    return rows[0];
  }
}

module.exports = Goal;
