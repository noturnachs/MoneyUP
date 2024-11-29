const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/verify", authMiddleware, authController.verifyToken);
router.put("/profile", authMiddleware, authController.updateProfile);
router.delete("/delete-account", authMiddleware, authController.deleteAccount);
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
