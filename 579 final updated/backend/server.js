require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const goalRoutes = require("./routes/goalRoutes");
const loanRoutes = require("./routes/loanRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const financeRoutes = require("./routes/financeRoutes");

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await connectDB();
    res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "unavailable", database: "disconnected" });
  }
});

app.use("/api", async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({ message: "Database unavailable" });
  }
});

app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const body = req.body;
  const bodylessRoutes = new Set([
    "/api/user/getuser", "/api/user/profile", "/api/user/demo-login",
    "/api/expense/get", "/api/income/get", "/api/budget/get",
    "/api/goal/get", "/api/loan/get", "/api/notification/get",
  ]);
  if (bodylessRoutes.has(req.originalUrl.split("?")[0]) && (!body || Object.keys(body).length === 0)) return next();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }
  const containsUnsafeKey = (value) => {
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, child]) =>
      key.startsWith("$") || key.includes(".") || containsUnsafeKey(child));
  };
  if (containsUnsafeKey(body)) return res.status(400).json({ message: "Invalid request fields" });
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/finance", financeRoutes);
app.use((error, _req, res, _next) => {
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
  if (error.message === "Origin not allowed by CORS") return res.status(403).json({ message: "Origin not allowed" });
  return res.status(500).json({ message: "Server error" });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  connectDB()
    .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
    .catch(() => { console.error("Database connection failed"); process.exit(1); });
}

module.exports = app;
