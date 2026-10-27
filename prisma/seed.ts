import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { DIVISIONS, REGIONS } from "./data/locations";
import { TREES } from "./data/trees";
import { careStagesFor } from "./data/care";
import { GUIDES } from "./data/knowledge";

const db = new PrismaClient();

// Photo credits written by `npm run photos` (Wikimedia Commons, openly licensed)
const creditsFile = path.join(process.cwd(), "prisma", "data", "photo-credits.json");
const credits: Record<string, { credit: string; sourceUrl: string }> = existsSync(creditsFile)
  ? JSON.parse(readFileSync(creditsFile, "utf8"))
  : {};

async function main() {
  console.log("Seeding reference data...");
  const regionIds: Record<string, number> = {};
  for (const r of REGIONS) {
    const { key, ...data } = r;
    const row = await db.region.upsert({ where: { name: r.name }, update: data, create: data });
    regionIds[key] = row.id;
  }
  for (const [division, districts] of Object.entries(DIVISIONS)) {
    const d = await db.division.upsert({ where: { name: division }, update: {}, create: { name: division } });
    for (const [name, regionKey] of districts) {
      await db.district.upsert({
        where: { name },
        update: { divisionId: d.id, regionId: regionIds[regionKey] },
        create: { name, divisionId: d.id, regionId: regionIds[regionKey] },
      });
    }
  }
  await db.setting.upsert({ where: { key: "deliveryFeeBdt" }, update: {}, create: { key: "deliveryFeeBdt", value: "120" } });

  console.log("Seeding trees, products and care plans...");
  for (const t of TREES) {
    const data = {
      name: t.name, banglaName: t.banglaName, scientificName: t.scientificName, description: t.description,
      shape: t.shape, color: t.color, matureHeightM: t.matureHeightM, canopySpreadM: t.canopySpreadM,
      growthRate: t.growthRate, sunlight: t.sunlight.join(","), soils: t.soils.join(","), purposes: t.purposes.join(","),
      waterNeed: t.waterNeed, rainfall: t.rainfall.join(","), floodTolerance: t.floodTolerance,
      droughtTolerance: t.droughtTolerance, salinityTolerance: t.salinityTolerance,
      fruitingSeason: t.fruitingSeason, cautions: t.cautions, published: true,
      sourceTitle: "Gaach starter catalogue, compiled from general horticultural references for Bangladesh",
      ...(credits[t.slug] && existsSync(path.join(process.cwd(), "public", "trees", `${t.slug}.jpg`))
        ? { imageUrl: `/trees/${t.slug}.jpg`, imageCredit: credits[t.slug].credit, imageSourceUrl: credits[t.slug].sourceUrl }
        : {}),
    };
    const tree = await db.tree.upsert({ where: { slug: t.slug }, update: data, create: { slug: t.slug, ...data } });
    const existing = await db.product.count({ where: { treeId: tree.id } });
    if (!existing) {
      for (const [sizeLabel, ageMonths, priceBdt, stock] of t.products) {
        await db.product.create({
          data: { treeId: tree.id, title: `${t.name.split(" (")[0]} - ${sizeLabel}`, sizeLabel, ageMonths, priceBdt, stock },
        });
      }
    }
    for (const [stage, s] of Object.entries(careStagesFor(t))) {
      await db.careStage.upsert({
        where: { treeId_stage: { treeId: tree.id, stage } },
        update: s,
        create: { treeId: tree.id, stage, ...s },
      });
    }
  }

  console.log("Seeding care guides...");
  for (const g of GUIDES) {
    const content = {
      title: g.title, topic: g.topic, species: g.species.join(","), stage: g.stage, symptoms: g.symptoms.join(","),
      sections: JSON.stringify(g.sections), sourceTitle: g.sourceTitle, sourceUrl: g.sourceUrl,
    };
    // Re-seeding refreshes the text but keeps an admin's review status
    await db.careGuide.upsert({ where: { slug: g.slug }, update: content, create: { slug: g.slug, ...content } });
  }

  console.log("Seeding demo accounts...");
  // Online, set ADMIN_EMAIL and ADMIN_PASSWORD so the admin login is private
  // (the demo admin password is printed on the log in page).
  const ownAdmin = process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim();
  const accounts = [
    ownAdmin
      ? { email: process.env.ADMIN_EMAIL!.trim().toLowerCase(), name: "Site Admin", role: "ADMIN", password: process.env.ADMIN_PASSWORD!.trim() }
      : { email: "admin@gaach.test", name: "Site Admin", role: "ADMIN", password: "Admin1234" },
    { email: "user@gaach.test", name: "Rahim Uddin", role: "USER", password: "User1234",
      phone: "01700000000", address: "House 12, Road 5, Dhanmondi, Dhaka" },
  ];
  for (const a of accounts) {
    const { password, ...rest } = a;
    const passwordHash = await bcrypt.hash(password, 10);
    await db.user.upsert({ where: { email: a.email }, update: {}, create: { ...rest, passwordHash } });
  }

  // The demo user gets two saved sites and a lemon tree bought three weeks ago,
  // so the assistant's personal context can be shown straight away.
  const demo = await db.user.findUniqueOrThrow({ where: { email: "user@gaach.test" } });
  if ((await db.site.count({ where: { userId: demo.id } })) === 0) {
    const dhaka = await db.district.findUniqueOrThrow({ where: { name: "Dhaka" } });
    const khulna = await db.district.findUniqueOrThrow({ where: { name: "Khulna" } });
    await db.site.createMany({
      data: [
        { userId: demo.id, name: "Rooftop", districtId: dhaka.id, spaceM: 3, sunlight: "FULL", soil: "LOAM", purpose: "FRUIT" },
        { userId: demo.id, name: "Village backyard", districtId: khulna.id, spaceM: 8, sunlight: "PARTIAL", soil: "CLAY", purpose: "SHADE" },
      ],
    });
  }
  if ((await db.order.count({ where: { userId: demo.id } })) === 0) {
    const lemon = await db.tree.findUniqueOrThrow({ where: { slug: "lemon" }, include: { products: { orderBy: { priceBdt: "asc" } } } });
    const p = lemon.products[0];
    const weeksAgo = (w: number) => new Date(Date.now() - w * 7 * 86_400_000);
    const order = await db.order.create({
      data: {
        userId: demo.id, status: "DELIVERED", paymentMethod: "COD", paymentStatus: "PAID",
        recipientName: demo.name, phone: demo.phone ?? "01700000000", address: demo.address ?? "Dhaka",
        subtotalBdt: p.priceBdt, deliveryFee: 120, totalBdt: p.priceBdt + 120, createdAt: weeksAgo(4),
        items: { create: [{ productId: p.id, titleSnapshot: p.title, unitPriceBdt: p.priceBdt, quantity: 1 }] },
      },
    });
    await db.ownedTree.create({ data: { userId: demo.id, treeId: lemon.id, orderId: order.id, quantity: 1, nickname: "Rooftop lemon", plantedAt: weeksAgo(3) } });
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
