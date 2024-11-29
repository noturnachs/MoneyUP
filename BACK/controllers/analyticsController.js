const db = require("../config/database");

exports.getSummary = async (req, res) => {
  try {
    const { timeframe, start_date, end_date } = req.query;
    const userId = req.user.id;

    let dateFilter = "";
    let params = [userId, userId];

    if (timeframe === "custom" && start_date && end_date) {
      dateFilter = "AND date BETWEEN ? AND ?";
      params = [userId, start_date, end_date, userId, start_date, end_date];
    } else {
      switch (timeframe) {
        case "daily":
          dateFilter = "AND DATE(date) = CURDATE()";
          break;
        case "weekly":
          dateFilter = "AND YEARWEEK(date) = YEARWEEK(CURDATE())";
          break;
        case "monthly":
          dateFilter =
            "AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())";
          break;
        case "yearly":
          dateFilter = "AND YEAR(date) = YEAR(CURDATE())";
          break;
      }
    }

    // Just read from income and expenses tables
    const query = `
      SELECT 
        (
          SELECT COALESCE(SUM(amount), 0) 
          FROM income 
          WHERE user_id = ? ${dateFilter}
        ) as totalIncome,
        (
          SELECT COALESCE(SUM(amount), 0) 
          FROM expenses 
          WHERE user_id = ? ${dateFilter}
        ) as totalExpenses
    `;

    const [results] = await db.execute(query, params);

    // Calculate derived values
    const totalIncome = parseFloat(results[0].totalIncome);
    const totalExpenses = parseFloat(results[0].totalExpenses);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
      },
    });
  } catch (error) {
    console.error("Error getting analytics summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics data",
    });
  }
};

exports.getExpensesByCategory = async (req, res) => {
  try {
    const { timeframe, start_date, end_date } = req.query;
    const userId = req.user.id;

    let dateFilter = "";
    let params = [userId];

    if (timeframe === "custom" && start_date && end_date) {
      dateFilter = "AND e.date BETWEEN ? AND ?";
      params.push(start_date, end_date);
    } else {
      switch (timeframe) {
        case "daily":
          dateFilter = "AND DATE(e.date) = CURDATE()";
          break;
        case "weekly":
          dateFilter = "AND YEARWEEK(e.date) = YEARWEEK(CURDATE())";
          break;
        case "monthly":
          dateFilter =
            "AND YEAR(e.date) = YEAR(CURDATE()) AND MONTH(e.date) = MONTH(CURDATE())";
          break;
        case "yearly":
          dateFilter = "AND YEAR(e.date) = YEAR(CURDATE())";
          break;
      }
    }

    // Read expenses grouped by category
    const query = `
      SELECT 
        c.name as category,
        COALESCE(SUM(e.amount), 0) as amount
      FROM categories c
      LEFT JOIN expenses e ON c.category_id = e.category_id 
        AND e.user_id = ? ${dateFilter}
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING amount > 0
      ORDER BY amount DESC
    `;

    const [categories] = await db.execute(query, params);

    res.json({
      success: true,
      categories: categories.map((cat) => ({
        category: cat.category,
        amount: parseFloat(cat.amount),
      })),
    });
  } catch (error) {
    console.error("Error getting expenses by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category data",
    });
  }
};

exports.getIncomeVsExpenses = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const userId = req.user.id;

    let dateFormat, groupBy;
    switch (timeframe) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        groupBy = "DATE(date)";
        break;
      case "weekly":
        dateFormat = "%Y-W%u";
        groupBy = "YEARWEEK(date)";
        break;
      case "monthly":
        dateFormat = "%Y-%m";
        groupBy = 'DATE_FORMAT(date, "%Y-%m")';
        break;
      case "yearly":
        dateFormat = "%Y";
        groupBy = "YEAR(date)";
        break;
      default:
        dateFormat = "%Y-%m";
        groupBy = 'DATE_FORMAT(date, "%Y-%m")';
    }

    const query = `
      SELECT 
        period,
        COALESCE(SUM(income), 0) as income,
        COALESCE(SUM(expenses), 0) as expenses
      FROM (
        SELECT 
          DATE_FORMAT(date, ?) as period,
          amount as income,
          0 as expenses
        FROM income
        WHERE user_id = ?
        UNION ALL
        SELECT 
          DATE_FORMAT(date, ?) as period,
          0 as income,
          amount as expenses
        FROM expenses
        WHERE user_id = ?
      ) combined
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `;

    const [results] = await db.execute(query, [
      dateFormat,
      userId,
      dateFormat,
      userId,
    ]);

    res.json({
      success: true,
      data: results.map((row) => ({
        period: row.period,
        income: parseFloat(row.income),
        expenses: parseFloat(row.expenses),
      })),
    });
  } catch (error) {
    console.error("Error getting income vs expenses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching comparison data",
    });
  }
};
