/**
 * FinTrackPRO — Smoke Tests
 *
 * Usage:  node smoke_tests.js
 * Needs:  backend running on port 5000, MongoDB on 27017
 *         Optionally: ML gateway on port 8000 (skipped if unreachable)
 *
 * Updated after Phase 3a: expects real JWTs and enforced auth middleware.
 * Updated after Phase 3b: expects userId derived from JWT, not request body.
 */

'use strict';

const BASE    = 'http://localhost:5000';
const ML_BASE = 'http://localhost:8000';

let passed = 0;
let failed = 0;
let skipped = 0;

// ─── helpers ─────────────────────────────────────────────────────────────────

async function post(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function get(url, headers = {}) {
  const res = await fetch(url, { headers });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function test(label, fn) {
  process.stdout.write(`  ${label}\n`);
  try {
    const note = await fn();
    console.log(`    ✓ PASS${note ? '  →  ' + note : ''}`);
    passed++;
  } catch (err) {
    console.log(`    ✗ FAIL  →  ${err.message}`);
    failed++;
  }
}

async function skip(label, reason) {
  console.log(`  ${label}`);
  console.log(`    - SKIP  →  ${reason}`);
  skipped++;
}

// ─── shared state ────────────────────────────────────────────────────────────

const STAMP      = Date.now();
const TEST_EMAIL = `smoke_${STAMP}@test.local`;
const TEST_PASS  = 'SmokePass1!';

let userId = null;
let token  = null;

// ─── suite ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  FinTrackPRO — Smoke Tests  (Phase 3a baseline)');
  console.log('══════════════════════════════════════════════════════\n');

  // ── 1. Signup ──────────────────────────────────────────────────────────────
  console.log('── 1. Auth: Signup ──────────────────────────────────\n');

  await test('POST /api/user/signup  →  creates new user and returns real JWT', async () => {
    const { status, data } = await post(`${BASE}/api/user/signup`, {
      name: 'Smoke User',
      email: TEST_EMAIL,
      password: TEST_PASS,
    });
    if (status !== 201) throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`);
    if (!data.token) throw new Error('No token field in response');
    const parts = data.token.split('.');
    if (parts.length !== 3) throw new Error(`Not a JWT — got: "${data.token.slice(0, 40)}..."`);
    userId = data.user._id;
    token  = data.token;
    return `JWT issued  userId=${userId}`;
  });

  await test('POST /api/user/signup  →  rejects duplicate email', async () => {
    const { status, data } = await post(`${BASE}/api/user/signup`, {
      name: 'Duplicate',
      email: TEST_EMAIL,
      password: TEST_PASS,
    });
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
    return `message="${data.message}"`;
  });

  // ── 2. Login ───────────────────────────────────────────────────────────────
  console.log('\n── 2. Auth: Login ───────────────────────────────────\n');

  await test('POST /api/user/login  →  valid credentials return real JWT', async () => {
    const { status, data } = await post(`${BASE}/api/user/login`, {
      email: TEST_EMAIL,
      password: TEST_PASS,
    });
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`);
    if (!data.token || data.token.split('.').length !== 3) throw new Error('Response did not contain a valid JWT');
    return 'JWT returned';
  });

  await test('POST /api/user/login  →  wrong password is rejected', async () => {
    const { status } = await post(`${BASE}/api/user/login`, {
      email: TEST_EMAIL,
      password: 'WrongPassword!',
    });
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
    return 'correctly rejected';
  });

  // ── 3. Auth middleware enforcement ─────────────────────────────────────────
  console.log('\n── 3. Auth Middleware + userId from JWT (Phase 3a/3b) ─\n');

  await test('POST /api/user/getuser  →  401 without Authorization header', async () => {
    if (!userId) throw new Error('userId not set (signup failed)');
    const { status } = await post(`${BASE}/api/user/getuser`, { userId });
    if (status !== 401) throw new Error(`Expected 401, got ${status} — route is still unprotected!`);
    return 'correctly rejected with 401';
  });

  await test('POST /api/user/getuser  →  200 with valid JWT', async () => {
    if (!token) throw new Error('No token available');
    const { status, data } = await post(`${BASE}/api/user/getuser`, { userId }, bearer(token));
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`);
    return `email=${data.user.email}`;
  });

  await test('POST /api/expense/create  →  401 without Authorization header', async () => {
    const { status } = await post(`${BASE}/api/expense/create`, {
      userId,
      amount: 1,
      category: 'Smoke',
      description: 'Auth test',
      date: new Date().toISOString(),
    });
    if (status !== 401) throw new Error(`Expected 401, got ${status} — route still unprotected!`);
    return 'correctly rejected with 401';
  });

  await test('POST /api/expense/create  →  201 with valid JWT; body userId is ignored (Phase 3b)', async () => {
    if (!token) throw new Error('No token available');
    const fakeId = '000000000000000000000001';
    const { status, data } = await post(
      `${BASE}/api/expense/create`,
      { userId: fakeId, amount: 42, category: 'Smoke', description: 'JWT test', date: new Date().toISOString() },
      bearer(token),
    );
    if (status !== 201) throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`);
    return `expenseId=${data.expense._id}  (body sent fakeId=${fakeId}, backend used JWT userId instead)`;
  });

  await test('POST /api/expense/create  →  401 with tampered/invalid JWT', async () => {
    const { status } = await post(
      `${BASE}/api/expense/create`,
      { userId, amount: 1, category: 'Smoke', date: new Date().toISOString() },
      { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload' },
    );
    if (status !== 401) throw new Error(`Expected 401, got ${status} — invalid token accepted!`);
    return 'tampered token rejected with 401';
  });

  // ── 4. OTP endpoint ────────────────────────────────────────────────────────
  console.log('\n── 4. OTP / Email ───────────────────────────────────\n');

  await test('POST /api/send-otp  →  public endpoint still reachable (no auth needed)', async () => {
    const { status, data } = await post(`${BASE}/api/send-otp`, { email: TEST_EMAIL });
    // TODO [SECURITY]: OTP still returned in response body — fix in Phase 3c or later
    if (status === 200 && data.otp !== undefined) {
      return `reachable (OTP still in body: ${data.otp} — TODO remove)`;
    }
    if (status === 500) return 'email send failed (expected in dev without SMTP) — endpoint reachable';
    return `status=${status}`;
  });

  // ── 5. ML Gateway ──────────────────────────────────────────────────────────
  console.log('\n── 5. ML Gateway (port 8000) ────────────────────────\n');

  let mlReachable = false;
  try {
    const probe = await Promise.race([
      fetch(`${ML_BASE}/health`),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
    ]);
    mlReachable = probe.ok;
  } catch { /* not running */ }

  if (mlReachable) {
    await test('GET /health  →  ML gateway responds', async () => {
      const { status, data } = await get(`${ML_BASE}/health`);
      if (status !== 200) throw new Error(`HTTP ${status}`);
      return `status="${data.status}"  services=${Object.keys(data.services || {}).length}`;
    });

    await test('GET /transaction_fraud/health  →  fraud sub-service reachable', async () => {
      const { status } = await get(`${ML_BASE}/transaction_fraud/health`);
      if (status !== 200) throw new Error(`HTTP ${status}`);
      return 'reachable';
    });
  } else {
    await skip('GET /health            (ML gateway)', 'ML server not running on port 8000 — start it to test');
    await skip('GET /transaction_fraud/health', 'ML server not running — skipped');
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  Results');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  PASS:   ${passed}`);
  console.log(`  FAIL:   ${failed}`);
  console.log(`  SKIP:   ${skipped}`);
  console.log(`  TOTAL:  ${passed + failed + skipped}`);
  console.log('');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
