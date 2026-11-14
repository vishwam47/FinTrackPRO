# FinTrackPRO portfolio deployment

This repository is prepared for a **noncommercial portfolio demo**. The UI has a one-click demo session and uses synthetic records. Each demo visitor gets a separate workspace and an expiring server-signed token. Do not use this deployment for real financial records, production accounts, or commercial traffic. Password recovery is disabled until a verified, single-use reset flow is implemented.

Receipt file uploads are disabled in the demo. The previous browser upload used a public unsigned Cloudinary preset, which could be abused and was not suitable for sensitive receipts. Existing receipt links remain viewable; use a private, server-signed upload flow before re-enabling uploads.

## Architecture

- **Frontend:** React/Vite on Vercel. Create a Vercel project with Root Directory `579 final updated/frontend`; Vercel detects Vite, runs `npm run build`, and serves `dist/`. `frontend/vercel.json` adds SPA refresh routing and basic browser security headers.
- **Express API:** deploy as a second Vercel project with Root Directory `579 final updated/backend`. Vercel detects the exported Express application in `server.js`. Set production environment variables for this project. The API keeps a cached Mongoose connection per warm function instance.
- **Database:** MongoDB Atlas using a dedicated demo database and a least-privilege database user. Allow network access from the hosting provider as required by your Atlas tier.
- **ML API:** deploy the combined FastAPI service as a Docker web service (for example, Render, Railway, or Fly.io) using `ML/Dockerfile`, with build context `579 final updated/ML`. Set `VITE_ML_API_URL` in the Vercel frontend project to its HTTPS origin and set `CORS_ORIGINS` on the ML host to the exact frontend origin.

Vercel can host Python functions, but this combined service imports 16 FastAPI apps and includes TensorFlow, CVXPY and multiple ML/data dependencies. That bundle and model initialization are unsuitable for a Vercel Function’s package/runtime constraints. The model files found in this checkout total about 2.8 MB; the dependency bundle, not model-file size alone, is the concern. Keep the complete ML service on a Docker-capable host. The frontend calls the ML host directly using `VITE_ML_API_URL`.

## Local setup

1. Install Node.js 20 or newer and Python 3.11. Install MongoDB locally or create an isolated Atlas database for testing. This checkout was checked with the available Python 3.10 interpreter; the full ML dependencies are intended for Python 3.11 and a Linux Docker host.
2. Copy `backend/.env.example` to `backend/.env`, set a test `MONGODB_URI`, and generate a fresh random `JWT_SECRET` of at least 32 characters. Do not reuse values from ignored local `.env` files.
3. From `backend/`, run `npm ci`, then `npm start`. The production command is `node server.js`; `npm run dev` uses nodemon.
4. From `frontend/`, run `npm ci`, then `npm run dev`. The dev server proxies `/api` to `http://localhost:5000`.
5. Open the app and select **Continue as Demo User**, or use `demo@fintrackpro.app` with any password. Both create a private synthetic workspace without an account. Demo workspaces expire after seven days; old demo rows are cleaned when a later demo session is created.
6. To start the ML API locally, create a Python 3.11 environment in `ML/`, install `requirements.txt`, then run `uvicorn main_combined_api:main_app --host 0.0.0.0 --port 8000`. The combined app needs its full dependency set and models to initialize.

## Vercel project configuration

Create two Vercel projects from the same Git repository. Use the frontend and backend Root Directories above; do not set the repository root as either project root. The frontend `vercel.json` rewrites SPA routes to `index.html`. The backend exports the Express app for Vercel’s Express runtime and also supports the `npm start` command on a conventional Node host.

Configure `VITE_API_BASE_URL` on the frontend project to the HTTPS origin of the backend project, with no trailing slash. Configure `CORS_ORIGIN` on the backend to the exact deployed frontend origin (and any preview origins you intentionally use). Set the **same** server-side `JWT_SECRET` on the backend and ML host. The combined ML gateway verifies JWT issuer, audience, and expiry, and scopes any `user_id` path, query, or JSON parameter to the token owner. Vite variables are public build-time values; never put credentials in them. The ML URL is also public and belongs in `VITE_ML_API_URL`.

