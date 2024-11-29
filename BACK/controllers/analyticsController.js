const db = require("../config/database");

exports.getSummary = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const userId = req.user.id;

    let dateFilter;
    switch (timeframe) {
      case "daily":
        dateFilter = "DATE(date) = CURDATE()";
        break;
      case "weekly":
        dateFilter = "YEARWEEK(date) = YEARWEEK(CURDATE())";
        break;
      case "monthly":
        dateFilter =
          "YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())";
        break;
      default:
        dateFilter = "MONTH(date) = MONTH(CURDATE())";
    }

    // Get total income and expenses
    const query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses,
        DATE(date) as date
      FROM transactions
      WHERE user_id = ? AND ${dateFilter}
      GROUP BY DATE(date)
      ORDER BY date DESC
    `;

    const [results] = await db.execute(query, [userId]);

    const summary = {
      totalIncome: results.reduce(
        (sum, day) => sum + parseFloat(day.totalIncome),
        0
      ),
      totalExpenses: results.reduce(
        (sum, day) => sum + parseFloat(day.totalExpenses),
        0
      ),
      comparison: results.map((day) => ({
        date: new Date(day.date).toLocaleDateString(),
        income: parseFloat(day.totalIncome),
        expenses: parseFloat(day.totalExpenses),
      })),
    };

    res.json(summary);
  } catch (error) {
    console.error("Error getting summary:", error);
    res.status(500).json({ message: "Error getting summary data" });
  }
};

exports.getExpensesByCategory = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const userId = req.user.id;

    let dateFilter;
    switch (timeframe) {
      case "daily":
        dateFilter = "DATE(date) = CURDATE()";
        break;
      case "weekly":
        dateFilter = "YEARWEEK(date) = YEARWEEK(CURDATE())";
        break;
      case "monthly":
        dateFilter =
          "YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())";
        break;
      default:
        dateFilter = "MONTH(date) = MONTH(CURDATE())";
    }

    const query = `
      SELECT 
        category,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = ? 
        AND type = 'expense' 
        AND ${dateFilter}
      GROUP BY category
      ORDER BY total DESC
    `;

    const [results] = await db.execute(query, [userId]);

    const categories = results.map((cat) => ({
      name: cat.category || "Other",
      value: parseFloat(cat.total),
    }));

    res.json({ categories });
  } catch (error) {
    console.error("Error getting expenses by category:", error);
    res.status(500).json({ message: "Error getting category data" });
  }
};
