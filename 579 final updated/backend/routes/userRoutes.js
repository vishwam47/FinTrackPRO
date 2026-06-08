const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  getSingleUser,
  checkEmail,
  forgotPassword,
} = require("../controllers/userController");

// Only POST requests as per your requirement
router.post("/signup", signup);
router.post("/login", login);
router.post("/getuser", getSingleUser);
router.post("/checkemail", checkEmail);
router.post("/forgotPassword", forgotPassword);

module.exports = router;
