const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", transactionController.getAll);
router.post("/", transactionController.create);
router.put("/:id", transactionController.update);
router.delete("/:id", transactionController.delete);
router.get("/balance", authMiddleware, transactionController.getBalance);
router.get(
  "/income-history",
  authMiddleware,
  transactionController.getIncomeHistory
);
router.get("/last", authMiddleware, transactionController.getLastTransaction);
router.get(
  "/recent",
  authMiddleware,
  transactionController.getRecentTransactions
);

module.exports = router;
