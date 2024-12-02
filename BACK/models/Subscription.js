const { pool } = require("../config/database.js");

class Subscription {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.tier = data.tier;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.tier_status = data.tier_status;
  }

  // Get subscription by user ID
  static async getByUserId(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM subscriptions WHERE user_id = $1",
        [userId]
      );
      return result.rows[0] ? new Subscription(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Create new subscription
  static async create(userId, tier = "free") {
    try {
      const result = await pool.query(
        `INSERT INTO subscriptions (user_id, tier, is_active) 
                 VALUES ($1, $2, true) 
                 RETURNING *`,
        [userId, tier]
      );
      return new Subscription(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update subscription tier
  static async updateTier(userId, newTier) {
    try {
      // Begin transaction
      await pool.query("BEGIN");

      // Update subscription
      const subResult = await pool.query(
        `UPDATE subscriptions 
                 SET tier = $1 
                 WHERE user_id = $2 
                 RETURNING *`,
        [newTier, userId]
      );

      // Update user tier status
      const userResult = await pool.query(
        `UPDATE users 
                 SET tier_status = $1 
                 WHERE id = $2 
                 RETURNING *`,
        [newTier, userId]
      );

      // Commit transaction
      await pool.query("COMMIT");

      return subResult.rows[0] ? new Subscription(subResult.rows[0]) : null;
    } catch (error) {
      // Rollback transaction
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  // Check if user has access to a feature
  static async hasAccess(userId, feature) {
    try {
      const subscription = await this.getByUserId(userId);
      if (!subscription) return false;

      // Define feature access by tier
      const featureAccess = {
        free: ["basic_tracking", "monthly_summary", "basic_categories"],
        pro: [
          "unlimited_history",
          "advanced_analytics",
          "custom_categories",
          "data_export",
          "budget_goals",
          "recurring_expenses",
        ],
        enterprise: [
          "api_access",
          "multiple_users",
          "custom_branding",
          "priority_support",
          "custom_reports",
        ],
      };

      // Check if user's tier has access to the feature
      const tierFeatures = featureAccess[subscription.tier] || [];
      return tierFeatures.includes(feature);
    } catch (error) {
      throw error;
    }
  }

  // Get subscription status (including tier_status from users table)
  static async getSubscriptionStatus(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM subscriptions WHERE user_id = $1`,
        [userId]
      );

      // If we find a subscription, return it with a default tier_status based on tier
      if (result.rows[0]) {
        const subscription = result.rows[0];
        return new Subscription({
          ...subscription,
          tier_status: subscription.tier === "free" ? "free" : "active",
        });
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Subscription;
