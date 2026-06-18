require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const nodemailer = require("nodemailer");
const path = require("path");

connectDB();

// Route Imports
const userRoutes = require("./routes/userRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const goalRoutes = require("./routes/goalRoutes");
const loanRoutes = require("./routes/loanRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const financeRoutes = require("./routes/financeRoutes");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/finance", financeRoutes);

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Professional OTP Email Template
const generateOTPEmail = (otp) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .otp-container { background-color: #ffffff; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .otp-code { font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 3px; }
        .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
        .button { background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Finance Tracker</h1>
    </div>
    <div class="content">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Please use the following OTP to verify your identity:</p>
        
        <div class="otp-container">
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email or contact support if you have questions.</p>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Finance Tracker. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Budget Alert Email Template
const generateBudgetAlertEmail = (category, percentage, month) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .alert-container { background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .alert-title { color: #ef4444; font-size: 24px; margin-bottom: 15px; }
        .progress-container { height: 20px; background-color: #e5e7eb; border-radius: 10px; margin: 15px 0; overflow: hidden; }
        .progress-bar { height: 100%; background-color: #ef4444; width: ${percentage}%; }
        .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
        .button { background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Budget Alert</h1>
    </div>
    <div class="content">
        <div class="alert-container">
            <div class="alert-title">Budget Exceeded Warning</div>
            <p>Your spending in the <strong>${category}</strong> category has reached <strong>${percentage}%</strong> of your total income for ${month}.</p>
            
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
            
            <p>This is significantly higher than your budget allocation. Consider reviewing your expenses in this category.</p>
            
           
        </div>
        
        <div class="footer">
            <p>To adjust your budget preferences, visit your account settings.</p>
            <p>© ${new Date().getFullYear()} Finance Tracker. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Route to send OTP email
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  const mailOptions = {
    from: "Finance Tracker <citycommuteoperator@gmail.com>",
    to: email,
    subject: "Your Password Reset OTP",
    html: generateOTPEmail(otp),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// Route to send budget alert
app.post("/api/send-budget-alert", async (req, res) => {
  const { email, category, percentage, month } = req.body;

  if (!email || !category || !percentage || !month) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const mailOptions = {
    from: "Finance Tracker Alerts <citycommuteoperator@gmail.com>",
    to: email,
    subject: `Budget Alert: ${category} spending at ${percentage}%`,
    html: generateBudgetAlertEmail(category, percentage, month),
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Budget alert sent successfully",
    });
  } catch (error) {
    console.error("Error sending budget alert:", error);
    res.status(500).json({ error: "Failed to send budget alert." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
