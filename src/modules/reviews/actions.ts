"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/modules/accounts/session";
import type { FormState } from "@/lib/forms";

const reviewSchema = z.object({
  treeId: z.string().min(1).max(40),
  rating: z.coerce.number().int().min(1, "Choose 1 to 5 stars.").max(5, "Choose 1 to 5 stars."),
  comment: z.string().trim().max(1000, "Keep the comment under 1000 characters."),
});

async function refresh(treeId: string) {
  const tree = await db.tree.findUnique({ where: { id: treeId }, select: { slug: true } });
  if (tree) revalidatePath(`/trees/${tree.slug}`);
  revalidatePath("/trees");
}

// Adds or updates the user's own review (one per tree)
export async function saveReview(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Log in to write a review." };
  const parsed = reviewSchema.safeParse({ treeId: fd.get("treeId"), rating: fd.get("rating") ?? 0, comment: fd.get("comment") ?? "" });
  const values = { rating: String(fd.get("rating") ?? ""), comment: String(fd.get("comment") ?? "") };
  if (!parsed.success) return { errors: { [String(parsed.error.issues[0].path[0])]: parsed.error.issues[0].message }, values };
  const { treeId, rating, comment } = parsed.data;
  const tree = await db.tree.findFirst({ where: { id: treeId, published: true } });
  if (!tree) return { message: "This tree is not available." };
  // "Bought from Gaach" badge: the user has a non-cancelled order with this tree
  const bought = await db.orderItem.count({ where: { product: { treeId }, order: { userId: user.id, status: { not: "CANCELLED" } } } });
  await db.review.upsert({
    where: { treeId_userId: { treeId, userId: user.id } },
    update: { rating, comment, verified: bought > 0 },
    create: { treeId, userId: user.id, rating, comment, verified: bought > 0 },
  });
  await refresh(treeId);
  return { ok: true, message: "Thanks! Your review is saved.", values };
}

export async function deleteMyReview(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const treeId = String(fd.get("treeId") ?? "");
  await db.review.deleteMany({ where: { treeId, userId: user.id } });
  await refresh(treeId);
}

// Admin: hide or show a review, or delete it
export async function moderateReview(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const action = String(fd.get("do") ?? "");
  const review = await db.review.findUnique({ where: { id } });
  if (!review) return;
  if (action === "delete") await db.review.delete({ where: { id } });
  else await db.review.update({ where: { id }, data: { hidden: action === "hide" } });
  await refresh(review.treeId);
  revalidatePath("/admin/reviews");
}
