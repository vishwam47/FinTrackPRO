const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

router.use(auth);

router.post("/create", createExpense);
router.post("/get", getExpenses);
router.post("/update", updateExpense);
router.post("/delete", deleteExpense);

module.exports = router;
