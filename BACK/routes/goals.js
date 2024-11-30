const express = require("express");
const router = express.Router();
const GoalController = require("../controllers/goalController");
const auth = require("../middleware/auth");

router.use(auth); // Protect all goals routes

router.post("/", GoalController.createGoal);
router.get("/", GoalController.getGoals);
router.get("/primary", GoalController.getPrimaryGoal);
router.put("/:id", GoalController.updateGoal);
router.delete("/:id", GoalController.deleteGoal);
router.put("/:id/accomplish", GoalController.markAccomplished);

module.exports = router;
