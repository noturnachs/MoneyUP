const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", expenseController.getAll);
router.post("/", expenseController.create);
router.get("/categories", expenseController.getCategories);
router.get("/monthly", expenseController.getMonthlyExpenses);
router.get("/recent", expenseController.getRecent);
router.get("/total", expenseController.getTotal);
router.get("/by-category", expenseController.getByCategory);

module.exports = router;
