import { db } from "@/lib/db";

import { SITE_FIELDS, type SiteInfo, type SiteKey } from "./fields";

export { SITE_FIELDS, type SiteInfo, type SiteKey };

const PREFIX = "site.";

export async function getSiteInfo(): Promise<SiteInfo> {
  const rows = await db.setting.findMany({ where: { key: { startsWith: PREFIX } } });
  const info = Object.fromEntries(SITE_FIELDS.map((f) => [f.key, ""])) as SiteInfo;
  for (const r of rows) {
    const k = r.key.slice(PREFIX.length) as SiteKey;
    if (k in info) info[k] = r.value;
  }
  return info;
}

export const siteKey = (k: SiteKey) => PREFIX + k;

// "Banani: Level 3, Road 11" → { name: "Banani", address: "Level 3, Road 11" }
export function outletList(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 && i < 40 ? { name: l.slice(0, i).trim(), address: l.slice(i + 1).trim() } : { name: "", address: l };
    });
}

// Phone numbers as tel: and WhatsApp links
export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;
export const waHref = (n: string) => `https://wa.me/${n.replace(/\D/g, "").replace(/^0/, "880")}`;

// Average star rating across all visible reviews
export async function siteRating() {
  const r = await db.review.aggregate({ where: { hidden: false }, _avg: { rating: true }, _count: true });
  return { average: r._avg.rating ?? 0, count: r._count };
}
