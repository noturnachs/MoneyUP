const express = require("express");
const router = express.Router();
const {
  verifyPayPalPayment,
  verifyPayPalUpgrade,
} = require("../controllers/paymentController");

// PayPal payment verification endpoint
router.post("/verify-paypal", verifyPayPalPayment);
router.post("/verify-paypal-upgrade", verifyPayPalUpgrade);

module.exports = router;
