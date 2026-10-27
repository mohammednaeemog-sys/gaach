# Put Gaach online for free (Vercel)

Everything here uses free plans with no card: Vercel runs the site, Neon holds the
database, and Vercel Blob holds admin photos. Takes about 15 minutes.

## 1. Make a Vercel account
Go to https://vercel.com/signup and sign up (Hobby plan, free). Signing up with Google or email is fine.

## 2. Create the project from VS Code
In the VS Code terminal, inside the gaach folder:

    npx vercel@latest login
    npx vercel@latest link

For `link`, answer: set up "yes", your account as the scope, link to existing project "no",
name `gaach` (or any name), code directory `./`, and "no" to changing settings.

## 3. Add the free database and photo storage
Open https://vercel.com/dashboard, click your gaach project, then the **Storage** tab.

1. **Create Database → Neon (Serverless Postgres) → Free plan**, region Singapore (closest to
   Bangladesh). Connect it to the project for all environments. This adds `DATABASE_URL`.
2. **Create → Blob → Create**. Connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`.

## 4. Add your settings
In the project go to **Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `ADMIN_EMAIL` | the email you will log in to admin with |
| `ADMIN_PASSWORD` | a long private password (letters and numbers) |
| `GEMINI_API_KEY` | your Gemini key |
| `SMTP_USER` | your Gmail address (for forgot-password emails) |
| `SMTP_PASS` | your Gmail App password |

Important: set ADMIN_EMAIL and ADMIN_PASSWORD before step 5. Otherwise the admin login
becomes the demo one (admin@gaach.test / Admin1234), which anyone could use.

## 5. Go live

    npx vercel@latest --prod

The first build fills the database with the trees, districts and guides. At the end it prints
your address, like `https://gaach.vercel.app`. Open it on any phone or computer.

To publish changes later, run `npx vercel@latest --prod` again. Your data is kept.

## 6. Run it on your computer with the same database
The site now uses PostgreSQL instead of the old dev.db file. Get the online settings:

    npx vercel@latest env pull .env.local

Then open `.env.local`, copy the `DATABASE_URL` line, and paste it over the
`DATABASE_URL` line in `.env` (Prisma reads `.env`). Run `npm run dev` as usual.

Note: trees, photos or orders you added in the old local version (dev.db) are not copied.
Add them again in Admin, or ask for a copy script.

## Free plan limits (plenty for a small shop)
- Vercel Hobby: free for personal, non-commercial projects. A business that sells for real
  should move to Vercel Pro later.
- Neon free: 0.5 GB of data. The database sleeps when idle, so the first visit after a
  quiet spell can take a few seconds.
- Vercel Blob free: 1 GB of photos.
- Gmail: about 500 emails a day.
