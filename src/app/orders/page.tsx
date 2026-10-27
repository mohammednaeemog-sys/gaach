import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { shortId } from "@/modules/shop/orders";
import { StatusChip } from "@/components/StatusChip";
import { dateText, taka } from "@/lib/format";

export const metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="page-title">Your orders</h1>
      {orders.length === 0 ? (
        <div className="card mt-5 p-8 text-center text-stone-600">No orders yet. <Link href="/trees" className="font-semibold text-lime-600">Browse trees</Link></div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="card flex flex-wrap items-center gap-3 p-4 hover:shadow-md">
                <div className="flex-1">
                  <p className="font-semibold text-forest-900">Order #{shortId(o.id)}</p>
                  <p className="text-sm text-stone-500">{dateText(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} plants</p>
                </div>
                <StatusChip value={o.status} />
                <p className="w-24 text-right font-bold">{taka(o.totalBdt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
