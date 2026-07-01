# FormForge

A custom form and survey builder. Build forms with short text, choice, rating/scale, date, and file-upload questions, publish them to a shareable link, and read back the results as charts, a raw response table, or a CSV export.

## Stack

- `client/` — React + Vite frontend
- `server/` — Node/Express + SQLite (better-sqlite3) API, JWT auth

## Running locally

```bash
npm run install:all   # installs client + server dependencies
npm run dev            # runs the API on :4000 and the client on :5173 (proxied)
```

Sign up for an account, build a form, publish it, and share the `/f/:slug` link — no further setup required. SQLite data lives in `server/data/` and uploaded files in `server/uploads/` (both gitignored).

## Plans

New accounts start on the Free plan (3 forms, 100 responses per form). The dashboard's "Upgrade to Pro" button flips the account to unlimited — no real payment processor is wired up yet, so treat it as a placeholder for future billing integration.

## Production build

```bash
npm run build   # builds client/dist
npm start        # serves the API and client/dist from a single Express process
```
