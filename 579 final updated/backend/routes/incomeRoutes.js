const express = require("express");
const router = express.Router();
const {
  createIncome,
  getIncome,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");

// Only POST requests
router.post("/create", createIncome);
router.post("/get", getIncome);
router.post("/update", updateIncome);
router.post("/delete", deleteIncome);

module.exports = router;
