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
          dateFilter = "AND DATE(date) = CURRENT_DATE";
          break;
        case "weekly":
          dateFilter =
            "AND DATE_PART('week', date) = DATE_PART('week', CURRENT_DATE)";
          break;
        case "monthly":
          dateFilter =
            "AND DATE_PART('year', date) = DATE_PART('year', CURRENT_DATE) AND DATE_PART('month', date) = DATE_PART('month', CURRENT_DATE)";
          break;
        case "yearly":
          dateFilter =
            "AND DATE_PART('year', date) = DATE_PART('year', CURRENT_DATE)";
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
        category: cat.category || "Uncategorized",
        amount: parseFloat(cat.amount) || 0,
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
    const userId = req.user.id;
    const { period = "month" } = req.query;

    let timeFormat;
    switch (period) {
      case "week":
        timeFormat = "YYYY-IW";
        break;
      case "month":
        timeFormat = "YYYY-MM";
        break;
      case "year":
        timeFormat = "YYYY";
        break;
      default:
        timeFormat = "YYYY-MM";
    }

    const query = `
      WITH time_series AS (
        SELECT 
          to_char(date_trunc($1, dd)::date, $2) as time_period
        FROM generate_series(
          date_trunc($1, current_date - interval '6 months'),
          current_date,
          interval '1 ${period}'
        ) dd
      ),
      income_data AS (
        SELECT 
          to_char(date_trunc($1, date)::date, $2) as time_period,
          COALESCE(SUM(amount), 0) as total_income
        FROM income
        WHERE user_id = $3
        GROUP BY time_period
      ),
      expense_data AS (
        SELECT 
          to_char(date_trunc($1, date)::date, $2) as time_period,
          COALESCE(SUM(amount), 0) as total_expenses
        FROM expenses
        WHERE user_id = $3
        GROUP BY time_period
      )
      SELECT 
        ts.time_period,
        COALESCE(i.total_income, 0) as income,
        COALESCE(e.total_expenses, 0) as expenses
      FROM time_series ts
      LEFT JOIN income_data i ON ts.time_period = i.time_period
      LEFT JOIN expense_data e ON ts.time_period = e.time_period
      ORDER BY ts.time_period`;

    const { rows } = await db.execute(query, [period, timeFormat, userId]);

    res.json({
      success: true,
      data: rows.map((row) => ({
        period: row.time_period,
        income: parseFloat(row.income),
        expenses: parseFloat(row.expenses),
      })),
    });
  } catch (error) {
    console.error("Error getting income vs expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get income vs expenses comparison",
      error: error.message,
    });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current and previous month's expenses with categories
    const query = `
      WITH current_month AS (
        SELECT 
          c.name as category_name,
          COALESCE(SUM(e.amount), 0) as amount
        FROM categories c
        LEFT JOIN expenses e ON 
          c.category_id = e.category_id 
          AND e.date >= date_trunc('month', current_date)
          AND e.date < date_trunc('month', current_date + interval '1 month')
          AND e.user_id = $1
        WHERE c.type = 'expense' AND c.user_id = $1
        GROUP BY c.category_id, c.name
      ),
      previous_month AS (
        SELECT 
          c.name as category_name,
          COALESCE(SUM(e.amount), 0) as amount
        FROM categories c
        LEFT JOIN expenses e ON 
          c.category_id = e.category_id 
          AND e.date >= date_trunc('month', current_date - interval '1 month')
          AND e.date < date_trunc('month', current_date)
          AND e.user_id = $1
        WHERE c.type = 'expense' AND c.user_id = $1
        GROUP BY c.category_id, c.name
      ),
      comparison AS (
        SELECT 
          cm.category_name,
          cm.amount as current_amount,
          pm.amount as previous_amount,
          CASE 
            WHEN pm.amount > 0 THEN 
              ((cm.amount - pm.amount) / pm.amount * 100)
            WHEN cm.amount > 0 THEN 
              100
            ELSE 
              0
          END as change_percentage
        FROM current_month cm
        LEFT JOIN previous_month pm ON cm.category_name = pm.category_name
        WHERE cm.amount > 0 OR pm.amount > 0
      )
      SELECT * FROM comparison
      WHERE ABS(change_percentage) > 0
      ORDER BY ABS(change_percentage) DESC`;

    const { rows: categoryComparisons } = await db.execute(query, [userId]);

    // Process monthly comparison insights (focus on biggest changes)
    const monthlyComparison = categoryComparisons
      .map((cat) => ({
        type: cat.change_percentage > 0 ? "increase" : "decrease",
        message: `${cat.category_name} spending ${
          cat.change_percentage > 0 ? "increased" : "decreased"
        } by ${Math.abs(cat.change_percentage).toFixed(1)}% from last month`,
        percentage: cat.change_percentage,
      }))
      .slice(0, 3); // Top 3 changes

    // Process category insights (focus on spending patterns)
    const categoryInsights = categoryComparisons
      .map((cat) => {
        const currentAmount = parseFloat(cat.current_amount);
        const previousAmount = parseFloat(cat.previous_amount);

        if (currentAmount > previousAmount * 1.2) {
          // 20% increase
          return {
            status: "high",
            message: `Higher than usual spending in ${cat.category_name} this month`,
          };
        } else if (currentAmount < previousAmount * 0.8) {
          // 20% decrease
          return {
            status: "low",
            message: `Lower than usual spending in ${cat.category_name} this month`,
          };
        } else if (currentAmount > 0 && previousAmount === 0) {
          return {
            status: "new",
            message: `New spending in ${cat.category_name} category this month`,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 3);

    // Calculate unusual spending patterns (focus on significant deviations)
    const unusualSpending = categoryComparisons
      .filter((cat) => Math.abs(cat.change_percentage) > 50)
      .map((cat) => ({
        type: cat.change_percentage > 0 ? "increase" : "decrease",
        message: `${cat.category_name} spending is ${Math.abs(
          cat.change_percentage
        ).toFixed(1)}% ${
          cat.change_percentage > 0 ? "higher" : "lower"
        } than last month`,
        amount: parseFloat(cat.current_amount),
      }))
      .slice(0, 3);

    res.json({
      success: true,
      insights: {
        monthlyComparison:
          monthlyComparison.length > 0 ? monthlyComparison : null,
        categoryInsights: categoryInsights.length > 0 ? categoryInsights : null,
        unusualSpending: unusualSpending.length > 0 ? unusualSpending : null,
      },
    });
  } catch (error) {
    console.error("Error getting insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get spending insights",
      error: error.message,
    });
  }
};
