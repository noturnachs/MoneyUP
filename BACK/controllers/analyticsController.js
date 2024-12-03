const db = require("../config/database");
const Subscription = require("../models/Subscription");

exports.getBasicAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get totals
    const {
      rows: [totals],
    } = await db.execute(
      `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) 
         FROM income 
         WHERE user_id = $2 AND date >= $1) as total_income,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE user_id = $2 AND date >= $1) as total_expenses
      FROM (SELECT 1) as dummy
    `,
      [startOfMonth, req.user.id]
    );

    // Get category comparison separately
    const { rows: categoryComparison } = await db.execute(
      `
      SELECT 
        c.name as category,
        COALESCE(SUM(CASE WHEN e.date >= $1 THEN e.amount ELSE 0 END), 0) as current_amount,
        COALESCE(SUM(CASE WHEN e.date >= $2 AND e.date < $1 THEN e.amount ELSE 0 END), 0) as last_amount
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.category_id AND e.user_id = $3
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING 
        COALESCE(SUM(CASE WHEN e.date >= $1 THEN e.amount ELSE 0 END), 0) > 0 
        OR COALESCE(SUM(CASE WHEN e.date >= $2 AND e.date < $1 THEN e.amount ELSE 0 END), 0) > 0
    `,
      [startOfMonth, startOfLastMonth, req.user.id]
    );

    // Calculate insights
    const insights = categoryComparison
      .map((cat) => {
        const percentChange =
          cat.last_amount > 0
            ? ((cat.current_amount - cat.last_amount) / cat.last_amount) * 100
            : cat.current_amount > 0
            ? 100
            : 0;

        return {
          category: cat.category,
          current_amount: parseFloat(cat.current_amount),
          last_amount: parseFloat(cat.last_amount),
          percent_change: percentChange,
          is_unusual: Math.abs(percentChange) > 50, // Flag if change is more than 50%
        };
      })
      .sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change));

    // Calculate savings rate
    const savingsRate =
      totals.total_income > 0
        ? ((totals.total_income - totals.total_expenses) /
            totals.total_income) *
          100
        : 0;

    res.json({
      success: true,
      data: {
        total_income: parseFloat(totals.total_income),
        total_expenses: parseFloat(totals.total_expenses),
        savings_rate: parseFloat(savingsRate.toFixed(1)),
        insights: insights,
        period: {
          start: startOfMonth.toISOString(),
          end: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error getting basic analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get monthly trends
    const { rows: monthlyTrends } = await db.execute(
      `
      WITH RECURSIVE months AS (
        SELECT DATE_TRUNC('month', $1::timestamp) as month
        UNION ALL
        SELECT DATE_TRUNC('month', month + INTERVAL '1 month')
        FROM months
        WHERE month < DATE_TRUNC('month', $2::timestamp)
      )
      SELECT 
        TO_CHAR(m.month, 'Mon YYYY') as month,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM income 
         WHERE user_id = $3 
         AND DATE_TRUNC('month', date) = m.month) as monthly_income,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE user_id = $3 
         AND DATE_TRUNC('month', date) = m.month) as monthly_expenses
      FROM months m
      GROUP BY m.month
      ORDER BY m.month ASC
    `,
      [startOfYear, now, req.user.id]
    );

    // Get category breakdown
    const { rows: categoryBreakdown } = await db.execute(
      `
      SELECT 
        c.name,
        COALESCE(SUM(e.amount), 0) as value
      FROM categories c
      LEFT JOIN expenses e ON 
        e.category_id = c.category_id AND 
        e.user_id = $1 AND 
        e.date >= $2 AND 
        e.date <= $3
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING COALESCE(SUM(e.amount), 0) > 0
      ORDER BY value DESC
    `,
      [req.user.id, startOfYear, now]
    );

    res.json({
      success: true,
      data: {
        monthly_trends: monthlyTrends.map((row) => ({
          month: row.month,
          monthly_income: parseFloat(row.monthly_income),
          monthly_expenses: parseFloat(row.monthly_expenses),
        })),
        category_breakdown: categoryBreakdown.map((row) => ({
          name: row.name,
          value: parseFloat(row.value),
        })),
        period: {
          start: startOfYear.toISOString(),
          end: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error getting advanced analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomRangeAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range provided",
      });
    }

    // Similar queries as getAdvancedAnalytics but with custom date range
    // ... implementation similar to getAdvancedAnalytics but using start/end params

    res.json({
      success: true,
      data: {
        // ... formatted data
      },
    });
  } catch (error) {
    console.error("Error getting custom range analytics:", error);
    res.status(500).json({ success: false, message: error.message });
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
