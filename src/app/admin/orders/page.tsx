import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { updateOrderStatus } from "@/modules/admin/actions";
import { shortId } from "@/modules/shop/orders";
import { StatusChip } from "@/components/StatusChip";
import { ORDER_STATUSES, label } from "@/lib/constants";
import { dateText, taka } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (sp.status && (ORDER_STATUSES as readonly string[]).includes(sp.status)) where.status = sp.status;
  let orders = await db.order.findMany({ where, include: { user: true, items: true }, orderBy: { createdAt: "desc" }, take: 200 });
  const q = sp.q?.trim().toUpperCase();
  if (q) orders = orders.filter((o) => shortId(o.id).includes(q) || o.user.email.toUpperCase().includes(q) || o.phone.includes(q));

  return (
    <div>
      <h1 className="page-title mb-4">Orders</h1>
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <input name="q" defaultValue={sp.q} placeholder="Order number, email or phone" className="input w-64" />
        <button className="btn-secondary">Filter</button>
        {(sp.status || sp.q) && <Link href="/admin/orders" className="btn-ghost">Clear</Link>}
      </form>
      {orders.length === 0 ? (
        <div className="card p-8 text-center text-stone-600">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-forest-900">#{shortId(o.id)} · {taka(o.totalBdt)}</p>
                  <p className="text-xs text-stone-500">{dateText(o.createdAt)} · {o.user.name} ({o.user.email})</p>
                </div>
                <StatusChip value={o.status} />
                <span className="text-xs text-stone-600">{label(o.paymentMethod)} · <StatusChip value={o.paymentStatus} /></span>
              </div>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <ul className="text-stone-700">{o.items.map((i) => <li key={i.id}>{i.titleSnapshot} × {i.quantity}</li>)}</ul>
                <p className="text-stone-600">{o.recipientName}, {o.phone}<br />{o.address}</p>
              </div>
              {o.status !== "CANCELLED" && o.status !== "DELIVERED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.status === "PLACED" && (
                    <form action={updateOrderStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="SHIPPED" /><button className="btn-secondary px-3 py-1.5 text-xs">Mark shipped</button></form>
                  )}
                  <form action={updateOrderStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="DELIVERED" /><button className="btn-secondary px-3 py-1.5 text-xs">Mark delivered</button></form>
                  <form action={updateOrderStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="CANCELLED" /><button className="btn-danger px-3 py-1.5 text-xs">Cancel and restock</button></form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
