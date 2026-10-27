import Link from "next/link";
import { db } from "@/lib/db";
import { shortId } from "@/modules/shop/orders";
import { StatusChip } from "@/components/StatusChip";
import { dateText, taka } from "@/lib/format";

export default async function AdminHome() {
  const [trees, drafts, users, placed, refusals, lowStock, recent] = await Promise.all([
    db.tree.count({ where: { published: true } }),
    db.tree.count({ where: { published: false } }),
    db.user.count({ where: { role: "USER" } }),
    db.order.count({ where: { status: "PLACED" } }),
    db.refusedQuestion.count(),
    db.product.findMany({ where: { active: true, stock: { lte: 5 } }, include: { tree: true }, orderBy: { stock: "asc" }, take: 8 }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: true } }),
  ]);
  const stats = [
    ["Published trees", trees, "/admin/trees"],
    ["Draft trees", drafts, "/admin/trees"],
    ["Customers", users, null],
    ["Orders to ship", placed, "/admin/orders?status=PLACED"],
    ["Refused AI questions", refusals, "/admin/ai"],
  ] as const;
  return (
    <div className="space-y-6">
      <h1 className="page-title">Admin overview</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([name, n, href]) => {
          const inner = (<><p className="text-2xl font-bold text-forest-900">{n}</p><p className="text-xs text-stone-500">{name}</p></>);
          return href ? <Link key={name} href={href} className="card p-4 hover:shadow-md">{inner}</Link> : <div key={name} className="card p-4">{inner}</div>;
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 font-semibold text-forest-900">Recent orders</h2>
          <table className="table">
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders?q=${shortId(o.id)}`} className="font-medium text-forest-700">#{shortId(o.id)}</Link><div className="text-xs text-stone-500">{o.user.name} · {dateText(o.createdAt)}</div></td>
                  <td><StatusChip value={o.status} /></td>
                  <td className="text-right">{taka(o.totalBdt)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td className="text-stone-500">No orders yet.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="card p-4">
          <h2 className="mb-2 font-semibold text-forest-900">Low stock (5 or fewer)</h2>
          <table className="table">
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id}><td><Link href={`/admin/trees/${p.treeId}#products`} className="text-forest-700">{p.title}</Link></td><td className={`text-right font-semibold ${p.stock === 0 ? "text-red-700" : "text-amber-700"}`}>{p.stock}</td></tr>
              ))}
              {lowStock.length === 0 && <tr><td className="text-stone-500">All products are well stocked.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
