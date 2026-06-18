const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

router.use(auth);

router.post("/create", createGoal);
router.post("/get", getGoals);
router.post("/update", updateGoal);
router.post("/delete", deleteGoal);

module.exports = router;
