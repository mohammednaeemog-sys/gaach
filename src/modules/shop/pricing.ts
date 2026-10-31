import { cache } from "react";
import { db } from "@/lib/db";
import type { LivePromo } from "./price-rules";

export * from "./price-rules";

// Sales that are switched on and inside their dates right now (read once per request)
export const livePromotions = cache(async (): Promise<LivePromo[]> => {
  const now = new Date();
  const rows = await db.promotion.findMany({
    where: { active: true, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    include: { trees: { select: { id: true } } },
    orderBy: { percentOff: "desc" },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, badge: r.badge, percentOff: r.percentOff, allTrees: r.allTrees, treeIds: r.trees.map((t) => t.id), message: r.message, theme: r.theme, showBanner: r.showBanner, endsAt: r.endsAt }));
});
