// Forgot-password links: one use, expiry, rate limit, and sign-out everywhere.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { createResetToken, findValidReset, redeemResetToken } from "../src/modules/accounts/reset";
import { verifyPassword } from "../src/modules/accounts/password";

async function freshUser() {
  await db.user.deleteMany({ where: { email: "reset-test@gaach.test" } });
  return db.user.create({ data: { email: "reset-test@gaach.test", name: "Reset Test", passwordHash: await bcrypt.hash("OldPass123", 10) } });
}

after(async () => {
  await db.user.deleteMany({ where: { email: "reset-test@gaach.test" } });
  await db.$disconnect();
});

test("a reset link changes the password once and logs out other sessions", async () => {
  const u = await freshUser();
  await db.session.create({ data: { id: "reset-test-session", userId: u.id, expiresAt: new Date(Date.now() + 3600_000), lastSeenAt: new Date() } });
  const token = await createResetToken(u.id);
  assert.ok(token);
  assert.ok(await findValidReset(token!));
  const done = await redeemResetToken(token!, "NewPass456");
  assert.equal(done?.email, u.email);
  const after1 = await db.user.findUniqueOrThrow({ where: { id: u.id } });
  assert.ok(await verifyPassword("NewPass456", after1.passwordHash));
  assert.equal(await db.session.count({ where: { userId: u.id } }), 0);
  assert.equal(await redeemResetToken(token!, "Another789"), null, "second use is refused");
  assert.equal(await findValidReset("not-a-real-token"), null);
});

test("expired links fail and requests are limited to 3 an hour", async () => {
  const u = await freshUser();
  const token = await createResetToken(u.id);
  await db.passwordReset.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await findValidReset(token!), null);
  assert.ok(await createResetToken(u.id));
  assert.ok(await createResetToken(u.id));
  assert.equal(await createResetToken(u.id), null, "fourth request in an hour is refused");
  assert.ok(await createResetToken(u.id, { skipLimit: true }), "admin links skip the limit");
});
