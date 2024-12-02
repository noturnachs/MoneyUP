const Subscription = require("../models/Subscription.js");

const subscriptionController = {
  getSubscription: async (req, res) => {
    try {
      const userId = req.user.id;

      // First check if subscription exists
      let subscription = await Subscription.getSubscriptionStatus(userId);

      // If no subscription exists, create one with free tier
      if (!subscription) {
        subscription = await Subscription.create(userId, "free");

        // Get the full status after creation
        subscription = await Subscription.getSubscriptionStatus(userId);
      }

      res.json(subscription);
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({
        message: "Error fetching subscription",
        error: error.message,
      });
    }
  },

  updateSubscription: async (req, res) => {
    try {
      const userId = req.user.id;
      const { tier } = req.body;

      if (!["free", "pro", "enterprise"].includes(tier)) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }

      const updatedSubscription = await Subscription.updateTier(userId, tier);
      res.json(updatedSubscription);
    } catch (error) {
      res.status(500).json({
        message: "Error updating subscription",
        error: error.message,
      });
    }
  },

  checkFeatureAccess: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { feature } = req.params;

      const hasAccess = await Subscription.hasAccess(userId, feature);
      res.json({ hasAccess });
    } catch (error) {
      res.status(500).json({
        message: "Error checking feature access",
        error: error.message,
      });
    }
  },
};

module.exports = subscriptionController;
