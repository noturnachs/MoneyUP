const db = require("../config/database");

exports.create = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { amount, description, category_id, date } = req.body;
    const userId = req.user.id;

    // First, check the current balance (but don't prevent negative balance)
    const [balanceResult] = await conn.execute(
      `SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ?) -
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ?) as current_balance,
        (SELECT account_threshold FROM users WHERE user_id = ?) as threshold`,
      [userId, userId, userId]
    );

    const currentBalance = parseFloat(balanceResult[0].current_balance);
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

    // Insert the expense
    const [result] = await conn.execute(
      `INSERT INTO expenses (user_id, amount, description, category_id, date) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, amount, description, category_id, date]
    );

    await conn.commit();

    // Fetch the created expense with category name
    const [expense] = await db.execute(
      `SELECT e.*, c.name as category_name 
       FROM expenses e 
       LEFT JOIN categories c ON e.category_id = c.category_id 
       WHERE e.expense_id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      expense: expense[0],
      warning,
      newBalance: balanceAfterExpense,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error creating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  } finally {
    conn.release();
  }
};

exports.getAll = async (req, res) => {
  try {
    const [expenses] = await db.execute(
      `SELECT e.*, c.name as category_name 
       FROM expenses e 
       LEFT JOIN categories c ON e.category_id = c.category_id 
       WHERE e.user_id = ? 
       ORDER BY e.date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      expenses,
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
    const [expenses] = await db.execute(
      `SELECT 
        e.expense_id as id,
        e.amount,
        e.description,
        e.date,
        c.name as category_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.category_id
       WHERE e.user_id = ?
       ORDER BY e.date DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Error fetching recent expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent expenses",
    });
  }
};

exports.getTotal = async (req, res) => {
  try {
    const [result] = await db.execute(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?",
      [req.user.id]
    );

    res.json({
      success: true,
      total: parseFloat(result[0].total),
    });
  } catch (error) {
    console.error("Error getting total expenses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching total expenses",
    });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const [results] = await db.execute(
      `
      SELECT 
        c.name as category,
        COALESCE(SUM(e.amount), 0) as amount
      FROM categories c
      LEFT JOIN expenses e ON c.category_id = e.category_id 
        AND e.user_id = ?
      WHERE c.type = 'expense'
      GROUP BY c.category_id, c.name
      HAVING amount > 0
      ORDER BY amount DESC
    `,
      [req.user.id]
    );

    res.json({
      success: true,
      categories: results.map((row) => ({
        category: row.category,
        amount: parseFloat(row.amount),
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
