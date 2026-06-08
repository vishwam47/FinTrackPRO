const express = require("express");
const router = express.Router();
const {
  createLoan,
  getLoans,
  updateLoan,
  deleteLoan,
} = require("../controllers/loanController");

// Only POST requests
router.post("/create", createLoan);
router.post("/get", getLoans);
router.post("/update", updateLoan);
router.post("/delete", deleteLoan);

module.exports = router;
