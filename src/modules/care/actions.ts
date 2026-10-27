"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";

export async function setPlantedDate(fd: FormData) {
  const user = await requireUser("/my-trees");
  const id = String(fd.get("id") ?? "");
  const raw = String(fd.get("plantedAt") ?? "");
  const date = raw ? new Date(raw + "T12:00:00") : new Date();
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 86_400_000) return;
  const nickname = String(fd.get("nickname") ?? "").trim().slice(0, 40);
  await db.ownedTree.updateMany({
    where: { id, userId: user.id },
    data: { plantedAt: date, ...(nickname ? { nickname } : {}) },
  });
  revalidatePath("/my-trees");
}
