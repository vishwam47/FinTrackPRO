const express = require("express");
const router = express.Router();
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

// Only POST requests
router.post("/create", createGoal);
router.post("/get", getGoals);
router.post("/update", updateGoal);
router.post("/delete", deleteGoal);

module.exports = router;
