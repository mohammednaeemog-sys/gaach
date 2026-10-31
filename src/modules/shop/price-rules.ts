// Works out what a customer pays for a product: the lowest of its normal price,
// the admin's sale price for that size, and any live occasion sale for that tree.
// Pure functions, so the same rule is used by cards, the cart, checkout and the Advisor.

export type LivePromo = {
  id: string; name: string; badge: string; percentOff: number; allTrees: boolean; treeIds: string[];
  message?: string; theme?: string; showBanner?: boolean; heroBanner?: boolean; imageUrl?: string | null; imageOnly?: boolean; startsAt?: Date | null; endsAt?: Date | null;
};
export type PriceInput = { priceBdt: number; salePriceBdt?: number | null };
export type Price = {
  now: number; // what the customer pays
  was: number | null; // the normal price, shown crossed out, when there is a discount
  percentOff: number; // rounded discount, 0 when there is none
  badge: string | null; // e.g. "SALE" or "EID SALE"
  occasion: string | null; // name of the sale that gave the price, if any
};

export function isLive(p: { active: boolean; startsAt: Date | null; endsAt: Date | null }, now = new Date()) {
  return p.active && (!p.startsAt || p.startsAt <= now) && (!p.endsAt || p.endsAt >= now);
}

export function priceFor(product: PriceInput, treeId: string, promos: LivePromo[]): Price {
  const base = product.priceBdt;
  let best = base;
  let badge: string | null = null;
  let occasion: string | null = null;
  if (product.salePriceBdt && product.salePriceBdt > 0 && product.salePriceBdt < best) {
    best = product.salePriceBdt;
    badge = "SALE";
  }
  for (const p of promos) {
    if (!p.allTrees && !p.treeIds.includes(treeId)) continue;
    const pct = Math.min(90, Math.max(0, p.percentOff));
    const v = Math.max(1, Math.round((base * (100 - pct)) / 100));
    if (v < best) {
      best = v;
      badge = p.badge || "SALE";
      occasion = p.name;
    }
  }
  if (best >= base) return { now: base, was: null, percentOff: 0, badge: null, occasion: null };
  return { now: best, was: base, percentOff: Math.round(((base - best) / base) * 100), badge, occasion };
}

// The cheapest price among a tree's sizes, and the biggest discount (for the card badge)
export function treePrices<P extends PriceInput & { stock?: number }>(products: P[], treeId: string, promos: LivePromo[]) {
  const priced = products.map((p) => ({ product: p, price: priceFor(p, treeId, promos) }));
  const cheapest = [...priced].sort((a, b) => a.price.now - b.price.now)[0] ?? null;
  const top = priced.reduce<Price | null>((m, x) => (x.price.percentOff > (m?.percentOff ?? 0) ? x.price : m), null);
  return { priced, cheapest, top };
}
