const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const base = (process.env.API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

async function request(path, { token, method = "POST", body, origin } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function main() {
  const health = await request("/api/health", { method: "GET" });
  assert.equal(health.status, 200, "backend and test MongoDB must be healthy");

  const unauthenticated = await request("/api/expense/get");
  assert.equal(unauthenticated.status, 401, "financial reads require a JWT");

  const testEmail = `security-${randomUUID()}@example.invalid`;
  const signup = await request("/api/user/signup", {
    body: { name: "Security Test", email: testEmail, password: "TestOnlyPass_2026!" },
  });
  assert.equal(signup.status, 201, "signup should create an account and issue a signed token");
  const goodLogin = await request("/api/user/login", {
    body: { email: testEmail, password: "TestOnlyPass_2026!" },
  });
  assert.equal(goodLogin.status, 200, "valid credentials should authenticate");
  const badLogin = await request("/api/user/login", {
    body: { email: testEmail, password: "not-the-password" },
  });
  assert.equal(badLogin.status, 400, "wrong password should be rejected");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const rejected = await request("/api/user/login", {
      body: { email: testEmail, password: "not-the-password" },
    });
    assert.equal(rejected.status, 400, "login limiter allows ten attempts per window");
  }
  const limitedLogin = await request("/api/user/login", {
    body: { email: testEmail, password: "not-the-password" },
  });
  assert.equal(limitedLogin.status, 429, "login is rate limited after ten attempts");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const invalidSignup = await request("/api/user/signup", {
      body: { name: "", email: `invalid-${attempt}@example.invalid`, password: "short" },
    });
    assert.equal(invalidSignup.status, 400, "signup validates account fields");
  }
  const limitedSignup = await request("/api/user/signup", {
    body: { name: "", email: "invalid-last@example.invalid", password: "short" },
  });
  assert.equal(limitedSignup.status, 429, "signup is rate limited after five attempts");

  const blockedOrigin = await request("/api/health", { method: "GET", origin: "https://untrusted.invalid" });
  assert.equal(blockedOrigin.status, 403, "unconfigured browser origins should be rejected");

  const first = await request("/api/user/demo-login", {
    body: { email: "demo@fintrackpro.app", password: "any-password-is-ignored" },
  });
  const second = await request("/api/user/demo-login", {
    body: { email: "demo@fintrackpro.app", password: "another-any-password" },
  });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.notEqual(first.data.user._id, second.data.user._id, "demo visitors get different owners");
  assert.notEqual(first.data.token, second.data.token, "demo visitors get different signed tokens");

  const firstRecords = await request("/api/expense/get", { token: first.data.token });
  const secondRecords = await request("/api/expense/get", { token: second.data.token });
  assert.equal(firstRecords.status, 200);
  assert.equal(secondRecords.status, 200);
  const firstExpense = firstRecords.data.expenses[0];
  assert.ok(firstExpense, "demo session includes a sample expense");
  assert.ok(!secondRecords.data.expenses.some((item) => item._id === firstExpense._id), "user B cannot read user A records");

  const firstProfile = await request("/api/user/getuser", { token: first.data.token });
  const secondProfile = await request("/api/user/getuser", { token: second.data.token, body: { userId: first.data.user._id } });
  assert.equal(firstProfile.status, 200);
  assert.equal(secondProfile.data.user._id, second.data.user._id, "profile lookup ignores requested userId");

  const ownershipCases = [
    ["income", "income", "incomeId", "amount", "get", "update", "delete", "income"],
    ["budget", "budget", "budgetId", "amount", "get", "update", "delete", "budgets"],
    ["goal", "goal", "goalId", "targetAmount", "get", "update", "delete", "goals"],
    ["loan", "loan", "loanId", "totalAmount", "get", "update", "delete", "loans"],
    ["notification", "notification", "notificationId", "isRead", "get", "update", "delete", "notifications"],
  ];
  ownershipCases.unshift(["expense", "expenses", "expenseId", "amount", "get", "update", "delete", "expenses"]);
  for (const [route, profileKey, idKey, field, getPath, updatePath, deletePath, responseKey] of ownershipCases) {
    const id = firstProfile.data.user[profileKey][0]?._id;
    assert.ok(id, `demo user has sample ${route}`);
    const otherList = await request(`/api/${route}/${getPath}`, { token: second.data.token });
    assert.ok(!otherList.data[responseKey].some((item) => item._id === id), `user B cannot read user A ${route}`);
    const update = await request(`/api/${route}/${updatePath}`, { token: second.data.token, body: { [idKey]: id, [field]: 1 } });
    const remove = await request(`/api/${route}/${deletePath}`, { token: second.data.token, body: { [idKey]: id } });
    assert.equal(update.status, 404, `user B cannot update user A ${route}`);
    assert.equal(remove.status, 404, `user B cannot delete user A ${route}`);
  }

  const financeWrite = await request("/api/finance/analyze", {
    token: first.data.token,
    body: { month: "2026-11", income: 62000, expenses: [], bills: [] },
  });
  assert.equal(financeWrite.status, 200, "finance profile can be created for the authenticated owner");
  const financeOther = await request("/api/finance/profile?month=2026-11", { method: "GET", token: second.data.token });
  assert.equal(financeOther.status, 404, "other users cannot read finance profiles");

  const stillOwned = await request("/api/expense/get", { token: first.data.token });
  assert.ok(stillOwned.data.expenses.some((item) => item._id === firstExpense._id), "failed cross-user operations leave owner data intact");

  const oldOtp = await request("/api/send-otp", { body: { email: "nobody@example.invalid" } });
  const oldReset = await request("/api/user/forgotPassword", { body: { email: "nobody@example.invalid", newPassword: "anything" } });
  assert.equal(oldOtp.status, 404, "legacy OTP endpoint is disabled");
  assert.equal(oldReset.status, 404, "legacy password reset endpoint is disabled");

  console.log("PASS health and test database");
  console.log("PASS signup, valid login, and wrong-password rejection");
  console.log("PASS signup and login rate limits");
  console.log("PASS CORS allow-list");
  console.log("PASS protected financial read");
  console.log("PASS two isolated demo users");
  console.log("PASS cross-user reads and mutations across expenses, income, budgets, goals, loans, notifications, user profiles, and finance profiles");
  console.log("PASS insecure reset endpoints disabled");
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
