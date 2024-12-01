const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { checkFeatureAccess } = require("../middleware/checkFeatureAccess");
const analyticsController = require("../controllers/analyticsController");

// Basic analytics (available to all tiers)
router.get("/basic", auth, analyticsController.getBasicAnalytics);

// Advanced analytics (pro feature)
router.get(
  "/advanced",
  auth,
  checkFeatureAccess("advanced_analytics"),
  analyticsController.getAdvancedAnalytics
);

// Custom date range analytics (pro feature)
router.post(
  "/custom-range",
  auth,
  checkFeatureAccess("advanced_analytics"),
  analyticsController.getCustomRangeAnalytics
);

// Export analytics data (pro feature)
router.get(
  "/export",
  auth,
  checkFeatureAccess("data_export"),
  analyticsController.exportAnalytics
);

module.exports = router;
