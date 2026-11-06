// Runs before each build: fills a brand-new database with Gaach's starting data,
// but never touches a database that already has trees (so admin edits are kept).
// It also makes sure the private admin from ADMIN_EMAIL / ADMIN_PASSWORD exists with that password,
// and locks the public demo admin once a private admin is set.
// Then it applies one-time data updates (scripts/data-updates.ts), such as new sizes.
import { execSync } from "child_process";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { runDataUpdates } from "./data-updates";

const db = new PrismaClient();
const DEMO_ADMIN = "admin@gaach.test";

async function ensureOwnAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) return;

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    await db.user.create({ data: { email, name: "Site Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) } });
    console.log(`Created the admin account ${email}.`);
  } else {
    // ADMIN_PASSWORD always wins, so the admin can change it in Vercel and redeploy.
    const samePassword = await bcrypt.compare(password, existing.passwordHash);
    if (existing.role !== "ADMIN" || !samePassword) {
      await db.user.update({
        where: { email },
        data: { role: "ADMIN", ...(samePassword ? {} : { passwordHash: await bcrypt.hash(password, 10) }) },
      });
      console.log(`Updated the admin account ${email} to match ADMIN_EMAIL / ADMIN_PASSWORD.`);
    } else {
      console.log(`Admin account ${email} is ready.`);
    }
  }

  if (email !== DEMO_ADMIN) {
    const demo = await db.user.findUnique({ where: { email: DEMO_ADMIN } });
    if (demo && demo.role === "ADMIN") {
      await db.user.update({
        where: { id: demo.id },
        data: { role: "USER", passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10) },
      });
      await db.session.deleteMany({ where: { userId: demo.id } });
      console.log(`Locked the demo admin ${DEMO_ADMIN}.`);
    }
  }
}

(async () => {
  const trees = await db.tree.count();
  if (trees > 0) {
    console.log(`Database already has ${trees} trees; skipping the starting data.`);
  } else {
    console.log("Empty database: adding Gaach's starting data (trees, districts, guides, demo accounts)...");
    execSync("tsx prisma/seed.ts", { stdio: "inherit" });
  }
  await runDataUpdates(db);
  await ensureOwnAdmin();
  await db.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
