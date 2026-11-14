const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

router.use(auth);

router.post("/create", createBudget);
router.post("/get", getBudgets);
router.post("/update", updateBudget);
router.post("/delete", deleteBudget);

module.exports = router;
