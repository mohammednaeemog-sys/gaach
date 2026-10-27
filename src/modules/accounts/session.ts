import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";

const COOKIE = "gaach_session";
const INACTIVITY_MS = 2 * 60 * 60 * 1000; // session ends after 2 hours idle (FR-1.2)
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // and never lasts more than 7 days
const TOUCH_EVERY_MS = 5 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await db.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(now + MAX_AGE_MS), lastSeenAt: new Date(now) },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

// Looks up the signed-in user once per request. All role checks run on the server (NFR-3.2).
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const id = hashToken(token);
  const session = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() < now || now - session.lastSeenAt.getTime() > INACTIVITY_MS) {
    await db.session.delete({ where: { id } }).catch(() => {});
    return null;
  }
  if (now - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await db.session.update({ where: { id }, data: { lastSeenAt: new Date(now) } }).catch(() => {});
  }
  const { id: userId, name, email, role, phone, address } = session.user;
  return { id: userId, name, email, role, phone, address };
});

export async function requireUser(next = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/?denied=1");
  return user;
}
