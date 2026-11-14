const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  signup,
  login,
  demoLogin,
  getSingleUser,
} = require("../controllers/userController");
const { signupLimiter, loginLimiter, demoLimiter } = require("../middleware/rateLimit");

router.post("/signup", signupLimiter, signup);
router.post("/register", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/demo-login", demoLimiter, demoLogin);
router.post("/getuser", auth, getSingleUser);
router.post("/profile", auth, getSingleUser);

module.exports = router;
