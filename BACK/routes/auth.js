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
router.get("/check-availability", authController.checkAvailability);
router.post("/check-availability", authController.checkAvailability);

// Add new threshold routes
router.post("/threshold", authMiddleware, authController.updateThreshold);
router.get("/threshold", authMiddleware, authController.getThreshold);

// Add these new routes
router.get("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post(
  "/verify-email-change",
  authMiddleware,
  authController.verifyEmailChange
);
router.post(
  "/confirm-email-change",
  authMiddleware,
  authController.confirmEmailChange
);

module.exports = router;
