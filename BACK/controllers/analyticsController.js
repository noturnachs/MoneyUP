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

exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current month's expenses by category
    const currentMonthQuery = `
      SELECT 
        c.name as category,
        COALESCE(SUM(e.amount), 0) as amount
      FROM categories c
      LEFT JOIN expenses e ON c.category_id = e.category_id 
        AND e.user_id = ?
        AND YEAR(e.date) = YEAR(CURDATE())
        AND MONTH(e.date) = MONTH(CURDATE())
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING amount > 0
    `;

    // Get last month's expenses by category
    const lastMonthQuery = `
      SELECT 
        c.name as category,
        COALESCE(SUM(e.amount), 0) as amount
      FROM categories c
      LEFT JOIN expenses e ON c.category_id = e.category_id 
        AND e.user_id = ?
        AND YEAR(e.date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(e.date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING amount > 0
    `;

    // Get average monthly expenses by category for last 6 months
    const avgMonthlyQuery = `
      SELECT 
        c.name as category,
        COALESCE(AVG(monthly_amount), 0) as avg_amount
      FROM categories c
      LEFT JOIN (
        SELECT 
          category_id,
          YEAR(date) as year,
          MONTH(date) as month,
          SUM(amount) as monthly_amount
        FROM expenses
        WHERE user_id = ?
          AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY category_id, YEAR(date), MONTH(date)
      ) monthly ON c.category_id = monthly.category_id
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING avg_amount > 0
    `;

    // Get unusual transactions (>50% above category average)
    const unusualTransactionsQuery = `
      SELECT 
        e.description,
        e.amount,
        c.name as category,
        e.date
      FROM expenses e
      JOIN categories c ON e.category_id = c.category_id
      WHERE e.user_id = ?
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND e.amount > (
          SELECT AVG(amount) * 1.5
          FROM expenses e2
          WHERE e2.category_id = e.category_id
            AND e2.user_id = ?
            AND e2.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        )
      ORDER BY e.amount DESC
      LIMIT 5
    `;

    const [currentMonth] = await db.execute(currentMonthQuery, [userId]);
    const [lastMonth] = await db.execute(lastMonthQuery, [userId]);
    const [avgMonthly] = await db.execute(avgMonthlyQuery, [userId]);
    const [unusualTransactions] = await db.execute(unusualTransactionsQuery, [
      userId,
      userId,
    ]);

    // Generate monthly comparison insights
    const monthlyComparison = [];
    currentMonth.forEach((current) => {
      const lastMonthCategory = lastMonth.find(
        (last) => last.category === current.category
      );
      if (lastMonthCategory) {
        const difference =
          ((current.amount - lastMonthCategory.amount) /
            lastMonthCategory.amount) *
          100;
        if (Math.abs(difference) >= 10) {
          // Only show significant changes (>=10%)
          monthlyComparison.push({
            type: difference > 0 ? "increase" : "decrease",
            message: `${current.category} spending ${
              difference > 0 ? "increased" : "decreased"
            } by ${Math.abs(difference).toFixed(0)}%`,
          });
        }
      }
    });

    // If no monthly comparisons were found
    if (monthlyComparison.length === 0) {
      monthlyComparison.push({
        type: "neutral",
        message: "No significant changes from last month",
      });
    }

    // Generate category insights
    const categoryInsights = [];
    currentMonth.forEach((current) => {
      const avgCategory = avgMonthly.find(
        (avg) => avg.category === current.category
      );
      if (avgCategory) {
        const difference =
          ((current.amount - avgCategory.avg_amount) / avgCategory.avg_amount) *
          100;
        let status = "normal";
        if (difference >= 20) status = "high";
        if (difference <= -20) status = "low";

        if (status !== "normal") {
          categoryInsights.push({
            status,
            message: `${current.category} spending is ${
              status === "high" ? "higher" : "lower"
            } than usual`,
          });
        }
      }
    });

    // If no category insights were found
    if (categoryInsights.length === 0) {
      categoryInsights.push({
        status: "normal",
        message: "All categories are within normal spending ranges",
      });
    }

    // Format unusual spending insights
    const unusualSpending = unusualTransactions.map((transaction) => ({
      message: `Unusual ${
        transaction.category
      } expense: ${new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(transaction.amount)} on ${new Date(
        transaction.date
      ).toLocaleDateString()}`,
    }));

    // If no unusual transactions were found
    if (unusualSpending.length === 0) {
      unusualSpending.push({
        message: "No unusual spending patterns detected",
      });
    }

    res.json({
      success: true,
      monthlyComparison,
      categoryInsights,
      unusualSpending,
    });
  } catch (error) {
    console.error("Error getting insights:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching insights",
    });
  }
};
