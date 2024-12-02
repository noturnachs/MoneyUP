const paypal = require("@paypal/checkout-server-sdk");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");

// PayPal configuration
function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Use sandbox environment for development, production for live
  const environment =
    process.env.NODE_ENV === "production"
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);

  return new paypal.core.PayPalHttpClient(environment);
}

const verifyPayPalPayment = async (req, res) => {
  const client = await db.getConnection();

  try {
    await client.query("BEGIN");

    const { orderID, registrationData, paymentDetails } = req.body;
    console.log("Payment Details:", paymentDetails);

    // Verify the payment details
    if (
      !paymentDetails ||
      !paymentDetails.purchase_units ||
      !paymentDetails.purchase_units[0]
    ) {
      throw new Error("Invalid payment details");
    }

    const paymentStatus = paymentDetails.status;
    if (paymentStatus !== "COMPLETED") {
      throw new Error(`Payment not completed. Status: ${paymentStatus}`);
    }

    const amount = paymentDetails.purchase_units[0].amount.value;

    let userId = req.user?.id;

    // If no authenticated user, create a new user account
    if (!userId && registrationData) {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24);

      const hashedPassword = await bcrypt.hash(registrationData.password, 10);
      const fullName =
        `${registrationData.firstName} ${registrationData.lastName}`.trim();

      const {
        rows: [newUser],
      } = await client.query(
        `INSERT INTO users (
          email,
          password,
          username,
          first_name,
          last_name,
          name,
          verification_token,
          verification_token_expires
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING user_id, email`,
        [
          registrationData.email,
          hashedPassword,
          registrationData.username,
          registrationData.firstName,
          registrationData.lastName,
          fullName,
          verificationToken,
          tokenExpires,
        ]
      );

      userId = newUser.user_id;

      // Send verification email
      await sendVerificationEmail(registrationData.email, verificationToken);
    }

    if (!userId) {
      throw new Error("No user ID available");
    }

    // Record payment
    const {
      rows: [payment],
    } = await client.query(
      `INSERT INTO payments (
        user_id,
        amount,
        payment_method,
        external_payment_id,
        status,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING payment_id`,
      [
        userId,
        amount,
        "paypal",
        orderID,
        "completed",
        JSON.stringify(paymentDetails),
      ]
    );

    // Update subscription
    const {
      rows: [subscription],
    } = await client.query(
      `INSERT INTO subscriptions (
        user_id,
        tier,
        start_date,
        end_date,
        is_active
      ) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month', true)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        tier = 'pro',
        start_date = CURRENT_TIMESTAMP,
        end_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [userId, "pro"]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and subscription updated. Please check your email to verify your account.",
      data: {
        userId,
        paymentId: payment.payment_id,
        subscriptionId: subscription.id,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment verification error:", error);

    return res.status(400).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  verifyPayPalPayment,
};
