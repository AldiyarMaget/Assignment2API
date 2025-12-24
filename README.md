# Assignment2API

Short version: this repository provides a small Express service that fetches a random user, enriches it with country data, exchange rates, and news headlines, and serves both a JSON API and a minimal static frontend. The server centralizes heavy logic in src/core.js. Read on for setup, API usage, and why things are implemented the way they are.
## Structures
```
Assignment2API/
  server.js
  package.json
  .env.example
  src/
    core.js           
  routes/
    api.js
  public/
    index.html
    styles.css
    app.js            
```

1. Setup (quick start)

Clone repository:

git clone <repo-url>
cd <repo-folder>


Create .env in project root (example below) and do not commit it to Git.

Install dependencies:

npm install


Start (development):

npx nodemon server.js

node server.js


Open browser:

http://localhost:3000

2. Environment variables

Place the following keys in your .env in project root:

PORT=3000
RESTCOUNTRIES_API_KEY=   # optional: when using a provider that requires a key
EXCHANGE_API_KEY=YOUR_EXCHANGE_API_KEY_HERE
NEWS_API_KEY=YOUR_NEWS_API_KEY_HERE


PORT — optional (default 3000).

EXCHANGE_API_KEY — required for exchange rates endpoint to return real data.

NEWS_API_KEY — required for news fetching.

RESTCOUNTRIES_API_KEY — optional; the code supports sending a header if present.

Important: load .env before any require() that reads process.env. See Troubleshooting #1.

4. Running

Suggested package.json scripts (if missing):

"scripts": {
"start": "node server.js",
"dev": "nodemon server.js"
}


Development:

npm run dev


Production:

Ensure environment variables are available to the runtime (systemd, Docker, pm2, cloud provider).

Run npm start.

5. API endpoints
   GET /api/user-full

Description: orchestrator endpoint. Returns a random user and enrichment (country, currency, exchange rates, news).

Example request
curl http://localhost:3000/api/user-full

Successful response (200)
{
"success": true,
"data": {
"user": {
"firstName": "John",
"lastName": "Doe",
"gender": "male",
"picture": "https://...",
"age": 34,
"dob": "1990-01-01T00:00:00.000Z",
"city": "Almaty",
"country": "Kazakhstan",
"street": "123 Main St"
},
"country": {
"name": "Kazakhstan",
"capital": "Nur-Sultan",
"languages": ["Kazakh","Russian"],
"currencies": ["KZT"],
"currencyObjects": { "KZT": { "name": "Tenge", ... } },
"flag": "https://...",
"cca2": "KZ",
"cca3": "KAZ"
},
"currency": { "code":"KZT", "name":"Tenge" },
"exchange": {
"base": "KZT",
"toUSD": "1 KZT = 0.0023 USD",
"toKZT": "1 KZT = 1 KZT"
},
"news": [
{ "title":"Kazakhstan news ...", "image":"...", "description":"...", "url":"...", "source":"..." },
...
]
}
}

Possible fallback responses

exchange might be null or exchange.base absent: front-end will show "Курсы недоступны (проверьте EXCHANGE_API_KEY)".

news may be an empty array: front-end shows "Новостей не найдено (или NEWS_API_KEY не задан)".

On server error:

{ "success": false, "message": "Server error", "error": "..." }

GET /api/random-user

Returns a trimmed random-user object (used separately if needed).

Example:

curl http://localhost:3000/api/random-user


Response:

{ "success": true, "user": { "firstName":"...", "lastName":"...", ... } }

6. Frontend usage

Static files in public/ are served at root. public/app.js calls GET /api/user-full when you click the button and renders cards.

Notes:

The front-end is intentionally minimal: rendering logic lives client-side but heavy API calls are server-side (core.js).

If you want to fetch the API directly from the browser without the static frontend, call the endpoints above.

7. Key design decisions & explanations

