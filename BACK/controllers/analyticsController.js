const db = require("../config/database");
const Subscription = require("../models/Subscription");

exports.getBasicAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    // Basic analytics: Last 30 days summary (available to all tiers)
    const result = await db.execute(
      `
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as total_expenses,
        COUNT(*) as total_transactions
      FROM (
        SELECT amount, 'income' as type FROM income 
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT amount, 'expense' as type FROM expenses 
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      ) as transactions
    `,
      [userId]
    );

    // For free tier, limit the data to last 3 months
    const subscription = await Subscription.getByUserId(userId);
    const isFreeTier = subscription.tier === "free";

    if (isFreeTier) {
      // Add a warning message for free tier users
      result.rows[0].tierMessage =
        "Upgrade to Pro for unlimited history and advanced analytics!";
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching basic analytics",
      error: error.message,
    });
  }
};

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has access to advanced analytics
    const hasAccess = await Subscription.hasAccess(
      userId,
      "advanced_analytics"
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "This feature requires a Pro subscription",
        upgradeRequired: true,
      });
    }

    // Advanced analytics query (only for pro/enterprise users)
    const result = await db.execute(
      `
      WITH monthly_totals AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as monthly_income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as monthly_expenses
        FROM (
          SELECT amount, created_at, 'income' as type FROM income WHERE user_id = $1
          UNION ALL
          SELECT amount, created_at, 'expense' as type FROM expenses WHERE user_id = $1
        ) as all_transactions
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 6
      )
      SELECT 
        month,
        monthly_income,
        monthly_expenses,
        monthly_income - monthly_expenses as monthly_savings,
        ROUND((monthly_expenses::numeric / NULLIF(monthly_income, 0) * 100), 2) as expense_ratio
      FROM monthly_totals
    `,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching advanced analytics",
      error: error.message,
    });
  }
};

exports.getCustomRangeAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    // Check if user has access to custom range analytics
    const hasAccess = await Subscription.hasAccess(
      userId,
      "advanced_analytics"
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Custom date range analytics requires a Pro subscription",
        upgradeRequired: true,
      });
    }

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const result = await db.execute(
      `
      WITH range_totals AS (
        SELECT 
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as total_income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as total_expenses,
          COUNT(*) as total_transactions
        FROM (
          SELECT amount, 'income' as type FROM income 
          WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
          UNION ALL
          SELECT amount, 'expense' as type FROM expenses 
          WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
        ) as transactions
      )
      SELECT 
        total_income,
        total_expenses,
        total_transactions,
        total_income - total_expenses as net_savings,
        ROUND((total_expenses::numeric / NULLIF(total_income, 0) * 100), 2) as expense_ratio
      FROM range_totals
    `,
      [userId, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching custom range analytics",
      error: error.message,
    });
  }
};

exports.exportAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch comprehensive data for export
    const result = await db.execute(
      `
      SELECT 
        'Transaction History' as report_type,
        created_at,
        amount,
        type,
        category,
        description
      FROM (
        SELECT 
          created_at,
          amount,
          'income' as type,
          category,
          description
        FROM income 
        WHERE user_id = $1
        UNION ALL
        SELECT 
          created_at,
          amount,
          'expense' as type,
          category,
          description
        FROM expenses 
        WHERE user_id = $1
      ) as all_transactions
      ORDER BY created_at DESC
    `,
      [userId]
    );

    // Format data for export
    const exportData = {
      generatedAt: new Date().toISOString(),
      userData: {
        userId: userId,
        exportDate: new Date().toISOString(),
      },
      transactions: result.rows,
    };

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting analytics data",
      error: error.message,
    });
  }
};
