const express = require("express");
const router = express.Router();
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

// Only POST requests
router.post("/create", createExpense);
router.post("/get", getExpenses);
router.post("/update", updateExpense);
router.post("/delete", deleteExpense);

module.exports = router;
