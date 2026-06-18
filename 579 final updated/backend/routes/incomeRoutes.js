const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createIncome,
  getIncome,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");

router.use(auth);

router.post("/create", createIncome);
router.post("/get", getIncome);
router.post("/update", updateIncome);
router.post("/delete", deleteIncome);

module.exports = router;
