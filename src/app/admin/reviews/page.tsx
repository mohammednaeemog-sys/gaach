import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/modules/accounts/session";
import { moderateReview } from "@/modules/reviews/actions";
import { Stars } from "@/components/Stars";
import { dateText } from "@/lib/format";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await db.review.findMany({
    include: { user: { select: { name: true, email: true } }, tree: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const btn = (id: string, action: string, text: string, cls: string) => (
    <form action={moderateReview}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="do" value={action} />
      <button className={`rounded-lg px-3 py-1.5 text-xs font-medium ${cls}`}>{text}</button>
    </form>
  );
  return (
    <div className="space-y-4">
      <h1 className="page-title">Reviews</h1>
      <p className="text-sm text-stone-600">Newest first. Hidden reviews stay saved but no one else sees them, and they don&apos;t count in the star average.</p>
      {reviews.length === 0 ? (
        <p className="card p-6 text-sm text-stone-500">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className={`card p-4 ${r.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Stars value={r.rating} />
                <Link href={`/trees/${r.tree.slug}#reviews`} className="font-semibold text-forest-900 hover:underline">{r.tree.name}</Link>
                <span className="text-stone-500">by {r.user.name} ({r.user.email})</span>
                {r.verified && <span className="chip">Bought</span>}
                {r.hidden && <span className="chip-warn">Hidden</span>}
                <span className="ml-auto text-xs text-stone-400">{dateText(r.createdAt)}</span>
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-stone-700">{r.comment}</p>}
              <div className="mt-3 flex gap-2">
                {r.hidden ? btn(r.id, "show", "Show again", "bg-mint-100 text-forest-700 hover:bg-mint-200") : btn(r.id, "hide", "Hide", "bg-amber-50 text-amber-800 hover:bg-amber-100")}
                {btn(r.id, "delete", "Delete", "bg-red-50 text-red-700 hover:bg-red-100")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
