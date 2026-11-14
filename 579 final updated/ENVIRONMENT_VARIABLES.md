# Environment variables

Keep secrets in the hosting provider’s server-side environment settings. Never commit `.env` files, add secrets to Vite variables, or print secret values in logs. Only `VITE_API_BASE_URL` and `VITE_ML_API_URL` are intentionally public URLs.

## Express backend

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection URI for the dedicated demo database. Store credentials in the provider secret manager. |
| `JWT_SECRET` | Yes | Random secret with at least 32 characters. Generate a new value for each environment; changing it invalidates all existing tokens. |
| `CORS_ORIGIN` | Yes in hosted use | Comma-separated exact frontend origins, including `https://`. Do not use `*`. |
| `PORT` | Host-provided | HTTP port. Defaults to `5000` locally. |
| `NODE_ENV` | Recommended | Set to `production` on hosted deployment. |

`EMAIL_SERVICE`, `EMAIL_USER`, and `EMAIL_PASS` are no longer used: reset/email routes were removed because the previous flow exposed OTPs and permitted password changes without proof of email ownership. Password reset is intentionally unavailable until it can be built with hashed, expiring, single-use tokens, rate limiting, and a verified delivery service.

## Frontend build

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes for separate backend | Public HTTPS origin for Express, no trailing slash. Example format: `https://api.example.com`. |
| `VITE_ML_API_URL` | Optional | Public HTTPS origin for the FastAPI service. If unset, ML requests use the frontend origin and will not work unless a same-origin proxy is configured. |

Vite exposes any referenced `VITE_*` variable to browser code. Do not put API keys, database credentials, JWT secrets, email passwords, private keys, or other secrets in these variables. The old local `VITE_RAPIDAPI_KEY` is not referenced by tracked frontend code and should not be configured for a public build.

## FastAPI / ML host

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Host-provided | Listening port; local default is `8000`. |
| `CORS_ORIGINS` | Yes for browser use | Comma-separated exact frontend origins. The combined API does not enable credentialed cross-origin requests. |
| `JWT_SECRET` | Yes | Must exactly match the Express backend secret. The combined ML API verifies backend-issued signed tokens and checks user IDs in path, query, and JSON request fields against the token owner. |
| `ML_PUBLIC_BASE_URL` | Optional | Public ML URL used only by the informational `/urls` endpoint. |
| `GOOGLE_API_KEY` | Optional | Server-side key for Gemini analysis and document processing. Without it those integrations are unavailable. |
| `GEMINI_MODEL` | Optional | Gemini model name; default `gemini-2.5-flash-lite`. |
| `FINA_API_KEY` | Optional | Server-side key for Fina-powered categorization/advice. No fake fallback key is used. |
| `PARTNER_ID` | Optional | Fina partner identifier. |
| `FRED_API_KEY` | Optional | Server-side key for FRED economic data. |

The ML services also call external market/news providers; some have free/public endpoints and some may require provider-specific keys or rate limits. These optional integrations were not verified in this environment. Model files found in the checkout include XGBoost transaction fraud, two card fraud pickle models plus feature columns, credit-card-default scaler/info/features/LightGBM, and a credit-score Keras model plus scaler. The ML model files total roughly 2.8 MB, but TensorFlow and the combined dependency bundle are the reason to use a separate Docker-capable host. The model file paths were changed to resolve relative to their module files.

Python 3.10 is installed on the development machine and the ML source passes `compileall`. Installing the full pinned ML dependency set on Windows did not finish because pip repeatedly backtracked through transitive constraints. FastAPI startup, model loading, inference, and the Docker image therefore remain unverified. Use the provided Dockerfile on a Linux Docker host to validate and run the full service.

## Local environment files

Use `backend/.env.example`, `frontend/.env.example`, and `ML/.env.example` as templates. Copy only the file(s) needed for local development to `.env`; those files are ignored by Git. Use a separate test MongoDB database and freshly generated test JWT key for security tests. Never copy a real production database URI or provider key into a test command or commit.

During this audit, ignored local environment files contained configured values for `JWT_SECRET`, `GOOGLE_API_KEY`, and `VITE_RAPIDAPI_KEY`. The `.env` files are not tracked in the current Git tree or its checked commit history, and their values were not printed or used for tests. Rotate the Google and RapidAPI keys if those workspace files were shared or exposed; use a newly generated JWT secret in hosting regardless. The RapidAPI value is not used by the tracked frontend source and must remain out of Vite configuration.
