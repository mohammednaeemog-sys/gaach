// One-time changes to the shop's data, applied during each build. Each update
// runs once per database (a Setting row remembers it), so later admin edits,
// such as changing a price or deleting a size, are never undone.
import type { PrismaClient } from "@prisma/client";

export const LARGE_PLANT = "Large plant, 6-8 ft";
const LARGE = LARGE_PLANT;

// About three times the biggest size, rounded to the nearest ৳50 (at least ৳300)
export const largePlantPrice = (top: number) => Math.max(300, Math.round((top * 3) / 50) * 50);

// Nov 2026: every tree gets a bigger, older "Large plant" size, priced at about
// three times its biggest existing size (rounded to the nearest ৳50).
async function addLargePlants(db: PrismaClient) {
  const trees = await db.tree.findMany({ include: { products: true } });
  let added = 0;
  for (const t of trees) {
    if (!t.products.length || t.products.some((p) => p.sizeLabel.startsWith("Large plant"))) continue;
    const top = Math.max(...t.products.map((p) => p.priceBdt));
    const priceBdt = largePlantPrice(top);
    await db.product.create({
      data: { treeId: t.id, title: `${t.name.split(" (")[0]} - ${LARGE}`, sizeLabel: LARGE, ageMonths: 36, priceBdt, stock: 5 },
    });
    added++;
  }
  console.log(`Added a "${LARGE}" size to ${added} trees.`);
}

const UPDATES: [string, (db: PrismaClient) => Promise<void>][] = [["2026-11-large-plants", addLargePlants]];

export async function runDataUpdates(db: PrismaClient) {
  for (const [key, run] of UPDATES) {
    const k = `data-update:${key}`;
    if (await db.setting.findUnique({ where: { key: k } })) continue;
    await run(db);
    await db.setting.create({ data: { key: k, value: new Date().toISOString() } });
  }
}
