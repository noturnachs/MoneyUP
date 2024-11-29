const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { validateUserMiddleware } = require("../middleware/validate");

router.post("/login", authController.login);
router.post("/register", validateUserMiddleware, authController.register);
router.get("/verify", authMiddleware, authController.verifyToken);
router.put("/profile", authMiddleware, authController.updateProfile);
router.delete("/delete-account", authMiddleware, authController.deleteAccount);
router.get("/me", authMiddleware, authController.getMe);
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/check-availability", authController.checkAvailability);

module.exports = router;
