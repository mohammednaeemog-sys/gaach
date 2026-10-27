import { db } from "@/lib/db";

export type RatingSummary = { avg: number; count: number };

// Average stars for many trees at once (for tree cards)
export async function ratingsFor(treeIds: string[]): Promise<Record<string, RatingSummary>> {
  if (!treeIds.length) return {};
  const rows = await db.review.groupBy({ by: ["treeId"], where: { treeId: { in: treeIds }, hidden: false }, _avg: { rating: true }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.treeId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

export async function reviewsForTree(treeId: string) {
  const reviews = await db.review.findMany({
    where: { treeId, hidden: false },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const bars = [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: reviews.filter((r) => r.rating === n).length }));
  return { reviews, count, avg, bars };
}

// "Rahim Uddin" -> "Rahim U."
export function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
}