The backend accepts only the configured CORS origins. CORS is not authentication: all private API routes still require a signed JWT. Login and signup use rate limiters; on serverless instances their default in-memory counters are per warm instance, so use the platform firewall or a shared Redis limiter if abuse controls need to be robust across instances.

## Verification

- Frontend production build: `cd frontend && npm ci && npm run build`.
- Frontend lint: `cd frontend && npm run lint`.
- Backend syntax: `node --check backend/server.js` and `node --check backend/controllers/userController.js`.
- Backend security integration checks: use a disposable database named `fintrackpro_test`, start the API with test-only `MONGODB_URI`, a generated test-only `JWT_SECRET`, and `CORS_ORIGIN=http://localhost:5173`; then run `cd backend && npm run test:security`. The test creates two isolated demo users and verifies authentication, ownership, and disabled reset endpoints. Do not point this script at a production database.
- ML: `cd ML && python -m compileall -q .` and start the combined service; check `/health` and confirm every reported model is `true`. A `degraded` response means one or more model services did not load. Call ML inference endpoints with a bearer token issued by the backend; `/health`, `/services`, and API documentation remain public.

See **Verification status** at the end of this document for what was actually run in the current work session.

## Database and migration notes

The `User` schema now normalizes email to lowercase and creates a unique email index. Existing user-linked collections and reference arrays are unchanged; no data backfill is required for ownership enforcement. Before first startup against an existing database, find and resolve duplicate emails after lowercasing them, or MongoDB will reject the unique index build. Review any existing users without a name or password before enabling login because these fields are now required for account-based signup/login.

Two demo-only fields were added to `User`: `isDemo` and `demoExpiresAt`. No migration is needed; MongoDB supplies defaults for old users. Demo users and their linked sample financial records are deleted lazily when a new demo login runs after expiry. This is best-effort cleanup for a showcase, not a regulated retention policy.

The demo session uses the same ownership references as real users. Updates and deletes first verify that the authenticated user owns the referenced record; request-body `userId` values are ignored. Finance profiles continue to be scoped by the JWT-derived user ID.

## Troubleshooting and updates

- **Backend returns 503:** verify `MONGODB_URI` and Atlas network access. `/api/health` checks database connectivity.
- **Login/signup returns 503:** set a fresh `JWT_SECRET` of at least 32 characters.
- **Browser reports CORS failure:** match `CORS_ORIGIN` exactly to the frontend origin, including scheme and preview hostname.
- **Frontend cannot reach API:** check `VITE_API_BASE_URL`, redeploy the frontend after changing it, and check the backend project URL.
- **ML features fail:** set `VITE_ML_API_URL`, allow the frontend origin in ML `CORS_ORIGINS`, check host logs, and check `/health`. Optional Google/FRED/Fina integrations stay unavailable until their server-side keys are configured. Some individual features may also require provider credentials or external services.
- **Model import/load failure:** use Python 3.11, rebuild the Docker image after dependency changes, and confirm the expected model files remain in the ML build context. See the model inventory and current verification limits in `ENVIRONMENT_VARIABLES.md`.
- **Frontend changes:** Vite values are embedded at build time, so redeploy the frontend after changing its environment. Backend/ML runtime variables can be changed in their host settings and require a restart/redeploy according to the host.

## Verification status for this checkout

The frontend and backend dependency installs, Vite build/lint, Node syntax checks, and backend security integration suite passed in this checkout. Npm reported zero vulnerabilities after the semver-compatible dependency fixes. The security suite used a dedicated local MongoDB test database. Python 3.10 is installed, but resolving the full ML requirements on Windows repeatedly backtracked across transitive dependency versions; the install was stopped before completion. FastAPI startup, model loading, and Docker-image builds could not be run. Docker is not installed and is not required for the frontend/backend checks; it remains the recommended packaging route for the separate ML host. No Vercel preview or public deployment was performed. This is not a successful deployment claim; see the final task report for exact verification results and remaining ML blockers.
