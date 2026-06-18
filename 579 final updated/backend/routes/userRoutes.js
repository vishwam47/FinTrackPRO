const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  signup,
  login,
  getSingleUser,
  checkEmail,
  forgotPassword,
} = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/checkemail", checkEmail);
router.post("/forgotPassword", forgotPassword);
router.post("/getuser", auth, getSingleUser);

module.exports = router;
