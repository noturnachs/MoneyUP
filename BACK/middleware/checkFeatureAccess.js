const Subscription = require("../models/Subscription");

const featuresByEndpoint = {
  // Analytics features
  "/api/analytics/advanced": "advanced_analytics",
  "/api/analytics/custom-reports": "custom_reports",

  // Expense features
  "/api/expenses/recurring": "recurring_expenses",
  "/api/expenses/export": "data_export",

  // Category features
  "/api/categories/custom": "custom_categories",

  // Goals features
  "/api/goals": "budget_goals",

  // History access
  "/api/expenses/history": "unlimited_history",
  "/api/income/history": "unlimited_history",
};

const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const hasAccess = await Subscription.hasAccess(userId, feature);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "This feature requires a higher subscription tier",
          requiredFeature: feature,
        });
      }

      next();
    } catch (error) {
      console.error("Feature access check error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking feature access",
        error: error.message,
      });
    }
  };
};

module.exports = {
  checkFeatureAccess,
  featuresByEndpoint,
};
