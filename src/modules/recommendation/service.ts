import "server-only";
import { db } from "@/lib/db";
import { recommend, type SiteConditions } from "./engine";
import type { Purpose, Soil, Sunlight } from "@/lib/constants";
import { MONTHS, SEASONS, dhakaMonth, plantMonths } from "@/lib/planting";

export type SiteInput = { districtId: number; spaceM: number; sunlight: Sunlight; soil: Soil; purpose: Purpose };

// "NOW" = this month in Bangladesh; "MONSOON" = the next rainy season (June to September)
export async function runRecommendation(input: SiteInput, when: "NOW" | "MONSOON" = "NOW") {
  const district = await db.district.findUnique({ where: { id: input.districtId }, include: { region: true, division: true } });
  if (!district) return null;
  const rows = await db.tree.findMany({
    where: { published: true },
    include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } } },
  });
  const trees = rows.map((t) => ({ ...t, plantingMonths: plantMonths(t) }));
  const month = dhakaMonth();
  const site: SiteConditions = {
    districtName: district.name,
    region: district.region,
    spaceM: input.spaceM,
    sunlight: input.sunlight,
    soil: input.soil,
    purpose: input.purpose,
    planting: when === "NOW" ? { months: [month], label: `now (${MONTHS[month - 1]})` } : { months: SEASONS.MONSOON.months, label: "in the monsoon" },
  };
  return { district, ...recommend(trees, site) };
}

export async function locationOptions() {
  const divisions = await db.division.findMany({
    orderBy: { name: "asc" },
    include: { districts: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });
  return divisions.map((d) => ({ id: d.id, name: d.name, districts: d.districts }));
}
