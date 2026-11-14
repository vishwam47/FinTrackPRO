const rateLimit = require("express-rate-limit");

const makeLimiter = (limit, message) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message },
});

module.exports = {
  signupLimiter: makeLimiter(5, "Too many signup attempts. Try again later."),
  loginLimiter: makeLimiter(10, "Too many login attempts. Try again later."),
  demoLimiter: makeLimiter(5, "Too many demo sessions. Try again later."),
};
