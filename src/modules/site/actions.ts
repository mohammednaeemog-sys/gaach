"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/modules/accounts/session";
import { mailConfigured, sendMail } from "@/lib/mail";
import type { FormState } from "@/lib/forms";
import { SITE_FIELDS, type SiteKey } from "./fields";
import { siteKey } from "./info";

const LINK_KEYS: SiteKey[] = ["facebook", "instagram", "youtube"];

// Admin: save the footer / contact details
export async function saveSiteInfo(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const f of SITE_FIELDS) {
    const v = String(fd.get(f.key) ?? "").trim().slice(0, f.key === "outlets" ? 1000 : 200);
    values[f.key] = v;
    if (v && LINK_KEYS.includes(f.key) && !/^https:\/\/\S+$/i.test(v)) errors[f.key] = "Paste the full link, starting with https://";
    if (v && f.key === "email" && !z.string().email().safeParse(v).success) errors[f.key] = "Enter a valid email address.";
  }
  if (Object.keys(errors).length) return { errors, values };
  await db.$transaction(
    SITE_FIELDS.map((f) =>
      values[f.key]
        ? db.setting.upsert({ where: { key: siteKey(f.key) }, update: { value: values[f.key] }, create: { key: siteKey(f.key), value: values[f.key] } })
        : db.setting.deleteMany({ where: { key: siteKey(f.key) } }),
    ),
  );
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The footer and Contact page now show these details.", values };
}

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);

// Footer newsletter sign-up
export async function subscribe(_: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks for subscribing!" }; // bot trap
  const parsed = emailSchema.safeParse(fd.get("email") ?? "");
  if (!parsed.success) return { errors: { email: parsed.error.issues[0].message }, values: { email: String(fd.get("email") ?? "") } };
  await db.subscriber.upsert({ where: { email: parsed.data }, update: {}, create: { email: parsed.data } });
  return { ok: true, message: "Thanks! You'll get seasonal planting tips and offers." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailSchema,
  phone: z.string().trim().max(20).regex(/^[\d+\-\s()]*$/, "Use digits only."),
  topic: z.enum(["General", "An order", "Plant care", "Wholesale or bulk", "Something else"]),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(2000, "Keep it under 2000 characters."),
});

// Contact page form: saves the message for admins and emails the team if email is set up
export async function sendContactMessage(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(["name", "email", "phone", "topic", "message"].map((k) => [k, String(fd.get(k) ?? "")]));
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks! We'll get back to you soon." }; // bot trap
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors, values: raw };
  }
  const m = parsed.data;
  const recent = await db.contactMessage.count({ where: { email: m.email, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 3) return { message: "You've sent a few messages already. We'll reply soon, so please wait a little before sending more.", values: raw };
  await db.contactMessage.create({ data: { ...m, phone: m.phone || null } });

  const to = (await db.setting.findUnique({ where: { key: siteKey("email") } }))?.value || process.env.SMTP_USER;
  if (to && mailConfigured()) {
    const text = `${m.topic} message from ${m.name} <${m.email}>${m.phone ? `, ${m.phone}` : ""}\n\n${m.message}`;
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    await sendMail(to, `Gaach contact: ${m.topic} from ${m.name}`, text, `<pre style="font-family:inherit;white-space:pre-wrap">${esc(text)}</pre>`).catch((e) =>
      console.error("[contact] email failed", e),
    );
  }
  revalidatePath("/admin/site");
  return { ok: true, message: "Thanks! Your message reached the Gaach team. We usually reply within a day." };
}

// Admin: mark a message handled, or delete it
export async function updateContactMessage(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const op = String(fd.get("op") ?? "");
  if (op === "delete") await db.contactMessage.deleteMany({ where: { id } });
  else await db.contactMessage.updateMany({ where: { id }, data: { handled: op === "done" } });
  revalidatePath("/admin/site");
}

// Admin: remove a newsletter subscriber
export async function removeSubscriber(fd: FormData) {
  await requireAdmin();
  await db.subscriber.deleteMany({ where: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/admin/site");
}
