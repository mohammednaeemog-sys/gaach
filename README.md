# Gaach (গাছ): tree recommendation and shop for Bangladesh

A website that recommends trees for a user's district and planting conditions, sells saplings, gives staged care plans, and has an AI assistant limited to tree topics. Built for CSE412 (Software Engineering), East West University, from the tuned requirements specification (61 requirements).

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # then optionally add ANTHROPIC_API_KEY
npm run setup             # creates the tables and fills an empty database (never deletes data)
npm run dev               # http://localhost:3000
```

Demo accounts created by the seed:

| Role  | Email            | Password  |
|-------|------------------|-----------|
| Admin | admin@gaach.test | Admin1234 |
| User  | user@gaach.test  | User1234  |

Other commands: `npm test` (unit tests), `npm run typecheck`, `npm run build && npm start` (production), `npm run eval` (Tree Advisor evaluation, see below).

### Tree photos

Run `npm run photos` once (needs internet access to commons.wikimedia.org and upload.wikimedia.org). It downloads one openly licensed photo per tree from Wikimedia Commons into `public/trees/`, saves the photographer and license to `prisma/data/photo-credits.json`, and updates the database. Credits appear under each photo and on the `/credits` page, as the licenses require. Commit the photos and the credits file afterwards.

Admins can also upload their own photos (with a credit line) on each tree's edit page, and a separate photo for each product size (for example what a 2 ft sapling looks like on delivery). A size without its own photo shows the tree's main photo. Trees without a photo show a potted-sapling illustration.

### Home page photo

The home page hero uses `public/hero/nursery.jpg`. The current file is a placeholder cut from a design mock-up and is low resolution; replace it with your own nursery photo (landscape, at least 1600 px wide) under the same name.

### Logo

The logo is a spreading tree on grass inside a round nursery seal, drawn by `scripts/make-logo.mjs` (run `npm run logo`). It writes `public/brand/gaach-badge.svg` (full badge), `public/brand/gaach-mark.svg` (round mark used in the header and as the browser icon) and `public/brand/gaach-tree.svg`. `public/brand/gaach-badge-1024.png` is a large copy for print and social media. The lettering uses Cinzel and Noto Serif Bengali (both under the SIL Open Font License, in `scripts/fonts/`).

### The Tree Advisor (AI assistant)

The advisor is a round button in the bottom-right corner of every page (except admin, login and checkout). It opens a chat panel; on a tree page it already knows which tree you mean. The full chat page with history is at `/assistant`.

The advisor answers tree questions only: why a tree was recommended, planting and care, plant problems, comparisons and product questions, and help with trees the user bought. It never places orders, changes accounts or makes up trees.

How an answer is made (`src/modules/assistant/`):

1. `router.ts` sorts the question into an intent (recommendation explanation, care, troubleshooting, comparison, product, personal, and so on) and refuses clearly off-topic, manipulative or privacy-breaking questions before any AI call.
2. `tools.ts` gives the AI nine read-only tools: search the catalogue, tree details, recommendation results, compare trees, product price and stock, the user's saved sites, the user's purchased trees, care plans, and a search over the care guides. The user always comes from the login session, never from the question.
3. `retrieval.ts` searches the care guides (`prisma/data/knowledge.ts`, 27 guides split into sections, with English and Bangla word matching). Answers show the guides and records they used as "Based on" chips.
4. For plant problems, the advisor asks one question at a time (which leaves, watering, soil, recent changes) before giving likely causes and careful next steps.
5. `validate.ts` checks every answer: prices and stock must come from this turn's tool results, or the AI is asked to correct itself.
6. The conversation keeps a short memory (the tree, the site and the problem being discussed).

**Turning on the AI (free).** Get a free Google Gemini key at https://aistudio.google.com/apikey (sign in with a Google account, press "Create API key"; no card needed). Put it in `.env` as `GEMINI_API_KEY="..."` and restart the site. The advisor uses `gemini-3.8-flash` and switches to `gemini-3.5-flash-lite` when the first model is over its free limit. Free limits are per minute and per day; when they run out, the advisor answers from Gaach's data until they reset. On the free tier Google may use the prompts to improve its products, so don't type private information.

**Paid option.** Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) to use Claude instead. If both keys are set, Claude is used unless `AI_PROVIDER="gemini"`.

Without any key, or if the AI service fails, the advisor answers from the same tools and guides without AI (in English only), and the rest of the site keeps working.

If the advisor is not working, sign in as admin and open **Admin > AI status & review**. "Test the AI connection" shows the exact problem (missing key, rejected key, unknown model, billing or usage limit). The same page lists refused questions with the reason, and how often each intent and tool is used.

**Care guides and review.** Guides are public at `/guides`. Each guide and tree record shows its source and whether a person has reviewed it. All guides start as "not reviewed yet"; an admin marks them reviewed under **Admin > Care guides** after checking them against the source. Re-running the seed does not reset review status.

**Evaluation.** `npm run eval` runs 140 test conversations (catalogue, recommendations, care, multi-turn and personal questions, missing information, off-topic and safety cases) plus 30 guide-search checks, and writes `evals/REPORT-offline.md`. `npm run eval -- --ai` runs the same set through the configured AI service (Gemini or Claude). Current offline result: 140/140 cases and 30/30 guide searches.

**Demo data.** `user@gaach.test` has two saved sites ("Rooftop" in Dhaka and "Village backyard" in Khulna) and a delivered lemon tree, so personal questions like "what should I do for my lemon this week?" work straight away.

**Known limits.** The care guides are written from general horticultural references and have not been reviewed by an expert yet. Offline answers are in English even when asked in Bangla. The AI-mode evaluation has not been run in this build because no API key was available.

After updating from an older version, run `npx prisma db push` and then `npm run db:seed` to add the new tables and data.

## Tech stack

- Next.js 15 (App Router) with TypeScript: pages and server logic in one codebase
- Prisma ORM with PostgreSQL (free on Neon; see DEPLOY.md)
- Tailwind CSS 4, mobile first
- Claude API (`@anthropic-ai/sdk`) for the assistant
- bcrypt password hashing, database-backed sessions with idle timeout

## Project layout

Code is split into the modules named in NFR-5.3:

```
src/modules/accounts        registration, login, sessions, profile, saved sites
src/modules/catalogue       browse, search, filters, compare list
src/modules/recommendation  engine.ts (matching and ranking), weights.ts (tunable scores)
src/modules/shop            cart, checkout, orders (stock-safe transaction), payment gateway
src/modules/care            care stage calculation, planted date
src/modules/assistant       context building, Claude call, offline fallback, refusal logging
src/modules/admin           tree/product/care/region/order management, uploads
src/app                     pages and routes
prisma/                     schema, seed script and seed data (districts, regions, trees, care)
tests/                      unit tests (node:test)
scripts/                    assistant scope evaluation
```

## How the recommendation works

1. The district maps to a regional profile (rainfall, flood, drought, salty soil), editable by admins.
2. Trees are removed if they cannot survive the region, are wider than the available space, or do not tolerate the sunlight.
3. The rest are scored on soil, purpose, regional strengths, room to spare and preferred sunlight, using the weights in `src/modules/recommendation/weights.ts`.
4. Each result gets a match level and a plain-language reason. If nothing qualifies, the page names the condition that removed the most trees and suggests how to relax it.

Ties are broken by name and id, so identical inputs always give the same ranking.

## Requirement coverage

| Area | Where |
|------|-------|
| FR-1 Accounts and access | `/register`, `/login`, `/account`; role checks in `modules/accounts/session.ts` and every admin action |
| FR-2 Location and conditions | `/recommend` form (division/district dropdowns, validated inputs), saved sites |
| FR-3 Recommendation | `modules/recommendation`, results with reasons, no-match advice, refine via URL, handoff buttons |
| FR-4 Information and comparison | `/trees`, `/trees/[slug]`, `/compare` (2 or 3 trees) |
| FR-5 E-commerce | `/cart`, `/checkout`, `/orders`; cash on delivery and test-mode gateway (`/pay/test/[id]`); stock reduced in one transaction |
| FR-6 Post-purchase care | `/my-trees` with current stage, full plan, and problem help through the assistant |
| FR-7 AI Assistant | `/assistant`, `modules/assistant`; fixed refusal, personal context, grounded answers, conversation memory |
| FR-8 Administration | `/admin`: trees (publish rules, images), products, care content, regions and districts, delivery fee, orders, refused questions |

## Turning it into an app

The site is installable as a Progressive Web App on Android (it has a web manifest). Next steps for native apps:

- Android/iOS: wrap the site with Capacitor, or build a React Native (Expo) app against the same server.
- Desktop: wrap the site with Tauri or Electron.

All business logic lives on the server, so the apps can reuse it without changes.

## Forgot password (free email)

"Forgot password?" on the log in page emails a one-time link that works for 30 minutes.
Using it signs the user out on every other device.

To send real emails for free with Gmail:

1. Turn on 2-Step Verification in your Google account.
2. Open https://myaccount.google.com/apppasswords and create an app password named "Gaach".
3. In `.env`, set `SMTP_USER="you@gmail.com"` and `SMTP_PASS="the16letterpassword"` (no spaces), then restart.

Without these, the link is printed in the terminal where `npm run dev` runs, which is handy for testing.
Admins can also make a reset link under Admin → Users and send it to the person themselves.
After changing `prisma/schema.prisma`, run `npx prisma db push` once to add the new table.

## Photo check (free, uses the Gemini key)

In the Tree Advisor chat, the 📷 button lets a user send a photo of a sick plant
(with an optional note like "lemon, leaves yellowing"). Gemini looks at it and replies with
the most likely problem and how sure it is, other possibilities, safe next steps, and links
to Gaach's own care guides. Blurry photos get a request for a better one instead of a guess.
The photo is shrunk in the browser before upload and is never stored; only the text answer
is saved in the chat history. Needs `GEMINI_API_KEY` in `.env`.

Google's free Gemini models are sometimes overloaded. The site tries
gemini-3.5-flash, then gemini-3.8-flash, then gemini-3.5-flash-lite, skips any model that
was busy in the last 3 minutes, and after 50 seconds answers from Gaach's own data instead.

## Going online

The database is PostgreSQL (free on Neon) and admin photos go to Vercel Blob when deployed.
`npm run build` syncs the schema and fills an empty database once (it never overwrites data).
Step-by-step free deployment: see [DEPLOY.md](DEPLOY.md).
