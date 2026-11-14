const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createLoan,
  getLoans,
  updateLoan,
  deleteLoan,
} = require("../controllers/loanController");

router.use(auth);

router.post("/create", createLoan);
router.post("/get", getLoans);
router.post("/update", updateLoan);
router.post("/delete", deleteLoan);

module.exports = router;
