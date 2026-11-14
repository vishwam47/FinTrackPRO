const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { analyzeFinance, getFinanceProfile } = require("../controllers/financeController");

router.use(auth);

router.post("/analyze", analyzeFinance);
router.get("/profile", getFinanceProfile);

module.exports = router;
