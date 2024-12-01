const db = require("../config/database");

exports.create = async (req, res) => {
  const client = await db.getConnection();

  try {
    await client.query("BEGIN");

    const { amount, description, category_id } = req.body;
    const userId = req.user.id;
    const now = new Date();

    // Get current balance and threshold
    const { rows: balanceResult } = await client.query(
      `SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = $1) -
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = $1) as current_balance,
        (SELECT account_threshold FROM users WHERE user_id = $1) as threshold`,
      [userId]
    );

    if (!balanceResult || balanceResult.length === 0) {
      throw new Error("Could not retrieve balance information");
    }

    const currentBalance = parseFloat(balanceResult[0].current_balance || 0);
    const expenseAmount = parseFloat(amount);
    const threshold = balanceResult[0].threshold;

    // Calculate new balance after expense
    const balanceAfterExpense = currentBalance - expenseAmount;
    let warning = null;

    if (currentBalance < expenseAmount) {
      warning = "Warning: This expense will result in a negative balance";
    } else if (threshold && balanceAfterExpense <= threshold) {
      warning = `Warning: This expense will bring your balance close to or below your set threshold of ₱${threshold.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )}`;
    }

    // Insert the expense with both date fields
    const {
      rows: [expense],
    } = await client.query(
      `INSERT INTO expenses (user_id, amount, description, category_id, date, created_at) 
       VALUES ($1, $2, $3, $4, $5, $5) 
       RETURNING expense_id`,
      [userId, amount, description, category_id, now]
    );

    // Fetch the created expense with category name
    const {
      rows: [expenseWithCategory],
    } = await client.query(
      `SELECT e.*, c.name as category_name 
       FROM expenses e 
       LEFT JOIN categories c ON e.category_id = c.category_id 
       WHERE e.expense_id = $1`,
      [expense.expense_id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      expense: {
        ...expenseWithCategory,
        amount: parseFloat(expenseWithCategory.amount),
        created_at: expenseWithCategory.created_at.toISOString(),
        date: expenseWithCategory.date.toISOString(),
      },
      warning,
      newBalance: balanceAfterExpense,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

exports.getAll = async (req, res) => {
  try {
    const { rows } = await db.execute(
      `SELECT e.*, c.name as category_name 
       FROM expenses e 
       LEFT JOIN categories c ON e.category_id = c.category_id 
       WHERE e.user_id = $1 
       ORDER BY e.date DESC, e.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      expenses: rows.map((expense) => ({
        ...expense,
        amount: parseFloat(expense.amount),
        created_at: new Date(expense.created_at).toISOString(),
        date: new Date(expense.date).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
};

exports.getMonthlyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.getMonthlyExpenses(req.user.id);
    res.json({
      success: true,
      monthlyExpenses: expenses.map((exp) => ({
        month: exp.month,
        total: parseFloat(exp.total),
      })),
    });
  } catch (error) {
    console.error("Error getting monthly expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get monthly expenses",
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Expense.getExpensesByCategory(
      req.user.id,
      req.query.timeframe
    );
    res.json({
      success: true,
      categories: categories.map((cat) => ({
        ...cat,
        total: parseFloat(cat.total),
      })),
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};

exports.getRecent = async (req, res) => {
  try {
    const { rows } = await db.execute(
      `SELECT 
        e.expense_id as id,
        e.amount,
        e.description,
        e.created_at,
        c.name as category_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.category_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      success: true,
      expenses: rows.map((expense) => ({
        ...expense,
        amount: parseFloat(expense.amount),
      })),
    });
  } catch (error) {
    console.error("Error fetching recent expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent expenses",
      error: error.message,
    });
  }
};

exports.getTotal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE user_id = $1`;

    let params = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      params.push(endDate);
    }

    const { rows } = await db.execute(query, params);

    res.json({
      success: true,
      total: parseFloat(rows[0].total),
    });
  } catch (error) {
    console.error("Error getting total expenses:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving total expenses",
      error: error.message,
    });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT 
        c.name as category,
        COALESCE(SUM(e.amount), 0) as amount,
        COUNT(e.expense_id) as count
      FROM categories c
      LEFT JOIN expenses e ON c.category_id = e.category_id 
        AND e.user_id = $1
      WHERE c.user_id = $1 
        AND c.type = 'expense'`;

    const params = [req.user.id];
    let paramIndex = 1;

    if (startDate) {
      paramIndex++;
      query += ` AND e.date >= $${paramIndex}`;
      params.push(startDate);
    }

    if (endDate) {
      paramIndex++;
      query += ` AND e.date <= $${paramIndex}`;
      params.push(endDate);
    }

    query += ` GROUP BY c.category_id, c.name
               HAVING COALESCE(SUM(e.amount), 0) > 0
               ORDER BY amount DESC`;

    const { rows } = await db.execute(query, params);

    // Format the response to match the frontend expectations
    res.json({
      success: true,
      categories: rows.map((row) => ({
        category: row.category,
        amount: parseFloat(row.amount || 0),
        count: parseInt(row.count || 0),
      })),
    });
  } catch (error) {
    console.error("Error getting expenses by category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get expenses by category",
      error: error.message,
    });
  }
};
