const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all categories
router.get("/", categoryController.getAll);

// Get categories by type (income/expense)
router.get("/type/:type", categoryController.getByType);

// Create a new category
router.post("/", categoryController.create);

// Get a specific category
router.get("/:id", categoryController.getById);

// Update a category
router.put("/:id", categoryController.update);

// Delete a category
router.delete("/:id", categoryController.delete);

module.exports = router;
