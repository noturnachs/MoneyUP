const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/summary", analyticsController.getSummary);
router.get("/expenses-by-category", analyticsController.getExpensesByCategory);
router.get("/income-vs-expenses", analyticsController.getIncomeVsExpenses);
router.get("/insights", analyticsController.getInsights);

module.exports = router;
