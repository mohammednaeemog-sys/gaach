import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "./password";

export const RESET_MINUTES = 30;
const MAX_PER_HOUR = 3;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Makes a one-time token for the user. Returns null when too many were asked for recently.
export async function createResetToken(userId: string, { skipLimit = false } = {}) {
  if (!skipLimit) {
    const recent = await db.passwordReset.count({ where: { userId, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
    if (recent >= MAX_PER_HOUR) return null;
  }
  const token = randomBytes(32).toString("base64url");
  await db.passwordReset.create({ data: { id: hash(token), userId, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) } });
  return token;
}

// The reset row for a token if it is still usable.
export async function findValidReset(token: string) {
  if (!token || token.length > 100) return null;
  const row = await db.passwordReset.findUnique({ where: { id: hash(token) }, include: { user: { select: { id: true, email: true, name: true } } } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

// Sets the new password, uses up every open link and signs the user out everywhere.
export async function redeemResetToken(token: string, password: string) {
  const row = await findValidReset(token);
  if (!row) return null;
  const passwordHash = await hashPassword(password);
  const claimed = await db.passwordReset.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return null; // the same link was used twice at once
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.passwordReset.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  return row.user;
}
