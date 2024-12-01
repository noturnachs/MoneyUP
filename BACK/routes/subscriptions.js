const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.js");
const subscriptionController = require("../controllers/subscriptionController.js");

router.get("/", auth, subscriptionController.getSubscription);
router.put("/", auth, subscriptionController.updateSubscription);
router.get("/access/:feature", auth, subscriptionController.checkFeatureAccess);

module.exports = router;
