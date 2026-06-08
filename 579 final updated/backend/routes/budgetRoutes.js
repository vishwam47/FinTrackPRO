const express = require("express");
const router = express.Router();
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

// Only POST requests
router.post("/create", createBudget);
router.post("/get", getBudgets);
router.post("/update", updateBudget);
router.post("/delete", deleteBudget);

module.exports = router;
