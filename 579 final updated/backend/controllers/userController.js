const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const Loan = require("../models/Loan");
const Notification = require("../models/Notification");
const FinanceProfile = require("../models/FinanceProfile");

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h", issuer: "fintrackpro", audience: "fintrackpro-web" });

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (typeof name !== "string" || name.trim().length < 1 || name.length > 80 ||
        typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        typeof password !== "string" || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: "Enter a valid name and email; password must be 12–128 characters" });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ message: "Authentication is not configured" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token: signToken(newUser._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string" || password.length > 128) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ message: "Authentication is not configured" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token: signToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const demoLogin = async (_req, res) => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ message: "Authentication is not configured" });
    }
    const now = new Date();
    const expiredDemos = await User.find({ isDemo: true, demoExpiresAt: { $lte: now } });
    for (const expired of expiredDemos) {
      await Promise.all([
        Expense.deleteMany({ _id: { $in: expired.expenses } }),
        Income.deleteMany({ _id: { $in: expired.income } }),
        Budget.deleteMany({ _id: { $in: expired.budget } }),
        Goal.deleteMany({ _id: { $in: expired.goal } }),
        Loan.deleteMany({ _id: { $in: expired.loan } }),
        Notification.deleteMany({ _id: { $in: expired.notification } }),
        FinanceProfile.deleteMany({ userId: expired._id }),
      ]);
      await expired.deleteOne();
    }

    const user = await User.create({
      name: "Demo User",
      email: `demo-${crypto.randomUUID()}@demo.invalid`,
      password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      isDemo: true,
      demoExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
    const [expense, income, budget, goal, loan, notification] = await Promise.all([
      Expense.create({ amount: 1850, category: "Food", description: "Sample demo expense" }),
      Income.create({ amount: 62000, source: "Salary", description: "Sample demo income" }),
      Budget.create({ category: "Food", amount: 9000, period: "monthly" }),
      Goal.create({ title: "Emergency fund", targetAmount: 100000, currentAmount: 25000 }),
      Loan.create({ lender: "Sample Bank", totalAmount: 20000, paidAmount: 5000, emiAmount: 1500 }),
      Notification.create({ type: "demo", message: "Welcome to your isolated demo workspace." }),
    ]);
    user.expenses.push(expense._id);
    user.income.push(income._id);
    user.budget.push(budget._id);
    user.goal.push(goal._id);
    user.loan.push(loan._id);
    user.notification.push(notification._id);
    await user.save();

    res.status(200).json({
      message: "Demo session created",
      user: { _id: user._id, name: user.name, email: user.email, isDemo: true },
      token: jwt.sign({ userId: user._id, isDemo: true }, process.env.JWT_SECRET, {
        expiresIn: "1h", issuer: "fintrackpro", audience: "fintrackpro-web",
      }),
    });
  } catch (error) {
    console.error("Demo session creation failed");
    res.status(500).json({ message: "Unable to start demo session" });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .populate("expenses")
      .populate("income")
      .populate("budget")
      .populate("goal")
      .populate("loan")
      .populate("notification");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      expenses: user.expenses,
      income: user.income,
      budget: user.budget,
      goal: user.goal,
      loan: user.loan,
      notification: user.notification,
    };

    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  signup,
  login,
  demoLogin,
  getSingleUser,
};
