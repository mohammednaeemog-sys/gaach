import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PURPOSES, SOILS, SUNLIGHT } from "@/lib/constants";

type Param = string | string[] | undefined;
export type CatalogueFilters = { q?: string; size?: Param; purpose?: Param; sunlight?: Param; soil?: Param; minPrice?: string; maxPrice?: string; sort?: string; page?: string; view?: string; sale?: string };

export const SIZE_BANDS: Record<string, { label: string; min: number; max: number }> = {
  small: { label: "Small (under 5 m tall)", min: 0, max: 4.99 },
  medium: { label: "Medium (5 to 12 m)", min: 5, max: 12 },
  large: { label: "Large (over 12 m)", min: 12.01, max: 999 },
};

// A filter can be picked more than once (checkboxes); unknown values are ignored
export function many(v: Param, allowed: readonly string[]): string[] {
  const list = (Array.isArray(v) ? v : v ? v.split(",") : []).map((x) => x.trim()).filter((x) => allowed.includes(x));
  return [...new Set(list)];
}

// Browse, search and filter (FR-4.3). Only published trees are shown to users.
export async function listTrees(f: CatalogueFilters) {
  const where: Prisma.TreeWhereInput = { published: true };
  const and: Prisma.TreeWhereInput[] = [];
  const q = f.q?.trim().slice(0, 60);
  if (q) and.push({ OR: [{ name: { contains: q, mode: "insensitive" } }, { banglaName: { contains: q } }, { scientificName: { contains: q, mode: "insensitive" } }] });
  const sizes = many(f.size, Object.keys(SIZE_BANDS));
  if (sizes.length) and.push({ OR: sizes.map((k) => ({ matureHeightM: { gte: SIZE_BANDS[k].min, lte: SIZE_BANDS[k].max } })) });
  const purposes = many(f.purpose, PURPOSES);
  if (purposes.length) and.push({ OR: purposes.map((p) => ({ purposes: { contains: p } })) });
  const sun = many(f.sunlight, SUNLIGHT);
  if (sun.length) and.push({ OR: sun.map((p) => ({ sunlight: { contains: p } })) });
  const soils = many(f.soil, SOILS);
  if (soils.length) and.push({ OR: soils.map((p) => ({ soils: { contains: p } })) });
  const minPrice = Number(f.minPrice);
  const maxPrice = Number(f.maxPrice);
  const price: Prisma.IntFilter = {};
  if (f.minPrice && Number.isFinite(minPrice) && minPrice > 0) price.gte = minPrice;
  if (f.maxPrice && Number.isFinite(maxPrice) && maxPrice > 0) price.lte = maxPrice;
  if (Object.keys(price).length) and.push({ products: { some: { active: true, priceBdt: price } } });
  if (and.length) where.AND = and;

  const trees = await db.tree.findMany({
    where,
    include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } }, photos: { orderBy: { sort: "asc" }, select: { url: true } } },
    orderBy: { name: "asc" },
  });
  if (f.sort === "price") {
    const min = (t: (typeof trees)[number]) => t.products[0]?.priceBdt ?? Infinity;
    trees.sort((a, b) => min(a) - min(b) || a.name.localeCompare(b.name));
  } else if (f.sort === "price-desc") {
    const min = (t: (typeof trees)[number]) => t.products[0]?.priceBdt ?? -1;
    trees.sort((a, b) => min(b) - min(a) || a.name.localeCompare(b.name));
  } else if (f.sort === "height") {
    trees.sort((a, b) => a.matureHeightM - b.matureHeightM || a.name.localeCompare(b.name));
  }
  return trees;
}

export function getTree(slug: string) {
  return db.tree.findFirst({
    where: { slug, published: true },
    include: {
      products: { where: { active: true }, orderBy: { priceBdt: "asc" } },
      careStages: true,
      photos: { orderBy: { sort: "asc" } },
    },
  });
}
