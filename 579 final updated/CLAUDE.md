# FinTrackPRO — Claude Code Master Instructions

## How to use this file
Read the PROGRESS TRACKER first. Find the first unchecked phase.
Start from there. Do not repeat completed phases.
After completing a phase, check it off in this file before stopping.

---

## Stack
- Frontend: React 19 + Vite + Tailwind, port 5173
- Backend: Node.js + Express 5 + MongoDB, port 5000 (api.js → port 5000)
- ML layer: Python FastAPI, port 8000, mounted via main_combined_api.py (mlapi.js → port 8000)
- External APIs: Yahoo Finance, Alpha Vantage, NewsAPI, Razorpay, Google Gemini

## Architecture rules — never violate these
- Node.js handles business logic and data persistence ONLY — never ML or Gemini calls
- FastAPI handles ALL ML inference and Gemini calls, already wired in main_combined_api.py
- All MongoDB models reference userId as a foreign key to User._id (hub-and-spoke pattern)
- Gemini API key lives in ML/.env as GOOGLE_API_KEY — do NOT create a new one or second client
- Reuse the existing Gemini call pattern found in main_combined_api.py

## Known security issues (do not work around, do not fix during feature work)
- Auth uses dummy token string "dummy-token-{userId}" — no real JWT, no signing, no expiry
- Backend accepts userId from req.body with no validation — any userId works on any route
- SMTP credentials hardcoded in server.js lines 38–44, not read from .env
- OTP returned in /api/send-otp response body — exposes code to any caller
- forgotPassword has no server-side OTP check — frontend-only gate, bypassed by direct API call
- jsonwebtoken installed in Phase 3 ✓
- allow_origins=["*"] + allow_credentials=True in main_combined_api.py — invalid CORS combination

## General rules for all work
- Read the relevant files BEFORE making any changes
- Explain what you are about to do and WHY before doing it
- State design decisions explicitly before creating any new file
- Stop at phase boundaries and wait for confirmation before continuing
- If ambiguity about Gemini/AR/auth integration — reason through options first, then pick one
- One concern per commit — do not mix security fixes with feature work
- No console.log spam, no hardcoded test values in production paths
- Do not delete any existing feature without asking first
- If a file doesn't exist where expected, say so rather than guessing

---

## PROGRESS TRACKER
Check off each phase as it completes. Always start from the first unchecked item.

- [x] Phase 0 — Repo orientation & security audit (COMPLETE — summary below)
- [X] Phase 1 — Safety net: smoke tests baseline
- [X] Phase 2 — Node.js FinanceProfile model + /api/finance/analyze route
- [X] Phase 3 — FastAPI /recommend-stocks endpoint + stock_recommender.py
- [X] Phase 4 — FinanceAnalysis.jsx frontend page + App.jsx routing
- [ ] Phase 5 — Integration check end to end
- [ ] Phase 6 — Security fixes (separate pass, after feature complete)

---

## Phase 0 — Completed Findings (do not repeat this work)

### Folder layout
```
579 final updated/
├── backend/              Node.js + Express 5 (port 5000)
│   ├── config/db.js
│   ├── controllers/      userController, expenseController, budgetController,
│   │                     incomeController, goalController, loanController,
│   │                     notificationController
│   ├── models/           User, Expense, Budget, Income, Goal, Loan, Notification
│   ├── routes/           One router file per resource
│   └── server.js         App entry + inline email routes + hardcoded SMTP
├── frontend/             React 19 + Vite + Tailwind (port 5173)
│   ├── src/context/AuthContext.jsx   Token in localStorage
│   ├── src/services/api.js           Axios → port 5000
│   └── src/services/mlapi.js         Axios → port 8000
└── ML/                   Python FastAPI (port 8000)
    ├── main_combined_api.py          Gateway mounting 15 microservices
    ├── .env                          GOOGLE_API_KEY (live), GEMINI_MODEL
    └── <15 sub-folders>              One FastAPI app each
```

### Auth flow confirmed
- signup/login return `token: "dummy-token-" + user._id` — plain string, no JWT
- No auth middleware exists anywhere — all routes fully unprotected
- userId taken from req.body on every data operation — no validation

