"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fieldErrors, formValues, safeNext, type FormState } from "@/lib/forms";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { createSession, destroySession, requireAdmin, requireUser } from "./session";
import { createResetToken, RESET_MINUTES, redeemResetToken } from "./reset";
import { siteUrl } from "@/lib/site-url";
import { mailConfigured, mailProblem, sendMail } from "@/lib/mail";
import { siteSchema } from "./schemas";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 letters).").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email, like name@example.com."),
  password: z.string().superRefine((p, ctx) => {
    const problem = passwordProblem(p);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd, ["name", "email"]);
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) {
    return { errors: { email: "An account with this email already exists. Try logging in instead." }, values };
  }
  const user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  redirect(safeNext(String(fd.get("next") ?? ""), "/recommend"));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const values = { email };
  if (!email || !password) return { message: "Enter your email and password.", values };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { message: "That email and password do not match. Check for typos and try again.", values };
  }
  await createSession(user.id);
  const fallback = user.role === "ADMIN" ? "/admin" : "/";
  redirect(safeNext(String(fd.get("next") ?? ""), fallback));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const phoneRe = /^(\+?880|0)1[3-9]\d{8}$/;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || phoneRe.test(v.replace(/[\s-]/g, "")), "Enter a Bangladeshi mobile number, like 01712345678."),
  address: z.string().trim().max(300, "Keep the address under 300 characters."),
});

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/account");
  const values = formValues(fd, ["name", "phone", "address"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone.replace(/[\s-]/g, "") || null, address: parsed.data.address || null },
  });
  revalidatePath("/account");
  return { ok: true, message: "Profile saved.", values };
}



export async function saveSite(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/recommend");
  const name = String(fd.get("siteName") ?? "").trim();
  const values = formValues(fd, ["siteName"]);
  if (name.length < 2 || name.length > 40) return { errors: { siteName: "Give the site a name of 2 to 40 characters, like Rooftop." }, values };
  const parsed = siteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { message: "Run a search with all fields filled before saving.", values };
  const district = await db.district.findUnique({ where: { id: parsed.data.districtId } });
  if (!district) return { message: "That district was not found.", values };
  await db.site.create({ data: { ...parsed.data, name, userId: user.id } });
  revalidatePath("/account");
  revalidatePath("/recommend");
  return { ok: true, message: `Saved "${name}". You can pick it next time from the saved sites list.` };
}

export async function deleteSite(fd: FormData) {
  const user = await requireUser("/account");
  const id = String(fd.get("id") ?? "");
  // Scope to the owner so one user cannot delete another's site (NFR-3.2)
  await db.site.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account");
}

// ---------- Forgot password ----------

const SENT = "If an account uses that email, we've sent a link to reset the password. Check your inbox and spam folder. The link works for 30 minutes.";

// Emails a reset link straight to the user. Returns the link too (the admin page shows it if sending fails).
async function sendResetEmail(user: { email: string; name: string }, token: string) {
  const link = `${await siteUrl()}/reset-password?token=${token}`;
  const r = await sendMail(
    user.email,
    "Reset your Gaach password",
    `Hi ${user.name},\n\nSomeone asked to reset the password for your Gaach account. Open this link to choose a new one:\n\n${link}\n\nThe link works once and expires in ${RESET_MINUTES} minutes. If this wasn't you, you can ignore this email.\n\nGaach`,
    `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0d2b23"><h2 style="margin:0 0 12px">Reset your password</h2><p>Hi ${escapeHtml(user.name)},</p><p>Someone asked to reset the password for your Gaach account. Tap the button to choose a new one.</p><p style="margin:24px 0"><a href="${link}" style="background:#1d5b33;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Choose a new password</a></p><p style="font-size:13px;color:#57534e">Or copy this link into your browser:<br>${link}</p><p style="font-size:13px;color:#57534e">The link works once and expires in ${RESET_MINUTES} minutes. If this wasn't you, you can ignore this email.</p></div>`,
  );
  return { sent: r.sent, link };
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { errors: { email: "Enter a valid email, like name@example.com." }, values: { email } };
  // Say so plainly when the site can't send email at all, instead of pretending it did
  if (!mailConfigured()) return { message: "Password reset emails are not working right now. Please contact us from the Contact page and we'll help you.", values: { email } };
  const user = await db.user.findUnique({ where: { email } });
  // Same answer whether or not the account exists, so nobody can test which emails are registered
  if (user) {
    const token = await createResetToken(user.id);
    if (token) {
      try {
        await sendResetEmail(user, token);
      } catch (e) {
        console.error("[email] reset email failed:", mailProblem(e), e);
        return { message: "We couldn't send the email right now. Please try again in a few minutes.", values: { email } };
      }
    }
  }
  return { ok: true, message: SENT, values: { email } };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { errors: { password: problem } };
  if (password !== confirm) return { errors: { confirm: "The two passwords don't match." } };
  const user = await redeemResetToken(token, password);
  if (!user) return { message: "This link has expired or was already used. Ask for a new one." };
  // Tell the owner, so a change they didn't make never goes unnoticed
  try {
    await sendMail(
      user.email,
      "Your Gaach password was changed",
      `Hi ${user.name},\n\nThe password for your Gaach account was just changed and every device was signed out.\n\nIf this was you, there's nothing to do. If it wasn't, reset your password again straight away from the "Forgot password" page and reply to this email.\n\nGaach`,
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0d2b23"><h2 style="margin:0 0 12px">Your password was changed</h2><p>Hi ${escapeHtml(user.name)},</p><p>The password for your Gaach account was just changed and every device was signed out.</p><p style="font-size:13px;color:#57534e">If this was you, there's nothing to do. If it wasn't, reset your password again straight away from the "Forgot password" page and reply to this email.</p></div>`,
    );
  } catch (e) {
    console.error("[email] password-changed notice failed:", mailProblem(e));
  }
  await createSession(user.id);
  redirect("/account?reset=1");
}

// Admin: email a reset link straight to the user. Only if sending fails is the link shown to pass on by hand.
export async function adminResetLink(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { message: "No account uses that email.", values: { email } };
  const token = await createResetToken(user.id, { skipLimit: true });
  if (!token) return { message: "Couldn't make a reset link. Try again.", values: { email } };
  try {
    const r = await sendResetEmail(user, token);
    if (r.sent) return { ok: true, message: `Reset email sent to ${user.email}. Ask them to check Inbox and Spam.`, values: { email } };
    return { ok: false, message: "Email sending is not set up, so here is the link to send yourself:", values: { email, link: r.link } };
  } catch (e) {
    const link = `${await siteUrl()}/reset-password?token=${token}`;
    return { ok: false, message: `The email failed: ${mailProblem(e)} Here is the link to send yourself:`, values: { email, link } };
  }
}

// Admin: send a test email to check the Gmail settings, with a plain reason if it fails.
export async function adminTestEmail(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const to = String(fd.get("to") ?? "").trim() || admin.email;
  if (!z.string().email().safeParse(to).success) return { message: "Enter a valid email address.", values: { to } };
  try {
    const r = await sendMail(to, "Gaach test email", "Email sending works. Forgot-password links will now arrive by email.", "<p>Email sending works. Forgot-password links will now arrive by email.</p>");
    if (!r.sent) return { message: "Email is not set up. Add SMTP_USER and SMTP_PASS to the .env file, then stop and restart the site.", values: { to } };
    return { ok: true, message: `Sent to ${to}. If you don't see it in a minute, check the Spam folder.`, values: { to } };
  } catch (e) {
    return { message: mailProblem(e), values: { to } };
  }
}
