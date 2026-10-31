"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/modules/accounts/session";
import { fieldErrors, type FormState } from "@/lib/forms";
import { saveImage } from "./uploads";

const MAX_PHOTOS = 12;

// Adds one or more extra photos to a tree's gallery and card slider
export async function addTreePhotos(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const treeId = String(fd.get("treeId") ?? "");
  const tree = await db.tree.findUnique({ where: { id: treeId }, include: { _count: { select: { photos: true } } } });
  if (!tree) return { message: "Tree not found." };
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { message: "Choose at least one photo." };
  const room = MAX_PHOTOS - tree._count.photos;
  if (files.length > room) return { message: `A tree can have up to ${MAX_PHOTOS} extra photos. You can add ${Math.max(0, room)} more.` };
  const last = await db.treePhoto.findFirst({ where: { treeId }, orderBy: { sort: "desc" } });
  let sort = (last?.sort ?? -1) + 1;
  let added = 0;
  for (const f of files) {
    const r = await saveImage(f, `${tree.slug}-photo`);
    if (r.error) return { message: `${f.name}: ${r.error}${added ? ` (${added} added before this one)` : ""}` };
    if (r.url) {
      await db.treePhoto.create({ data: { treeId, url: r.url, sort: sort++ } });
      added++;
    }
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `${added} photo${added > 1 ? "s" : ""} added.` };
}

export async function deleteTreePhoto(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  await db.treePhoto.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
}

// Moves a photo one place earlier or later
export async function moveTreePhoto(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const dir = Number(fd.get("dir")) < 0 ? -1 : 1;
  const photo = await db.treePhoto.findUnique({ where: { id } });
  if (!photo) return;
  const list = await db.treePhoto.findMany({ where: { treeId: photo.treeId }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((p, k) => db.treePhoto.update({ where: { id: p.id }, data: { sort: k } })));
  revalidatePath("/", "layout");
}

const THEME_KEYS = ["general", "eid", "boishakh", "monsoon", "winter", "victory"] as const;

// The admin's date boxes are in Bangladesh time (UTC+6), whatever the server's clock zone is
const dateField = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00+06:00` : v),
  z.coerce.date({ message: "Pick a valid date." }).nullable(),
);
const promoSchema = z
  .object({
    name: z.string().trim().min(2, "Name the occasion, like Eid ul-Adha sale.").max(60),
    badge: z.string().trim().min(2, "Write a short badge, like EID SALE.").max(14, "Keep the badge to 14 letters so it fits the circle."),
    message: z.string().trim().max(140, "Keep the reason under 140 letters.").default(""),
    theme: z.enum(THEME_KEYS),
    percentOff: z.coerce.number().int("Use a whole number.").min(1, "At least 1% off.").max(90, "At most 90% off."),
    startsAt: dateField,
    endsAt: dateField,
  })
  .refine((d) => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt, { path: ["endsAt"], message: "The end must be after the start." });

// Creates or updates an occasion sale
export async function savePromotion(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "") || null;
  const values = Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && k !== "trees")) as Record<string, string>;
  const parsed = promoSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const allTrees = fd.get("scope") !== "some";
  const treeIds = allTrees ? [] : fd.getAll("trees").map(String).filter(Boolean);
  if (!allTrees && !treeIds.length) return { errors: { trees: "Tick at least one tree, or choose All trees." }, values };
  const data = {
    ...parsed.data,
    badge: parsed.data.badge.toUpperCase(),
    allTrees,
    active: fd.get("active") === "on",
    showBanner: fd.get("showBanner") === "on",
  };
  const trees = { set: treeIds.map((t) => ({ id: t })) };
  if (id) await db.promotion.update({ where: { id }, data: { ...data, trees } });
  else await db.promotion.create({ data: { ...data, trees: { connect: treeIds.map((t) => ({ id: t })) } } });
  revalidatePath("/", "layout");
  if (!id) redirect("/admin/sales?saved=1");
  return { ok: true, message: "Sale saved.", values };
}

export async function togglePromotion(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const p = await db.promotion.findUnique({ where: { id } });
  if (p) await db.promotion.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/", "layout");
}

export async function deletePromotion(fd: FormData) {
  await requireAdmin();
  await db.promotion.deleteMany({ where: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/", "layout");
}
