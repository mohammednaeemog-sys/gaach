import "server-only";
import { db } from "@/lib/db";
import { recommend, type SiteConditions } from "./engine";
import type { Purpose, Soil, Sunlight } from "@/lib/constants";

export type SiteInput = { districtId: number; spaceM: number; sunlight: Sunlight; soil: Soil; purpose: Purpose };

export async function runRecommendation(input: SiteInput) {
  const district = await db.district.findUnique({ where: { id: input.districtId }, include: { region: true, division: true } });
  if (!district) return null;
  const trees = await db.tree.findMany({
    where: { published: true },
    include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } } },
  });
  const site: SiteConditions = {
    districtName: district.name,
    region: district.region,
    spaceM: input.spaceM,
    sunlight: input.sunlight,
    soil: input.soil,
    purpose: input.purpose,
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
