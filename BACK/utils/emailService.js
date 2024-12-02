const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `MoneyUp <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - MoneyUp",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6B46C1;">Welcome to MoneyUp!</h1>
        <p>Thank you for signing up. Please verify your email address to get started.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #6B46C1; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666;">If the button doesn't work, click here: <a href="${verificationUrl}" style="color: #6B46C1;">${verificationUrl}</a></p>
        <p style="color: #666;">This link will expire in 24 hours.</p>
        <p style="color: #666;">If you didn't create an account with MoneyUp, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Function to send verification code email
exports.sendVerificationCodeEmail = async (email, code) => {
  const mailOptions = {
    from: `MoneyUp <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code - MoneyUp",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6B46C1;">Email Verification Code</h1>
          <p>Your verification code is:</p>
          <h2 style="font-size: 24px; color: #6B46C1;">${code}</h2>
          <p>This code will expire in 30 minutes.</p>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification code email sent successfully");
  } catch (error) {
    console.error("Error sending verification code email:", error);
    throw new Error("Failed to send verification code email");
  }
};

exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `MoneyUp <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - MoneyUp",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6B46C1;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #6B46C1; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">If the button doesn't work, click here: <a href="${resetUrl}" style="color: #6B46C1;">${resetUrl}</a></p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #666;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Add a test function to verify email configuration
exports.testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (error) {
    console.error("Email service error:", error);
    return false;
  }
};
