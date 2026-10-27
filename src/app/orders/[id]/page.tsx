import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { shortId } from "@/modules/shop/orders";
import { gateway } from "@/modules/shop/payment";
import { StatusChip } from "@/components/StatusChip";
import { ORDER_STATUSES, label } from "@/lib/constants";
import { dateText, taka } from "@/lib/format";

export const metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string; payment?: string }> }) {
  const user = await requireUser("/orders");
  const { id } = await params;
  const sp = await searchParams;
  // Users can only open their own orders (NFR-3.2)
  const order = await db.order.findFirst({ where: { id, userId: user.id }, include: { items: true, ownedTrees: true } });
  if (!order) notFound();
  const steps = ORDER_STATUSES.filter((s) => s !== "CANCELLED");
  const reached = steps.indexOf(order.status as (typeof steps)[number]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {sp.placed && order.status !== "CANCELLED" && (
        <div className="rounded-xl bg-mint-50 p-4 text-forest-900 ring-1 ring-mint-200">
          <p className="font-semibold">Thank you! Your order is placed.</p>
          <p className="text-sm">Your trees and their care plans are now under <Link href="/my-trees" className="font-semibold underline">My trees</Link>.</p>
        </div>
      )}
      {sp.payment === "failed" && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
          The payment did not go through, so the order was cancelled and nothing was charged. Your plants were put back in stock. You can order again with cash on delivery.
        </div>
      )}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-forest-900">Order #{shortId(order.id)}</h1>
          <StatusChip value={order.status} />
        </div>
        <p className="text-sm text-stone-500">Placed {dateText(order.createdAt)}</p>

        {order.status !== "CANCELLED" && (
          <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {steps.map((s, i) => (
              <li key={s} className={`rounded-lg py-2 ${i <= reached ? "bg-lime-500 text-white" : "bg-stone-100 text-stone-500"}`}>{label(s)}</li>
            ))}
          </ol>
        )}

        <table className="table mt-5">
          <thead><tr><th>Item</th><th className="text-right">Qty</th><th className="text-right">Price</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}><td>{i.titleSnapshot}</td><td className="text-right">{i.quantity}</td><td className="text-right">{taka(i.unitPriceBdt * i.quantity)}</td></tr>
            ))}
            <tr><td colSpan={2} className="text-right">Delivery</td><td className="text-right">{taka(order.deliveryFee)}</td></tr>
            <tr><td colSpan={2} className="text-right font-bold">Total</td><td className="text-right font-bold">{taka(order.totalBdt)}</td></tr>
          </tbody>
        </table>

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold text-stone-700">Deliver to</p>
            <p>{order.recipientName}<br />{order.phone}<br />{order.address}</p>
          </div>
          <div>
            <p className="font-semibold text-stone-700">Payment</p>
            <p>{label(order.paymentMethod)} · <StatusChip value={order.paymentStatus} /></p>
            {order.paymentRef && <p className="text-xs text-stone-500">Reference {order.paymentRef}</p>}
            {order.paymentMethod === "ONLINE_TEST" && order.paymentStatus === "PENDING" && order.status !== "CANCELLED" && (
              <Link href={gateway.startPayment(order.id)} className="btn-primary mt-2 px-3 py-1.5 text-xs">Complete payment</Link>
            )}
          </div>
        </div>
      </div>
      <Link href="/orders" className="btn-ghost">← All orders</Link>
    </div>
  );
}
