// Downloads one openly licensed photo per tree from Wikimedia Commons and
// records who took it and under which license.
//
//   npm run photos            fetch photos for trees that do not have one yet
//   npm run photos -- --force fetch again for every tree
//
// Photos are saved to public/trees/<slug>.jpg and credits to
// prisma/data/photo-credits.json, which the seed script reads. If the
// database exists, it is updated straight away too.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { TREES } from "../prisma/data/trees";
import { pickPhoto, type CommonsPage, type PhotoCredit } from "./photo-pick";

const API = "https://commons.wikimedia.org/w/api.php";
// Wikimedia asks every client to identify itself
const UA = "GaachTreePlatform/0.1 (course project; photo credits kept in photo-credits.json)";
const OUT_DIR = path.join(process.cwd(), "public", "trees");
const CREDITS = path.join(process.cwd(), "prisma", "data", "photo-credits.json");

// Search words that find a good photo of the whole plant, by tree slug
const QUERIES: Record<string, string[]> = {
  "mango-himsagar": ["Mangifera indica tree", "Mango tree Bangladesh"],
  "mango-amrapali": ["Amrapali mango tree", "Mango tree in pot", "Mangifera indica tree"],
  jackfruit: ["Jackfruit tree", "Artocarpus heterophyllus tree"],
  litchi: ["Lychee tree", "Litchi chinensis tree"],
  guava: ["Psidium guajava tree", "Guava fruit tree"],
  lemon: ["Lime tree Citrus aurantiifolia", "Key lime tree", "Lemon tree garden"],
  papaya: ["Papaya tree", "Carica papaya tree"],
  coconut: ["Cocos nucifera tree", "Coconut palm"],
  "date-palm": ["Phoenix sylvestris", "Date palm Bangladesh"],
  palmyra: ["Borassus flabellifer tree", "Palmyra palm"],
  neem: ["Azadirachta indica tree", "Neem tree"],
  krishnachura: ["Delonix regia tree", "Krishnachura tree"],
  radhachura: ["Caesalpinia pulcherrima plant", "Peacock flower Caesalpinia"],
  jarul: ["Lagerstroemia speciosa tree", "Jarul tree"],
  kadam: ["Neolamarckia cadamba tree", "Kadam tree"],
  hijal: ["Barringtonia acutangula tree", "Hijal tree"],
  koroch: ["Pongamia pinnata tree", "Millettia pinnata tree"],
  mahogany: ["Swietenia macrophylla tree", "Mahogany tree"],
  teak: ["Tectona grandis tree", "Teak tree"],
  arjun: ["Terminalia arjuna tree", "Arjun tree"],
  sonalu: ["Cassia fistula tree", "Golden shower tree"],
  keora: ["Sonneratia apetala", "Keora tree Sundarbans"],
  "bamboo-borak": ["Bambusa balcooa", "Bamboo clump Bangladesh"],
  hibiscus: ["Hibiscus rosa-sinensis plant", "Hibiscus shrub", "Hibiscus rosa-sinensis"],
  kamini: ["Murraya paniculata plant", "Orange jasmine shrub"],
  "areca-palm": ["Dypsis lutescens", "Areca palm plant"],
  bel: ["Aegle marmelos tree", "Bael tree"],
  "java-plum": ["Syzygium cumini tree", "Java plum tree"],
  "wax-apple": ["Syzygium samarangense tree", "Wax apple tree"],
  amloki: ["Phyllanthus emblica tree", "Amla tree"],
};

async function search(query: string): Promise<CommonsPage[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "900",
  });
  const res = await fetch(`${API}?${params}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons search failed (${res.status})`);
  const data = (await res.json()) as { query?: { pages?: CommonsPage[] } };
  return (data.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

async function main() {
  const force = process.argv.includes("--force");
  mkdirSync(OUT_DIR, { recursive: true });
  const credits: Record<string, PhotoCredit> = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, "utf8")) : {};

  for (const tree of TREES) {
    const file = path.join(OUT_DIR, `${tree.slug}.jpg`);
    if (!force && credits[tree.slug] && existsSync(file)) {
      console.log(`skip   ${tree.slug} (already has a photo)`);
      continue;
    }
    // Search every query for this tree, then pick the best photo across all results
    const pages: CommonsPage[] = [];
    for (const q of QUERIES[tree.slug] ?? [`${tree.scientificName} tree`]) {
      try {
        const found = await search(q);
        for (const p of found) if (!pages.some((x) => x.title === p.title)) pages.push(p);
      } catch (e) {
        console.error(`error  ${tree.slug}: ${(e as Error).message}`);
      }
    }
    const chosen = pickPhoto(pages);
    if (!chosen) {
      console.log(`none   ${tree.slug}: no openly licensed photo found; upload one in the admin panel`);
      continue;
    }
    const img = await fetch(chosen.downloadUrl, { headers: { "User-Agent": UA } });
    if (!img.ok) {
      console.error(`error  ${tree.slug}: download failed (${img.status})`);
      continue;
    }
    writeFileSync(file, Buffer.from(await img.arrayBuffer()));
    credits[tree.slug] = chosen;
    console.log(`saved  ${tree.slug}  <- ${chosen.title} (${chosen.license})`);
    await new Promise((r) => setTimeout(r, 300)); // be gentle with the API
  }

  writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + "\n");
  console.log(`\nCredits written to ${path.relative(process.cwd(), CREDITS)}`);

  // Update the database too, if it has been set up
  try {
    const { PrismaClient } = await import("@prisma/client");
    const db = new PrismaClient();
    for (const [slug, c] of Object.entries(credits)) {
      await db.tree.updateMany({
        where: { slug, OR: [{ imageUrl: null }, { imageUrl: { startsWith: "/trees/" } }] },
        data: { imageUrl: `/trees/${slug}.jpg`, imageCredit: c.credit, imageSourceUrl: c.sourceUrl },
      });
    }
    await db.$disconnect();
    console.log("Database updated.");
  } catch {
    console.log("Database not updated (run `npm run db:seed` to load the photos).");
  }
}

main();
