const db = require("../config/database");

exports.getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const [expenses] = await db.execute(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
      [userId]
    );
    res.json({ success: true, expenses });
  } catch (error) {
    console.error("Error getting expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get expenses",
    });
  }
};

exports.create = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { amount, description, category } = req.body;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Insert into expenses table
    const [expenseResult] = await connection.execute(
      "INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)",
      [userId, amount, description, category]
    );

    // Get current balance from latest transaction
    const [latestTransaction] = await connection.execute(
      `SELECT current_balance FROM transactions 
       WHERE user_id = ? 
       ORDER BY date DESC, id DESC LIMIT 1`,
      [userId]
    );

    const currentBalance =
      latestTransaction.length > 0
        ? parseFloat(latestTransaction[0].current_balance)
        : 0;

    // Create corresponding transaction with updated current_balance
    await connection.execute(
      `INSERT INTO transactions 
       (id, user_id, type, amount, description, category, date, current_balance) 
       VALUES (?, ?, 'expense', ?, ?, ?, NOW(), ?)`,
      [
        expenseResult.insertId,
        userId,
        amount,
        description,
        category,
        currentBalance - parseFloat(amount),
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expenseId: expenseResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  } finally {
    connection.release();
  }
};

exports.update = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { amount, description, category } = req.body;
    const userId = req.user.id;

    const [result] = await connection.execute(
      `UPDATE expenses 
       SET amount = ?, description = ?, category = ?
       WHERE id = ? AND user_id = ?`,
      [amount, description, category, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({
      success: true,
      message: "Expense updated successfully",
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  } finally {
    connection.release();
  }
};

exports.getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const [categories] = await db.execute(
      "SELECT DISTINCT category FROM expenses WHERE user_id = ? AND category IS NOT NULL",
      [userId]
    );

    res.json({
      success: true,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};
