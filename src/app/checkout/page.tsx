import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { getDeliveryFee } from "@/modules/shop/settings";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { TreeArt } from "@/components/TreeArt";
import { taka } from "@/lib/format";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const items = await db.cartItem.findMany({ where: { userId: user.id }, include: { product: { include: { tree: true } } }, orderBy: { id: "asc" } });
  if (!items.length) redirect("/cart");
  const fee = await getDeliveryFee();
  const subtotal = items.reduce((s, i) => s + i.product.priceBdt * i.quantity, 0);
  return (
    <div>
      <ol className="checkout-steps" aria-label="Checkout progress">
        <li className="done"><Link href="/cart">Cart</Link></li>
        <li className="now" aria-current="step">Delivery and payment</li>
        <li>Order placed</li>
      </ol>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-5 sm:p-7">
          <h1 className="font-display text-3xl text-forest-900">Checkout</h1>
          <p className="mb-5 mt-1 text-sm text-stone-500">Tell us where to bring your plants and how you&apos;d like to pay.</p>
          <CheckoutForm defaults={{ recipientName: user.name, phone: user.phone ?? "", address: user.address ?? "", paymentMethod: "COD" }} />
        </div>
        <aside className="cart-summary h-fit rounded-3xl bg-forest-900 p-6 text-white lg:sticky lg:top-24">
          <h2 className="font-display text-2xl">Your order</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  <TreeArt shape={i.product.tree.shape} color={i.product.tree.color} name={i.product.tree.name} imageUrl={i.product.imageUrl ?? i.product.tree.imageUrl} animate={false} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{i.product.tree.name}</span>
                  <span className="text-xs text-white/60">{i.product.sizeLabel} × {i.quantity}</span>
                </span>
                <span>{taka(i.product.priceBdt * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between text-white/80"><dt>Subtotal</dt><dd>{taka(subtotal)}</dd></div>
            <div className="flex justify-between text-white/80"><dt>Delivery (flat fee)</dt><dd>{taka(fee)}</dd></div>
            <div className="flex justify-between pt-1 text-lg font-bold"><dt>Total</dt><dd>{taka(subtotal + fee)}</dd></div>
          </dl>
          <Link href="/cart" className="mt-5 block rounded-full border border-white/25 px-4 py-2.5 text-center text-sm font-medium transition hover:bg-white/10">Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}
