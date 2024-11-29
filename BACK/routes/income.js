const express = require("express");
const router = express.Router();
const incomeController = require("../controllers/incomeController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", incomeController.getAll);
router.post("/", incomeController.create);
router.delete("/:id", incomeController.delete);
router.get("/recent", incomeController.getRecent);
router.get("/total", incomeController.getTotal);

module.exports = router;