### Gemini integration location
- API key: ML/.env → GOOGLE_API_KEY
- Client and call pattern: inside main_combined_api.py — find exact function before Phase 3

---

## Phase 1 — Safety Net
**Goal:** Establish a before-baseline so we know what currently works before touching anything.

Set up a thin smoke test covering:
- User signup (POST /api/user/signup)
- User login (POST /api/user/login)
- One protected data route (e.g. GET /api/income with a userId)
- One ML gateway endpoint (e.g. POST /predict or whatever exists in main_combined_api.py)

If a full test framework (Jest, pytest) is overkill for this project size, create a documented
manual test checklist at backend/tests/smoke_checklist.md with curl commands instead.

Run all tests once and record actual responses — even broken/insecure ones.
This is the "before" baseline for the security fix phase later.

**Stop here. Show me the baseline results. Wait for confirmation.**

---

## Phase 2 — Node.js Surplus + Risk Engine
**Goal:** Bridge personal finance data into a structured profile that the ML layer can consume.

### 2a. New Mongoose model: backend/models/FinanceProfile.js
Fields:
- userId (ObjectId, ref: 'User', required)
- month (String, format: 'YYYY-MM', required)
- income (Number, required)
- totalExpenses (Number)
- totalBills (Number)
- expenseBreakdown (Object — category: amount pairs)
- savingsReserve (Number — 20% of income by default)
- investableSurplus (Number)
- riskScore (Number, 0–10)
- riskLabel (String — 'Conservative' | 'Moderate' | 'Aggressive')
- updatedAt (Date, default: Date.now)
- Compound unique index on { userId, month }

### 2b. POST /api/finance/analyze
Accept: `{ userId, month, income, expenses: [{amount, category}], bills: [{amount, name}] }`

Compute:
```
savingsReserve     = income * 0.20
totalExpenses      = sum of expenses[].amount
totalBills         = sum of bills[].amount
investableSurplus  = income - totalExpenses - totalBills - savingsReserve
surplusRatio       = investableSurplus / income

riskScore:
  surplusRatio < 0.20  → riskScore = 0–3,  riskLabel = 'Conservative'
  surplusRatio 0.20–0.40 → riskScore = 4–6, riskLabel = 'Moderate'
  surplusRatio > 0.40  → riskScore = 7–10, riskLabel = 'Aggressive'

safeInvestAmount:
  Conservative → investableSurplus * 0.5
  Moderate     → investableSurplus * 0.7
  Aggressive   → investableSurplus * 0.9
```

Upsert into FinanceProfile (findOneAndUpdate with upsert:true on {userId, month}).
Return the full saved profile object including safeInvestAmount.

### 2c. GET /api/finance/profile?userId=&month=
Return existing FinanceProfile for that user+month. 404 if not found.

### 2d. Register routes in server.js
Follow the same pattern as existing route registrations.

**Run these curl tests and show me the raw responses before Phase 3:**
```bash
# Test POST
curl -X POST http://localhost:5000/api/finance/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<any_valid_mongo_id>",
    "month": "2025-06",
    "income": 50000,
    "expenses": [
      {"amount": 15000, "category": "rent"},
      {"amount": 5000, "category": "food"},
      {"amount": 2000, "category": "transport"}
    ],
    "bills": [
      {"amount": 500, "name": "electricity"},
      {"amount": 800, "name": "internet"}
    ]
  }'

# Expected: surplus = 50000 - 22000 - 1300 - 10000 = 16700
# surplusRatio = 16700/50000 = 0.334 → Moderate, riskScore 4–6

# Test GET
curl "http://localhost:5000/api/finance/profile?userId=<same_id>&month=2025-06"
```

**Stop here. Show me the curl responses. Wait for confirmation.**

---

## Phase 3 — FastAPI /recommend-stocks Endpoint
**Goal:** Create the ML-side endpoint that takes a finance profile and returns personalized
stock recommendations using the existing AR forecast, sentiment, and Gemini infrastructure.

### 3a. Create ML/stock_recommender.py

**IMPORTANT:** Before writing anything, read main_combined_api.py and find:
- The exact Gemini client instantiation and call pattern
- The existing forecast_prices() function signature
- The existing sentiment function signature
Then reuse them — do not create new versions.

