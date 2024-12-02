const express = require("express");
const router = express.Router();
const { verifyPayPalPayment } = require("../controllers/paymentController");

// PayPal payment verification endpoint
router.post("/verify-paypal", verifyPayPalPayment);

module.exports = router;
