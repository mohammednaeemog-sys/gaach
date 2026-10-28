import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { removeCartItem, stepCartItem } from "@/modules/shop/cart";
import { getDeliveryFee } from "@/modules/shop/settings";
import { TreeArt } from "@/components/TreeArt";
import { Icon } from "@/components/icons";
import { taka } from "@/lib/format";

export const metadata = { title: "Cart" };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const user = await requireUser("/cart");
  const { added } = await searchParams;
  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { tree: true } } },
    orderBy: { id: "asc" },
  });
  const fee = await getDeliveryFee();
  const subtotal = items.reduce((s, i) => s + i.product.priceBdt * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const problems = items.filter((i) => !i.product.active || i.product.stock < i.quantity);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">Your basket</p>
          <h1 className="font-display mt-1 text-3xl text-forest-900 sm:text-4xl">Shopping cart</h1>
        </div>
        {items.length > 0 && <p className="text-sm text-stone-500">{count} {count === 1 ? "plant" : "plants"} in your cart</p>}
      </div>
      {added && (
        <p className="cart-added mt-4 flex items-center gap-2 rounded-2xl bg-mint-50 px-4 py-3 text-sm text-forest-700">
          <Icon.check className="h-4 w-4" /> Added to your cart.
          <Link href="/trees" className="ml-auto font-medium underline">Keep shopping</Link>
        </p>
      )}

      {items.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-forest-700"><Icon.pot className="h-8 w-8" /></span>
          <p className="font-display mt-4 text-xl text-forest-900">Your cart is empty</p>
          <p className="mt-1 text-sm text-stone-500">Find a tree that suits your place, then add it here.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/recommend" className="btn-primary">Find trees for my place</Link>
            <Link href="/trees" className="btn-ghost">Browse all trees</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_21.25rem]">
          <div>
            <div className="hidden grid-cols-[1fr_8.75rem_6.875rem_2.5rem] gap-4 border-b border-stone-200 px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-stone-500 sm:grid">
              <span>Product</span><span className="text-center">Quantity</span><span className="text-right">Price</span><span />
            </div>
            <ul className="divide-y divide-stone-100">
              {items.map((i, n) => {
                const p = i.product;
                const short = !p.active ? "No longer sold. Remove it to continue." : p.stock < i.quantity ? `Only ${p.stock} left. Lower the quantity.` : null;
                return (
                  <li key={i.id} className="cart-row grid grid-cols-[auto_1fr] items-center gap-4 px-2 py-4 sm:grid-cols-[1fr_8.75rem_6.875rem_2.5rem] sm:px-4" style={{ animationDelay: `${n * 70}ms` }}>
                    <div className="col-span-2 flex min-w-0 items-center gap-4 sm:col-span-1">
                      <Link href={`/trees/${p.tree.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-mint-100">
                        <TreeArt shape={p.tree.shape} color={p.tree.color} name={p.tree.name} imageUrl={p.imageUrl ?? p.tree.imageUrl} animate={false} />
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/trees/${p.tree.slug}`} className="font-semibold text-forest-900 hover:underline">{p.tree.name}</Link>
                        <p className="text-sm text-stone-500">Size: {p.sizeLabel}</p>
                        <p className="text-xs text-stone-400">{taka(p.priceBdt)} each</p>
                        {short && <p className="field-error">{short}</p>}
                      </div>
                    </div>
                    <div className="qty-stepper sm:justify-self-center">
                      <form action={stepCartItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="step" value="-1" />
                        <button aria-label={i.quantity === 1 ? `Remove ${p.title}` : `One fewer ${p.title}`}>−</button>
                      </form>
                      <span aria-live="polite">{i.quantity}</span>
                      <form action={stepCartItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="step" value="1" />
                        <button aria-label={`One more ${p.title}`} disabled={i.quantity >= Math.min(50, p.stock)}>+</button>
                      </form>
                    </div>
                    <p className="text-right font-semibold text-forest-900">{taka(p.priceBdt * i.quantity)}</p>
                    <form action={removeCartItem} className="col-span-2 justify-self-end sm:col-span-1">
                      <input type="hidden" name="id" value={i.id} />
                      <button className="grid h-9 w-9 place-items-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-700" aria-label={`Remove ${p.title}`}>
                        <Icon.trash className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
            <Link href="/trees" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest-700 hover:underline">← Continue shopping</Link>
          </div>

          <aside className="cart-summary h-fit rounded-3xl bg-forest-900 p-6 text-white lg:sticky lg:top-24">
            <h2 className="font-display text-2xl">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-white/80"><dt>Items ({count})</dt><dd>{taka(subtotal)}</dd></div>
              <div className="flex justify-between text-white/80"><dt>Delivery (flat fee)</dt><dd>{taka(fee)}</dd></div>
              <div className="flex justify-between border-t border-white/15 pt-3 text-lg font-bold"><dt>Total</dt><dd>{taka(subtotal + fee)}</dd></div>
            </dl>
            {problems.length > 0 ? (
              <p className="mt-5 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">Fix the items marked in red before checking out.</p>
            ) : (
              <Link href="/checkout" className="cart-cta mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-lime-400 px-5 py-3 font-semibold text-forest-900 transition hover:bg-lime-300">
                Proceed to checkout →
              </Link>
            )}
            <ul className="mt-6 space-y-2 text-xs text-white/70">
              <li className="flex items-center gap-2"><Icon.truck className="h-4 w-4 text-lime-300" /> One flat delivery fee</li>
              <li className="flex items-center gap-2"><Icon.shield className="h-4 w-4 text-lime-300" /> Cash on delivery available</li>
              <li className="flex items-center gap-2"><Icon.leaf className="h-4 w-4 text-lime-300" /> Healthy saplings, packed with care</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
