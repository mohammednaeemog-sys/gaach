"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/modules/accounts/session";
import { safeNext } from "@/lib/forms";

function qty(v: FormDataEntryValue | null) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 50) : 1;
}

// The cart lives in the database, so it follows the account across devices (FR-5.2).
export async function addToCart(fd: FormData) {
  const back = safeNext(String(fd.get("back") ?? ""), "/trees");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  const productId = String(fd.get("productId") ?? "");
  const quantity = Math.max(qty(fd.get("quantity")), 1);
  const product = await db.product.findFirst({ where: { id: productId, active: true, tree: { published: true } } });
  if (!product) redirect(`${back}?cart=missing`);
  const existing = await db.cartItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  const total = Math.min((existing?.quantity ?? 0) + quantity, 50);
  await db.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { quantity: total },
    create: { userId: user.id, productId, quantity: total },
  });
  revalidatePath("/", "layout");
  // "Buy now" goes straight to checkout; "Add to cart" shows the cart
  redirect(fd.get("then") === "checkout" ? "/checkout" : "/cart?added=1");
}

// "Buy now" on a tree page: same as Add to cart, then straight to checkout
export async function buyNow(fd: FormData) {
  fd.set("then", "checkout");
  return addToCart(fd);
}

export async function updateCartItem(fd: FormData) {
  const user = await requireUser("/cart");
  const id = String(fd.get("id") ?? "");
  if (fd.get("quantity") === null) return; // never treat a missing number as "remove"
  const quantity = qty(fd.get("quantity"));
  if (quantity === 0) await db.cartItem.deleteMany({ where: { id, userId: user.id } });
  else await db.cartItem.updateMany({ where: { id, userId: user.id }, data: { quantity } });
  revalidatePath("/", "layout");
}

// The cart's − and + buttons: change the saved quantity by one (removes the item at 0)
export async function stepCartItem(fd: FormData) {
  const user = await requireUser("/cart");
  const id = String(fd.get("id") ?? "");
  const step = Number(fd.get("step")) === -1 ? -1 : 1;
  const item = await db.cartItem.findFirst({ where: { id, userId: user.id }, include: { product: true } });
  if (!item) return;
  const quantity = Math.min(item.quantity + step, 50, Math.max(item.product.stock, 1));
  if (quantity <= 0) await db.cartItem.delete({ where: { id: item.id } });
  else if (quantity !== item.quantity) await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  revalidatePath("/", "layout");
}

export async function removeCartItem(fd: FormData) {
  const user = await requireUser("/cart");
  await db.cartItem.deleteMany({ where: { id: String(fd.get("id") ?? ""), userId: user.id } });
  revalidatePath("/", "layout");
}