```python
CANDIDATE_STOCKS = {
    "low_risk":    ["VTI", "SCHD", "BRK-B", "JNJ", "PG"],
    "medium_risk": ["AAPL", "MSFT", "GOOGL", "AMZN", "V"],
    "high_risk":   ["TSLA", "NVDA", "META", "AMD", "PLTR"]
}
```

Functions to implement:

**get_stock_snapshot(ticker) → dict**
- Fetch current price via yfinance (ticker.fast_info.last_price or .history())
- Fetch 1yr of daily closes, run through existing AR forecast logic
- Determine trend: last forecast price vs current → "up" / "down" / "flat" (±1% threshold)
- Run existing sentiment function on f"{ticker} stock outlook"
- Return: `{ ticker, price, trend, sentiment_score, risk_band }`

**build_gemini_prompt(snapshot, profile) → str**
```
"User monthly income: {income}. Total expenses: {totalExpenses}.
Bills: {totalBills}. Investable surplus: {investableSurplus}.
Risk profile: {riskLabel}. Amount user wants to invest: {amountToInvest}.
Stock: {ticker}, current price: {price}, 90-day AR forecast trend: {trend},
sentiment score: {sentiment_score} (range -1 to 1).
Should this user invest in this stock? Consider whether it fits their budget,
risk profile, and financial commitments.
Give a clear Yes/No recommendation with a short reason (2–3 sentences max).
Flag if investing would strain their essential expenses."
```

**call_gemini(prompt) → str**
- Reuse exact Gemini client from main_combined_api.py
- Return the text response string

