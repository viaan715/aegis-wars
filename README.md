# Renovation Restart

A homeowner's contractor quit or disappeared mid-project. This app takes their scattered
documents (contract, receipts, texts, photos) and a short questionnaire, and generates a
**Restart Report**: timeline, work completed vs. contracted scope, money paid vs. value
received, missing documents, questions for the next contractor, and a plain-language summary
(always paired with a "this is not legal advice" disclaimer).

Covers 19 project types across kitchen/bathroom renovations, living-space overhauls, structural
additions, exterior upgrades, systems upgrades, and cosmetic refreshes — see
`src/lib/project-stages.ts` for the full list and each type's stage sequence.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Claude API (`@anthropic-ai/sdk`) for document extraction and report narrative
- Stripe Checkout for the one-time-payment paywall
- `@react-pdf/renderer` for the downloadable report PDF
- Local filesystem storage under `.data/` (uploads + project records as JSON) — swap for
  S3/Vercel Blob + a real database before deploying to a serverless/ephemeral-disk target

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the keys below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | AI document extraction + report narrative | Without it, the app runs with mocked extraction/summary text so the rest of the flow is still testable. |
| `STRIPE_SECRET_KEY` | Checkout | Without it, checkout returns a friendly "payments not configured" error. |
| `STRIPE_WEBHOOK_SECRET` | Marking payments as paid via webhook | Use `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally. There's also a fallback: the preview page verifies payment directly against the Stripe session on redirect, so checkout works end-to-end in local dev even without webhook forwarding. |
| `NEXT_PUBLIC_APP_URL` | Checkout redirect URLs, sitemap/robots | Defaults to inferring from request headers in dev; set explicitly in production. |

### Build order (matches the product brief)

1. Upload + intake questionnaire (`/start`, `/projects/[id]/upload`) — files land in `.data/uploads`, project state in `.data/projects/*.json`.
2. AI extraction (`/api/projects/[id]/extract`) + templated report (`/api/projects/[id]/report`, `src/lib/report.ts`).
3. Stripe paywall (`/api/projects/[id]/checkout`, `/api/stripe/webhook`) gating `/projects/[id]/report` and the PDF download.
4. Report formatting — `src/app/projects/[id]/report/page.tsx` (web) and `src/lib/pdf.tsx` (PDF).
5. Landing page copy + SEO (`src/app/page.tsx`, `robots.ts`, `sitemap.ts`).
6. Outreach to construction attorneys — not a code task.

## Notes for production

- Local disk storage (`.data/`) is for development. Deploying to Vercel or any environment
  with ephemeral/read-only filesystem needs persistent object storage (Vercel Blob, S3) and a
  real database in place of the JSON file store in `src/lib/store.ts`.
- Project IDs act as unguessable capability tokens in URLs; there's no user auth in v1.
