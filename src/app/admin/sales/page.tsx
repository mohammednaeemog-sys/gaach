import { db } from "@/lib/db";
import { PromotionForm } from "@/components/admin/PromotionForm";
import { deletePromotion, togglePromotion } from "@/modules/admin/sales-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { isLive } from "@/modules/shop/pricing";

export const metadata = { title: "Sales & offers" };

// datetime-local wants "YYYY-MM-DDTHH:mm" in Bangladesh time
const local = (d: Date | null) => (d ? new Date(d.getTime() + 6 * 3600_000).toISOString().slice(0, 16) : "");
const when = (d: Date) => d.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function status(p: { active: boolean; startsAt: Date | null; endsAt: Date | null }) {
  const now = new Date();
  if (!p.active) return ["Off", "bg-stone-100 text-stone-600"];
  if (p.endsAt && p.endsAt < now) return ["Ended", "bg-stone-100 text-stone-500"];
  if (p.startsAt && p.startsAt > now) return ["Scheduled", "bg-sky-50 text-sky-800"];
  return isLive(p, now) ? ["Live", "bg-lime-100 text-lime-800"] : ["Off", "bg-stone-100 text-stone-600"];
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const [promos, trees] = await Promise.all([
    db.promotion.findMany({ include: { trees: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } }),
    db.tree.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Sales &amp; offers</h1>
        <p className="mt-1 text-sm text-stone-600">Run a discount for an occasion (Eid, Pohela Boishakh, monsoon planting…). Shoppers see an animated banner explaining the sale, a badge on each card and the old price crossed out. For a fixed price on one size, use &ldquo;Sale price&rdquo; on the tree&apos;s product instead. When several discounts apply, the customer gets the lowest price.</p>
      </div>
      {saved && <p className="rounded-lg bg-mint-50 p-3 text-sm text-forest-700">Sale created.</p>}

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold text-forest-900">New sale</h2>
        <PromotionForm trees={trees} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-forest-900">All sales ({promos.length})</h2>
        {!promos.length && <p className="text-sm text-stone-500">No sales yet.</p>}
        {promos.map((p) => {
          const [text, cls] = status(p);
          return (
            <details key={p.id} className="card p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>
                <b className="text-forest-900">{p.name}</b>
                <span className="rounded-full bg-[#f2994a] px-2 py-0.5 text-[0.6875rem] font-bold text-white">{p.badge} -{p.percentOff}%</span>
                <span className="text-xs text-stone-500">{p.allTrees ? "All trees" : `${p.trees.length} tree${p.trees.length === 1 ? "" : "s"}`}</span>
                <span className="text-xs text-stone-500">{p.startsAt ? when(p.startsAt) : "Now"} → {p.endsAt ? when(p.endsAt) : "no end date"}</span>
                <span className="ml-auto flex gap-2">
                  <form action={togglePromotion}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost text-xs">{p.active ? "Switch off" : "Switch on"}</button></form>
                  <form action={deletePromotion}><input type="hidden" name="id" value={p.id} /><ConfirmButton message={`Delete the sale "${p.name}"?`} className="btn-ghost text-xs text-red-700">Delete</ConfirmButton></form>
                </span>
              </summary>
              <div className="mt-4 border-t border-stone-100 pt-4">
                <PromotionForm
                  trees={trees}
                  p={{ id: p.id, name: p.name, badge: p.badge, message: p.message, theme: p.theme, percentOff: p.percentOff, allTrees: p.allTrees, active: p.active, showBanner: p.showBanner, startsAt: local(p.startsAt), endsAt: local(p.endsAt), treeIds: p.trees.map((t) => t.id) }}
                />
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
