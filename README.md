# Smart Meal Planner & Grocery Tracker

A full-stack web app that generates weekly meal plans based on dietary restrictions,
calculates the exact ingredients needed for the week, tracks pantry stock, and syncs
the resulting grocery list directly to Instacart for delivery.

## Features

- **Accounts** — email/password signup & login, plus "Sign in with Google".
- **Dietary restrictions** — vegetarian, vegan, gluten-free, dairy-free, keto, low-carb,
  paleo, and nut-free, combinable per user.
- **Weekly meal plans** — breakfast, lunch, dinner, and a snack for all 7 days,
  generated from a curated recipe dataset, scaled to your household size.
- **Swap meals** — regenerate a single meal slot without redoing the whole week.
- **Favorites** — star recipes so they're prioritized in future plans.
- **Nutrition dashboard** — daily and weekly calorie/protein/carb/fat totals.
- **Pantry tracking** — mark what you already have on hand; it's subtracted from
  the generated grocery list.
- **Grocery list** — ingredients aggregated across the week, grouped by aisle
  category, with a checklist for shopping.
- **Instacart sync** — one-click button that calls the Instacart Developer
  Platform to turn your grocery list into a shoppable Instacart cart link.

## Architecture

```
├── server/   Node.js + Express + SQLite (better-sqlite3) REST API
└── client/   React + Vite + Tailwind CSS frontend
```

## Running locally with Docker Compose

```bash
cp server/.env.example server/.env   # fill in JWT_SECRET, optionally GOOGLE_CLIENT_ID / INSTACART_API_KEY
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Running without Docker

```bash
# Backend
cd server
cp .env.example .env
npm install
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

## Instacart integration

Sending a grocery list to Instacart uses the public [Instacart Developer
Platform](https://docs.instacart.com/developer_platform_api) "Create shopping
list page" endpoint. Set `INSTACART_API_KEY` (and optionally
`INSTACART_ENV=development|production`) in `server/.env`. Without a key, the
"Send to Instacart" button returns a clear error instead of a broken link —
every other feature works fully offline with no external API required.

## Google Sign-In

Set `GOOGLE_CLIENT_ID` in `server/.env` and `client/.env` (`VITE_GOOGLE_CLIENT_ID`)
to enable "Sign in with Google". Email/password auth works without any setup.
