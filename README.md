<div align="center">

<img src="public/brand/gaach-badge.svg" alt="Gaach logo" width="140" />

# Gaach (গাছ)

**Find the right tree for your place in Bangladesh, buy a healthy sapling, and get help keeping it alive.**

### 🌐 Live site: **[gaach.vercel.app](https://gaach.vercel.app/)**

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL · Google Gemini

</div>

---

## Contents

- [About the project](#about-the-project)
- [Features](#features)
- [Screens and pages](#screens-and-pages)
- [Tech stack](#tech-stack)
- [Getting started (run it on your computer)](#getting-started-run-it-on-your-computer)
- [Environment variables](#environment-variables)
- [Admin access](#admin-access)
- [How the recommendation works](#how-the-recommendation-works)
- [The Tree Advisor (AI assistant)](#the-tree-advisor-ai-assistant)
- [Photo check for sick plants](#photo-check-for-sick-plants)
- [Shop, reviews and accounts](#shop-reviews-and-accounts)
- [Deploying for free](#deploying-for-free)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Testing and evaluation](#testing-and-evaluation)
- [Requirement coverage](#requirement-coverage)
- [Security and privacy](#security-and-privacy)
- [Known limits and future work](#known-limits-and-future-work)
- [Author](#author)

---

## About the project

Many saplings planted in Bangladesh die in their first year. Usually the tree simply didn't suit the place: too much shade, salty soil in the south, flood-prone land, or a big tree squeezed into a rooftop pot.

**Gaach** (Bangla for *tree*) solves this in three steps:

1. **Recommend.** The user enters their district, available space, sunlight, soil and goal (fruit, shade, flowers, timber...). Gaach suggests trees that will actually survive there and explains why.
2. **Buy.** The user orders healthy saplings in different sizes, with cash on delivery to all 64 districts.
3. **Care.** After buying, the user gets a care plan for each stage of the tree's life, an AI Tree Advisor that answers questions, and a photo check for sick plants.

The project was built for **CSE412 (Software Engineering) at East West University, Dhaka**, from a requirements specification of 61 functional and non-functional requirements.

---

## Features

### For visitors and customers

| Feature | What it does |
|---|---|
| 🌳 **Tree finder** | Recommends trees for a district and planting conditions. Results are photo cards with a match score, a plain-language reason, and Buy and Compare buttons. |
| 🔎 **Browse and search** | All trees with filters (purpose, size, sunlight, soil), search in English or by scientific name, and star ratings on each card. |
| ⚖️ **Compare** | Puts 2 or 3 trees side by side (size, sunlight, water, soil, years to fruit, price). |
| 🛒 **Cart and checkout** | Several sizes per tree, a cart with +/− steppers, a stock-safe checkout, and cash on delivery. |
| 📦 **Orders and My trees** | Order history, plus a "My trees" page showing each tree's current growth stage and what to do now. |
| 🤖 **Tree Advisor** | An AI chat that answers only tree questions, using Gaach's own data and the user's own trees and sites. |
| 📷 **Photo check** | The user sends a photo of a sick plant and gets the likely problem, safe next steps and links to care guides. |
| ⭐ **Ratings and reviews** | 1 to 5 stars and comments on each tree, with a "Bought from Gaach" badge for real buyers. |
| 📚 **Care guides** | Public guides on watering, pests, diseases, fertiliser, pots and more. |
| 🔑 **Forgot password** | The user gets a reset email automatically (free, through Gmail). The link works once, for 30 minutes. |
| 📬 **Contact and newsletter** | A contact form and newsletter sign-up in the footer. |
| 📄 **Info pages** | About, Contact, Privacy policy, Terms, Refund and return policy, Community guidelines. |
| 📱 **Mobile first** | Works on phones, fills wide screens up to 1400 px, and can be installed as an app (PWA). |
| 🍃 **Living design** | Calm falling leaves across the site; tap one and it spins away with a small burst. Animations turn off for people who prefer reduced motion. |

### For the admin

| Area | What the admin can do |
|---|---|
| **Trees and products** | Add and edit trees, publish rules, upload photos with credits, sizes, prices, stock and care stages. |
| **Orders** | See all orders and change their status. Cancelling returns the stock. |
| **Users** | See accounts, send a test email, email a reset link to someone, and see every email the site tried to send (Recent emails). |
| **Reviews** | Hide, show or delete reviews. |
| **Site info and messages** | Edit the hotline, addresses, email and social links in the footer. Read contact messages and see newsletter sign-ups. |
| **Regions and delivery** | Edit regional climate profiles, assign districts, and set the flat delivery fee. |
| **Care guides** | Review guides and mark them as checked. |
| **AI status and review** | Test the AI connection, see which questions were refused and why, and see tool usage. |

---

## Screens and pages

| Page | Path |
|---|---|
| Home | `/` |
| Find trees for my place | `/recommend` |
| Browse all trees | `/trees` |
| Tree details, sizes and reviews | `/trees/[slug]` |
| Compare | `/compare` |
| Tree Advisor | `/assistant` (also a chat button on every page) |
| Care guides | `/guides` |
| Cart, Checkout | `/cart`, `/checkout` |
| My orders, My trees | `/orders`, `/my-trees` |
| Account and saved sites | `/account` |
| Log in, Register, Forgot password | `/login`, `/register`, `/forgot-password` |
| About, Contact | `/about`, `/contact` |
| Policies | `/privacy`, `/terms`, `/refund-policy`, `/community-guidelines` |
| Photo credits | `/credits` |
| Admin dashboard | `/admin` |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 15** (App Router, Server Components, Server Actions) |
| Language | **TypeScript** |
| UI | **React 19**, **Tailwind CSS 4**, custom CSS animations |
| Database | **PostgreSQL** (Neon, free tier) |
| ORM | **Prisma 6** |
| Validation | **Zod** |
| Auth | Email and password, **bcrypt** hashing, database sessions with idle timeout |
| AI | **Google Gemini** (free tier, with model fallback); Claude (Anthropic) also supported |
| Email | **Nodemailer** through Gmail SMTP (free) |
| File storage | **Vercel Blob** online, local `uploads/` folder in development |
| Hosting | **Vercel** (Hobby, free) |
| Tests | Node's built-in test runner (`node:test`) with `tsx` |

---

## Getting started (run it on your computer)

### Requirements

- **Node.js 20 or newer** (`node -v` to check)
- A **PostgreSQL** database. The easiest free option is [Neon](https://neon.tech), or a local PostgreSQL.

### Steps

```bash
# 1. Install packages
npm install

# 2. Create your settings file
cp .env.example .env       # on Windows: copy .env.example .env
#    then open .env and paste your DATABASE_URL (see below)

# 3. Create the tables and fill the database with trees, districts and guides
npm run setup

# 4. Start the site
npm run dev
```

Open **http://localhost:3000**.

`npm run setup` is safe to run again: it never deletes data. To wipe the database and start fresh, use `npm run db:reset`.

### Demo account (for local testing only)

| Role | Email | Password |
|---|---|---|
| User | `user@gaach.test` | `User1234` |

This demo user has two saved sites and a delivered lemon tree, so "My trees" and personal Advisor questions work straight away.

Locally, if `ADMIN_EMAIL` is not set, a demo admin is also created for testing. Online it is always locked (see [Admin access](#admin-access)).

---

## Environment variables

Copy `.env.example` to `.env`. **Never commit `.env`**; it is already in `.gitignore`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (`postgresql://...`). |
| `ADMIN_EMAIL` | Online | Email of the site owner's admin account. |
| `ADMIN_PASSWORD` | Online | Password for that admin account. |
| `GEMINI_API_KEY` | Optional | Turns on the AI Tree Advisor and photo check. Free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | Optional | Forces one Gemini model instead of the automatic fallback list. |
| `ANTHROPIC_API_KEY` | Optional | Uses Claude instead of Gemini (paid). |
| `AI_PROVIDER` | Optional | `gemini` or `claude`, when both keys are set. |
| `SMTP_USER` | Optional | Gmail address that sends password reset and contact emails. |
| `SMTP_PASS` | Optional | The 16-letter Gmail **App password** (not the normal password). |
| `SMTP_HOST`, `SMTP_PORT` | Optional | Another email server (default Gmail, 465, with 587 as fallback). |
| `APP_URL` | Optional | The public site address used in email links. |
| `BLOB_READ_WRITE_TOKEN` | Online | Added by Vercel when the Blob store is connected; stores admin photos. |

Without a Gemini key, the site still works: the Advisor answers from Gaach's own data. Without email settings, the forgot-password page says email is not working, and reset links are printed in the terminal.

---

## Admin access

The site owner and administrator is **Mohammed Naeem**.

The admin login is **never stored in the code or in this repository**. It is set privately as environment variables (`ADMIN_EMAIL` and `ADMIN_PASSWORD`) in Vercel's project settings.

On every build, `scripts/seed-if-empty.ts`:

1. creates the admin account from those variables if it doesn't exist, or makes sure it is an admin with that password;
2. locks the public demo admin (`admin@gaach.test`) by turning it into a normal user with a random password.

To change the admin password, edit `ADMIN_PASSWORD` in Vercel and redeploy.

---

## How the recommendation works

Code: `src/modules/recommendation/`

1. **Region.** The district maps to a regional profile: rainfall, flooding, drought and salty soil. Admins can edit these profiles.
2. **Filter.** Trees are removed if they can't survive the region, are wider than the space available, or don't tolerate the sunlight.
3. **Score.** The remaining trees are scored on soil, purpose, regional strengths, room to spare and preferred sunlight. The weights are in `weights.ts`, so they're easy to tune.
4. **Explain.** Each result gets a match level and a plain-language reason. If nothing qualifies, the page names the condition that removed the most trees and suggests how to relax it.

Ties are broken by name and id, so the same inputs always give the same ranking.

---

## The Tree Advisor (AI assistant)

Code: `src/modules/assistant/`

The Advisor is the round button in the bottom-right corner of every page. The full chat with history is at `/assistant`. On a tree page, it already knows which tree you mean.

It answers **tree questions only**: why a tree was recommended, planting and care, plant problems, comparisons, products, and help with the trees the user bought. It never places orders, changes accounts or invents trees.

**How an answer is made:**

1. `router.ts` sorts the question by intent and refuses off-topic, manipulative or privacy-breaking questions **before** any AI call.
2. `tools.ts` gives the AI nine **read-only** tools: catalogue search, tree details, recommendations, compare, product price and stock, the user's saved sites, the user's trees, care plans, and guide search. The user always comes from the login session, never from the question.
3. `retrieval.ts` searches the care guides (English and Bangla word matching). Answers show their sources as "Based on" chips.
4. For plant problems, it asks one question at a time before suggesting causes.
5. `validate.ts` checks every answer. Prices and stock must match this turn's tool results, or the AI is asked to correct itself.

**Reliability.** Free Gemini models are sometimes busy. The site tries `gemini-3.5-flash`, then `gemini-3.8-flash`, then `gemini-3.5-flash-lite`, skips any model that was busy in the last 3 minutes, and after 50 seconds answers from Gaach's own data instead. **Admin → AI status & review** shows the exact problem if the AI isn't working.

---

## Photo check for sick plants

Code: `src/modules/assistant/photo.ts`, `src/app/api/photo-check/route.ts`

In the Advisor chat, the 📷 button lets a user send a photo, with an optional note such as "lemon, leaves yellowing". The reply gives:

- the most likely problem and how sure it is,
- other possibilities,
- safe next steps and things to avoid,
- links to Gaach's own care guides.

Blurry photos get a request for a better photo instead of a guess. The photo is shrunk in the browser before upload and is **never stored**; only the text answer is saved. Users are limited to 5 checks per minute.

---

## Shop, reviews and accounts

- **Cart and checkout.** Stock is checked and reduced in a single database transaction, so two people can't buy the last sapling at once. Payment is cash on delivery. A test-mode online gateway is included for demonstration.
- **Delivery.** One flat fee, set by the admin, for all 64 districts.
- **Reviews.** One review per user per tree. Reviewers who bought the tree get a "Bought from Gaach" badge. Admins can hide reviews that break the community guidelines.
- **Accounts.** Passwords are hashed with bcrypt. Sessions are stored in the database and expire when idle. A password reset signs the user out on every device.
- **Footer details.** The hotline, addresses and social links are edited in **Admin → Site info & messages**. Empty fields are hidden, so no placeholder contact details ever appear.

---

## Deploying for free

The live site, **[gaach.vercel.app](https://gaach.vercel.app/)**, runs on **Vercel** (free Hobby plan) with a **Neon** PostgreSQL database and **Vercel Blob** for photos. Full step-by-step guide: **[DEPLOY.md](DEPLOY.md)**.

Short version:

1. Create a Vercel project and link it: `npx vercel@latest link`.
2. In Vercel → Storage, connect a **Neon** database (prefix `DATABASE`) and a **public Blob store** (with a read-write token).
3. Add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GEMINI_API_KEY`, `SMTP_USER` and `SMTP_PASS` as environment variables.
4. Publish with `npx vercel@latest --prod`, or connect this GitHub repository so every push deploys automatically.

The build (`npm run build`) syncs the database schema, fills an empty database once, sets up the admin, and then builds the site. It never overwrites existing data.

---

## Project structure

```
gaach/
├── prisma/
│   ├── schema.prisma          database tables
│   ├── seed.ts                starting data
│   └── data/                  trees, districts and regions, care stages, care guides
├── public/                    logo, photos, icons
├── scripts/
│   ├── seed-if-empty.ts       runs on every build: first-time data and admin setup
│   ├── eval-assistant.ts      Tree Advisor evaluation
│   ├── fetch-tree-photos.ts   downloads openly licensed tree photos
│   └── make-logo.mjs          draws the logo
├── src/
│   ├── app/                   pages and API routes (Next.js App Router)
│   ├── components/            UI components (Header, Footer, Chat, TreeCard, forms...)
│   ├── lib/                   database client, email, formatting, helpers
│   └── modules/
│       ├── accounts/          register, login, sessions, profile, password reset
│       ├── catalogue/         browse, search, filters, compare
│       ├── recommendation/    matching engine and weights
│       ├── shop/              cart, checkout, orders, payment
│       ├── care/              care stages and planted dates
│       ├── assistant/         Tree Advisor, AI providers, tools, photo check
│       ├── reviews/           ratings and comments
│       ├── site/              footer details, contact form, newsletter
│       └── admin/             admin actions and uploads
├── tests/                     unit tests
├── DEPLOY.md                  free hosting guide
└── vercel.json                Vercel settings (Next.js, Singapore region)
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server at http://localhost:3000 |
| `npm run setup` | Creates the tables and fills an empty database (safe to repeat) |
| `npm run build` | Syncs the database, sets up first-time data and the admin, then builds |
| `npm start` | Runs the production build |
| `npm test` | Runs the unit tests |
| `npm run typecheck` | Checks TypeScript types |
| `npm run eval` | Runs the Tree Advisor evaluation (add `-- --ai` to use the AI) |
| `npm run db:reset` | ⚠️ Deletes everything and re-seeds the database |
| `npm run photos` | Downloads tree photos from Wikimedia Commons |
| `npm run logo` | Redraws the logo files |

---

## Testing and evaluation

- **Unit tests** (`npm test`): 44 tests covering the recommendation engine, care stages, passwords, password reset tokens, the Advisor's routing and AI fallback, and photo check parsing.
- **Advisor evaluation** (`npm run eval`): 140 test conversations (catalogue, recommendations, care, multi-turn, personal questions, missing information, off-topic and safety cases) plus 30 guide-search checks. Offline result: 140/140 and 30/30. The report is written to `evals/REPORT-offline.md`.
- **Browser checks.** Key flows (cart, checkout, reviews, photo check, contact and newsletter forms) were tested in a real browser on desktop and phone sizes.

---

## Requirement coverage

| Area | Where |
|---|---|
| FR-1 Accounts and access | `/register`, `/login`, `/account`, `/forgot-password`; role checks in `modules/accounts/session.ts` |
| FR-2 Location and conditions | `/recommend` form (division and district dropdowns, validated inputs), saved sites |
| FR-3 Recommendation | `modules/recommendation`, reasons, no-match advice, refine via URL |
| FR-4 Information and comparison | `/trees`, `/trees/[slug]`, `/compare` |
| FR-5 E-commerce | `/cart`, `/checkout`, `/orders`; cash on delivery and test gateway; stock-safe transaction |
| FR-6 Post-purchase care | `/my-trees` with current stage and full plan; problem help through the Advisor |
| FR-7 AI assistant | `/assistant`, `modules/assistant`; fixed refusals, personal context, grounded answers, memory |
| FR-8 Administration | `/admin`: trees, products, care content, regions, delivery fee, orders, users, reviews, site info, AI review |

---

## Security and privacy

- No passwords, API keys or personal contact details are stored in this repository. All secrets live in environment variables.
- Passwords are hashed with bcrypt. Reset tokens are stored only as SHA-256 hashes, expire after 30 minutes and are limited to 3 per hour.
- Every admin page and action checks the admin role on the server.
- Forms are validated on the server with Zod. The contact and newsletter forms have a hidden bot trap and rate limits.
- Plant photos sent for a check are not stored.
- Redirects only go to paths on this site.

---

## Known limits and future work

- The care guides come from general horticultural references and haven't been reviewed by an expert yet.
- Offline Advisor answers (when no AI is available) are in English only.
- Online payment is a test-mode gateway; a real bKash, Nagad or SSLCommerz integration is future work.
- Possible next steps: native Android and iOS apps (Capacitor or Expo, reusing the same server), Bangla interface, and order tracking with courier updates.

---

## Author

**Mohammed Naeem**
Computer Science and Engineering student, East West University, Dhaka

- GitHub: [@mohammednaeemog-sys](https://github.com/mohammednaeemog-sys)
- Live site: [gaach.vercel.app](https://gaach.vercel.app/)
- Role: designer, developer and administrator of Gaach

Tree photos are credited on the [photo credits](https://gaach.vercel.app/credits) page under their open licenses. Fonts (Cinzel, Fraunces, Poppins, Noto Serif Bengali) are under the SIL Open Font License.

<div align="center">

🌱 *Plant the right tree in the right place.*

</div>
