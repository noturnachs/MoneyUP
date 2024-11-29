const Transaction = require("../models/Transaction");
const db = require("../config/database");

exports.getAll = async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.user.id);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const transactionData = { ...req.body, user_id: req.user.id };
    const result = await Transaction.create(transactionData);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await Transaction.update(req.params.id, {
      ...req.body,
      user_id: req.user.id,
    });
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await Transaction.delete(req.params.id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get latest transaction for current balance
    const currentBalanceQuery = `
      SELECT current_balance 
      FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC, id DESC 
      LIMIT 1
    `;

    // Get other balance information
    const balanceQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE 
          WHEN type = 'expense' AND MONTH(date) = MONTH(CURRENT_DATE()) 
          THEN amount ELSE 0 END), 0) as currentMonthExpenses,
        COALESCE(SUM(CASE 
          WHEN type = 'expense' AND MONTH(date) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) 
          THEN amount ELSE 0 END), 0) as previousMonthExpenses
      FROM transactions 
      WHERE user_id = ?
    `;

    const [currentBalanceResult] = await db.execute(currentBalanceQuery, [
      userId,
    ]);
    const [balanceResult] = await db.execute(balanceQuery, [userId]);

    const currentBalance =
      currentBalanceResult.length > 0
        ? parseFloat(currentBalanceResult[0].current_balance)
        : 0;
    const result = balanceResult[0];

    // Calculate percentage change for expenses
    const expenseChange = calculatePercentageChange(
      result.previousMonthExpenses,
      result.currentMonthExpenses
    );

    res.json({
      success: true,
      totalBalance: parseFloat(result.totalIncome),
      currentBalance: currentBalance,
      monthlyExpenses: parseFloat(result.currentMonthExpenses),
      expenseChange,
    });
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({ success: false, message: "Error getting balance" });
  }
};

exports.getIncomeHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        id,
        amount,
        description,
        date
      FROM transactions 
      WHERE user_id = ? AND type = 'income'
      ORDER BY date DESC
      LIMIT 5
    `;

    const [incomeHistory] = await db.execute(query, [userId]);

    res.json({
      success: true,
      incomeHistory,
    });
  } catch (error) {
    console.error("Error getting income history:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting income history" });
  }
};

// Helper function to calculate percentage change
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;
    const userId = req.user.id;

    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: "Type, amount, and description are required",
      });
    }

    const result = await Transaction.create({
      user_id: userId,
      type,
      amount,
      description,
      category,
      date: date || new Date(),
    });

    if (result.affectedRows > 0) {
      // Get the updated transaction with current balance
      const [newTransaction] = await db.execute(
        `SELECT * FROM transactions WHERE id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        transaction: {
          ...newTransaction[0],
          amount: parseFloat(newTransaction[0].amount),
          current_balance: parseFloat(newTransaction[0].current_balance),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create transaction",
      });
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

exports.getLastTransaction = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the last transaction with previous balance
    const query = `
      WITH RankedTransactions AS (
        SELECT 
          id,
          type,
          amount,
          description,
          date,
          ROW_NUMBER() OVER (ORDER BY date DESC, id DESC) as rn
        FROM transactions 
        WHERE user_id = ?
      )
      SELECT 
        t.*,
        COALESCE(
          (SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
           FROM transactions 
           WHERE user_id = ? 
           AND (date < t.date OR (date = t.date AND id <= t.id))
          ), 0
        ) as balance_after,
        COALESCE(
          (SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
           FROM transactions 
           WHERE user_id = ? 
           AND (date < t.date OR (date = t.date AND id < t.id))
          ), 0
        ) as balance_before
      FROM RankedTransactions t
      WHERE rn = 1
    `;

    const [transactions] = await db.execute(query, [userId, userId, userId]);

    if (transactions.length > 0) {
      const transaction = transactions[0];
      const change =
        transaction.type === "income"
          ? parseFloat(transaction.amount)
          : -parseFloat(transaction.amount);

      res.json({
        success: true,
        transaction: {
          ...transaction,
          change,
          balance_after: parseFloat(transaction.balance_after),
          balance_before: parseFloat(transaction.balance_before),
        },
      });
    } else {
      res.json({
        success: true,
        transaction: null,
      });
    }
  } catch (error) {
    console.error("Error getting last transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error getting last transaction",
    });
  }
};

exports.getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        id,
        type,
        amount,
        description,
        category,
        date
      FROM transactions 
      WHERE user_id = ?
      ORDER BY date DESC, id DESC
      LIMIT 10
    `;

    const [transactions] = await db.execute(query, [userId]);

    res.json({
      success: true,
      transactions: transactions.map((transaction) => ({
        ...transaction,
        amount: parseFloat(transaction.amount),
      })),
    });
  } catch (error) {
    console.error("Error getting recent transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recent transactions",
    });
  }
};
