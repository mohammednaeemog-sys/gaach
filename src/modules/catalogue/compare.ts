"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { COMPARE_COOKIE as COOKIE, MAX_COMPARE, readCompare } from "./compare-list";

// Adds or removes a tree from the comparison list (FR-4.2, two or three trees).
export async function toggleCompare(fd: FormData): Promise<void> {
  const slug = String(fd.get("slug") ?? "");
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return;
  const list = await readCompare();
  let next: string[];
  if (list.includes(slug)) next = list.filter((s) => s !== slug);
  else next = [...list, slug].slice(-MAX_COMPARE); // keep the newest three
  const jar = await cookies();
  jar.set(COOKIE, next.join(","), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/", "layout");
}

export async function clearCompare(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
  revalidatePath("/", "layout");
}
