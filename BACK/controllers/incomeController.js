const Income = require("../models/Income");
const db = require("../config/database");

exports.getAll = async (req, res) => {
  try {
    const { rows: incomes } = await db.execute(
      `SELECT i.*, c.name as category_name 
       FROM income i 
       LEFT JOIN categories c ON i.category_id = c.category_id 
       WHERE i.user_id = $1 
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      incomes,
    });
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch income",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const incomeData = {
      user_id: req.user.id,
      amount: req.body.amount,
      description: req.body.description,
      date: req.body.date || new Date(),
      category_id: req.body.category_id || null,
    };

    if (!incomeData.user_id || !incomeData.amount || !incomeData.description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const income = await Income.create(incomeData);
    res.status(201).json({
      success: true,
      id: income.income_id,
      income,
      message: "Income created successfully",
    });
  } catch (error) {
    console.error("Error creating income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create income",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const deletedIncome = await Income.delete(req.params.id, req.user.id);
    if (!deletedIncome) {
      return res.status(404).json({
        success: false,
        message: "Income not found",
      });
    }

    res.json({
      success: true,
      message: "Income deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete income",
    });
  }
};

exports.getRecent = async (req, res) => {
  try {
    const { rows: incomes } = await db.execute(
      `SELECT 
        i.income_id as id,
        i.amount,
        i.description,
        i.created_at,
        c.name as category_name
       FROM income i
       LEFT JOIN categories c ON i.category_id = c.category_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      success: true,
      incomes,
    });
  } catch (error) {
    console.error("Error fetching recent income:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent income",
    });
  }
};

exports.getTotal = async (req, res) => {
  try {
    const { rows: result } = await db.execute(
      "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = $1",
      [req.user.id]
    );

    res.json({
      success: true,
      total: parseFloat(result[0].total),
    });
  } catch (error) {
    console.error("Error getting total income:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching total income",
    });
  }
};