**recommend_stocks(profile) → list**
- Loop all 15 candidate stocks
- Skip (don't call Gemini) if snapshot.price > profile.amountToInvest * 0.4
- For affordable stocks: call Gemini, parse Yes/No from response
- Return sorted list: affordable+Yes first, then affordable+No, then unaffordable

### 3b. POST /recommend-stocks endpoint
```python
class RecommendRequest(BaseModel):
    income: float
    totalExpenses: float
    totalBills: float
    investableSurplus: float
    riskScore: int
    riskLabel: str
    amountToInvest: float

# Returns list of:
{
  "ticker": str,
  "price": float,
  "trend": "up" | "down" | "flat",
  "sentiment_score": float,
  "risk_band": "low_risk" | "medium_risk" | "high_risk",
  "can_afford": bool,
  "gemini_verdict": "Yes" | "No" | "Skipped",
  "gemini_reason": str
}
```

### 3c. Mount in main_combined_api.py
Follow the same mounting pattern as existing microservices.

**Run this test and show me the raw JSON response before Phase 4:**
```bash
curl -X POST http://localhost:8000/recommend-stocks \
  -H "Content-Type: application/json" \
  -d '{
    "income": 50000,
    "totalExpenses": 22000,
    "totalBills": 1300,
    "investableSurplus": 16700,
    "riskScore": 5,
    "riskLabel": "Moderate",
    "amountToInvest": 10000
  }'
```

**Stop here. Show me the raw JSON. Wait for confirmation.**

---

## Phase 4 — Frontend: FinanceAnalysis.jsx
**Goal:** Build the unified Smart Finance Hub page that connects the two backends.

Create `frontend/src/pages/FinanceAnalysis.jsx`

### Section A — Finance Input & Summary
Form fields:
- Income (number input)
- Expense rows: [amount, category] with Add/Remove buttons (start with 3 rows)
- Bill rows: [amount, name] with Add/Remove buttons (start with 2 rows)
- Minimum savings % (number input, default 20)

On submit → POST to `/api/finance/analyze` via api.js
On success, display:
- Recharts PieChart/donut: slices for Expenses / Bills / Savings Reserve / Investable Surplus
- 4 stat cards: Total Income | Total Spent | Investable Surplus | Risk Profile (badge)
- Text: "You can safely invest up to ₹{safeInvestAmount} this month"

### Section B — Investment Amount Input
(Only visible after Section A analysis completes)
- Number input: "How much do you want to invest this month?"
- Warn in amber if amount > investableSurplus
- Block in red + disable button if amount > income (hard cap)
- "Find My Stocks" button → POST to `/recommend-stocks` via mlapi.js
  Payload: full finance profile from Section A + amountToInvest

### Section C — Stock Recommendation Cards
(Only visible after Section B fetch completes)
- Loading spinner while Gemini runs (can take 10–20s for 15 stocks)
- Responsive grid (2–3 cols on desktop, 1 col mobile)
- Card border colors:
  - Green: can_afford=true AND gemini_verdict="Yes"
  - Amber: can_afford=true AND gemini_verdict="No"
  - Red/gray: can_afford=false (gemini_verdict="Skipped")
- Each card shows:
  - Ticker (large, bold)
  - Current price
  - Trend arrow: ↑ (green) / ↓ (red) / → (gray)
  - Sentiment badge: Positive / Neutral / Negative
  - Risk band badge: Low Risk / Medium Risk / High Risk
  - Affordability badge: ✓ Affordable / ✗ Out of range
  - Gemini verdict: "Recommended ✓" or "Not Recommended ✗"
  - Gemini reason text (2–3 sentences)
- Sort order: affordable+Yes → affordable+No → unaffordable
- Empty state if 0 affordable stocks: "No stocks fit your current budget.
  Try increasing your investment amount or reducing expenses."

### App.jsx changes
- Add route: `/smart-invest` → `<FinanceAnalysis />`
- Add navbar item: "Smart Invest" (with a chart/dollar icon)
- Do NOT remove any existing navbar items or routes

**Stop here. Show me the page running in browser (screenshot or description).
Wait for confirmation before Phase 5.**

**KNOWN ISSUE: Affordability threshold needs fixing — change from
`price_inr <= amountToInvest * 0.4` to `price_inr <= amountToInvest`.
Also add frontend note: Minimum recommended ₹50,000 for US stocks.
Fix this at the start of Phase 5.**

---

## Phase 5 — Integration Check
**Goal:** Verify the full flow works end to end with real data.

Walk through exactly this test case:
1. Open /smart-invest in browser
2. Enter: income=50000, expenses=[rent 15000, food 5000, transport 2000],
   bills=[electricity 500, internet 800], savings=20%
3. Submit and verify:
   - Surplus = 16700 ✓
   - Risk = Moderate ✓
   - Safe invest = ₹11,690 (16700 × 0.7) ✓
   - Donut chart shows correct proportions ✓
4. Enter investment amount: 10000
5. Click "Find My Stocks"
6. Verify stock cards appear with correct badges
7. Verify at least one affordable stock has a Gemini verdict
8. Verify cards are sorted correctly

List every issue found. Fix them all before marking this phase complete.

**Stop here. List issues found and fixes applied. Wait for confirmation.**

---

## Phase 6 — Security Fixes (separate pass)
**Do not start this phase until Phase 5 is complete and confirmed.**
**Do not mix any of these commits with feature work.**

### 6a. Real JWT authentication
- Install jsonwebtoken: `npm install jsonwebtoken` in backend/
- Replace dummy token generation in userController.js with jwt.sign()
  payload: { userId: user._id }, secret: process.env.JWT_SECRET, expiresIn: '7d'
- Create backend/middleware/auth.js: verify token, attach req.userId
- Apply middleware to all resource routes (income, expense, budget, goal, loan, notification)
- Run smoke tests. Report pass/fail before 6b.

### 6b. Remove userId from req.body
- In all controllers, replace `req.body.userId` with `req.userId` (from JWT middleware)
- Run smoke tests. Report pass/fail before 6c.

### 6c. Move hardcoded secrets to environment variables
- server.js SMTP credentials → process.env.SMTP_USER / process.env.SMTP_PASS
- Update backend/.env with real variable names
- Update backend/.env.example (no real values)
- Verify .gitignore covers all .env files
- Run smoke tests. Report pass/fail before 6d.

### 6d. Fix OTP security hole
- /api/send-otp: remove OTP from response body, store hashed OTP in DB temporarily
- forgotPassword: validate submitted OTP against stored hash server-side
- Run smoke tests. Report pass/fail.

**Stop after all 6a–6d. Summarize what changed and final test results.**
