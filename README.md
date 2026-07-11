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
- **Shopping mode** — a full-screen, large-text, thumb-friendly version of the
  grocery checklist for use while actually walking around a store.
- **Recipe detail view** — click any planned meal to see its full ingredient
  list, step-by-step instructions, and nutrition.
- **Instacart sync** — one-click button that calls the Instacart Developer
  Platform to turn your grocery list into a shoppable Instacart cart link.
- **Browse & search recipes** — filter the full catalog by name, meal type,
  and diet, independent of what's currently planned.
- **Custom recipes** — add your own recipes (ingredients, steps, nutrition,
  diet tags); they're private to your account and participate in plan
  generation exactly like the built-in dataset.
- **Ratings** — thumbs up/down a recipe to steer future plans more strongly
  than favoriting alone.
- **Meal plan history** — every generated week is kept; browse and revisit
  past plans read-only.
- **Grocery cost estimate** — a rough per-category dollar ballpark for the
  week's list (not real store pricing — there's no pricing feed wired up).
- **Themed generation** — bias a generated week toward high-protein,
  lower-calorie, or budget-friendly recipes.
- **Drag-and-drop swapping** — drag a meal onto another day (same meal type)
  to swap their positions.
- **Email verification & password reset** — via [Resend](https://resend.com);
  optional, see below.

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

Works the same way in GitHub Codespaces or any other forwarded/remote dev
environment — open the forwarded port-5173 URL in the browser. The frontend
talks to the API through a same-origin `/api` dev-server proxy (see
`client/vite.config.js`), so there's no hardcoded `localhost` API URL to break
when the browser isn't on the same machine as the containers. Just don't set
`VITE_API_BASE_URL` in `client/.env` unless you specifically want to point at
a different, already-deployed API.

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

## Email verification & password reset

Set `RESEND_API_KEY` in `server/.env` (get one free at [resend.com](https://resend.com))
to send real verification and password-reset emails. `RESEND_FROM_EMAIL` defaults to
Resend's shared `onboarding@resend.dev` address, which works without verifying your
own domain but is best replaced with a verified sender before showing this to real
users. Without a key configured, signup and login still work fully — email
verification is a soft, non-blocking nudge (a dismissible banner), never a login
gate — and "forgot password" responds successfully without actually sending
anything, so it can't be used to enumerate registered emails either way.

## Running tests

```bash
cd server
npm test
```

Covers the meal-plan generator (diet-restriction filtering, household-size
scaling, unfulfillable-slot handling, ratings/template weighting, custom-recipe
inclusion), the grocery-list/nutrition math (ingredient aggregation, pantry
deduction, per-person nutrition — including that nutrition must *not* scale
with household size the way grocery quantities do), and the cost estimator.

## Deploying to Render

`render.yaml` in the repo root is a [Render Blueprint](https://render.com/docs/blueprint-spec)
that deploys the API as a Docker web service and the frontend as a static site.

1. In the Render dashboard: **New → Blueprint**, connect this repo. Render reads `render.yaml`.
2. It'll prompt for each env var marked "generate later" — at minimum, set `JWT_SECRET`
   to a random string (`openssl rand -hex 32`). You can leave `CLIENT_ORIGIN` and
   `VITE_API_BASE_URL` blank for now — they need URLs that don't exist until step 3.
3. Once both services deploy, copy their public URLs from the dashboard, then:
   - On `meal-planner-server` → Environment: set `CLIENT_ORIGIN` to the client's URL
     (e.g. `https://meal-planner-client.onrender.com`).
   - On `meal-planner-client` → Environment: set `VITE_API_BASE_URL` to the server's
     URL + `/api` (e.g. `https://meal-planner-server.onrender.com/api`). This is a
     build-time variable, so changing it triggers a rebuild of the static site.
4. Optionally set `GOOGLE_CLIENT_ID` (both services), `INSTACART_API_KEY`, and
   `RESEND_API_KEY` (server only), same as local setup.

**Free-tier caveats**, worth knowing before you rely on this:
- Free web services spin down after 15 minutes of inactivity and take a few
  seconds to cold-start on the next request.
- Free services have no persistent disk, so the SQLite database resets on
  every restart or redeploy — fine for trying the app out, not for real use.
  For real persistence, upgrade `meal-planner-server`'s plan in the Render
  dashboard and uncomment the `disk:` block in `render.yaml`.