Separation of concerns: Routes are thin wrappers (routes/api.js) that call src/core.js. Heavy logic (HTTP calls, retries, parsing) lives in core.js. This keeps routes small and simplifies testing.

Single axios instance: http = axios.create({ timeout: 5000, headers: {...} }) for consistency and to centralize timeout and user-agent.

Retry wrapper: requestWithRetry(config, maxRetries = 3) implements:

Retry for network errors and 5xx responses.

Exponential backoff with jitter (reduces thundering herd).

Controlled max retries to avoid indefinite loops.

Purpose: increase resilience to transient failures from external APIs.

Fail-safe / fallbacks:

fetchRandomUser returns demo user data on failure (prevents frontend crash).

fetchExchangeRates and fetchNews return null/[] rather than throwing — front-end shows informative messages.

Reading env vars:

Current code reads API keys at module load (const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;). This is simple and fast but requires that .env be loaded before the module is imported. For robustness you can:

Always call require('dotenv').config() at the very top of the entry file; or

Read process.env inside the functions (preferred for hot-reload / dynamic env changes).

Client-side simplicity: front-end is intentionally thin to keep logic centralized and secure (API keys are never exposed to client).

8. Troubleshooting
1) Frontend shows:
   Курсы недоступны (проверьте EXCHANGE_API_KEY)
   Новостей не найдено (или NEWS_API_KEY не задан)


Likely cause: environment variables are not available to src/core.js at module load.
Fixes:

Ensure dotenv.config() is called before any require() that loads src/core.js. Example top of server.js:

// server.js
require('dotenv').config();       // <-- must be first
const express = require('express');
const apiRoutes = require('./routes/api'); // imports core.js indirectly
...


Alternatively, in core.js read keys at function call time:

async function fetchExchangeRates(baseCurrency) {
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
if (!EXCHANGE_API_KEY) return null;
...
}


Confirm your .env is in the same path where you start the node process.

2) Keys are present but still no data

Check you didn't accidentally commit wrong key names; confirm exact casing EXCHANGE_API_KEY, NEWS_API_KEY.

Inspect server console for warnings printed by requestWithRetry or fetchExchangeRates / fetchNews. Example debug prints:

requestWithRetry attempt 1 failed for GET https://... — code=ENOTFOUND status=undefined message=...

fetchExchangeRates error for KZT ENOTFOUND

External APIs may return:

401/403 (invalid/expired key) — check provider dashboard.

429 (rate limit) — implement caching or reduce calls.

Test endpoints directly:

curl http://localhost:3000/api/user-full | jq .

3) .env not loaded in production (Docker, pm2)

In Docker, set environment variables with -e flags or in the image configuration.

With pm2, use an ecosystem file or pm2 start server.js --env production with env variables set.

9. Improvements & TODOs

Move env reads to runtime (inside functions) or force dotenv load very early.

Add a /health endpoint for monitoring.

Add server-side caching for exchange rates and news (Redis or in-memory TTL) to reduce API calls and latency.

Add unit/integration tests around requestWithRetry using nock.

Expose more options on API (e.g., ?country=... or ?pageSize=...) with validation.

Add rate-limiting for public API usage (express-rate-limit).

Replace NewsAPI query to use top-headlines for better relevance and introduce fallback search queries.

10. Example code snippets
    Ensure .env loads before modules (server.js)
    // server.js (entry point)
    require('dotenv').config();    // LOAD .env first
    const express = require('express');
    const cors = require('cors');

const apiRoutes = require('./routes/api'); // core.js will read process.env if needed

const app = express();
// ...

Runtime env read inside function (core.js)
async function fetchExchangeRates(baseCurrency) {
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY; // read now
if (!EXCHANGE_API_KEY) return null;
const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/${encodeURIComponent(baseCurrency)}`;
...
}

11. Contributing & contact

Open an issue for bugs or feature requests.

Push a branch, open PR with a short description and tests if applicable.