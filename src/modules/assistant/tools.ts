// Read-only tools the assistant can use (FR-7.3, FR-7.4, NFR-3.2).
//
// Rules every tool follows:
// - It only reads. No tool can order, pay, or change an account (FR-7.6).
// - The user is taken from the logged-in session (ToolContext.userId), never
//   from the model's input, so the model cannot ask for someone else's data.
// - Input is validated with zod before anything runs.
// - Missing data comes back as "unknown" or a clear error, never a guess.
import { z } from "zod";
import { db } from "@/lib/db";
import { CARE_STAGES, PURPOSES, SOILS, SUNLIGHT, DEFAULT_DELIVERY_FEE, DELIVERY_FEE_KEY, label, splitList, type CareStageKey } from "@/lib/constants";
import { currentStage } from "@/modules/care/stage";
import { describeRegion, eligibility, recommend, type SiteConditions } from "@/modules/recommendation/engine";
import { resolveTree } from "./lookup";
import { chunkGuides, GuideIndex, MIN_EVIDENCE_SCORE } from "./retrieval";

export type Source = { kind: "tree" | "guide" | "site" | "purchase" | "recommendation" | "product"; title: string; href: string; note?: string };

export type ToolContext = {
  userId: string;
  // Filled while tools run: what the answer may rely on
  sources: Source[];
  prices: Set<number>; // every price (৳) a tool returned this turn
  stock: Map<string, number>; // product title -> stock seen this turn
  toolsUsed: string[];
};

export function newToolContext(userId: string): ToolContext {
  return { userId, sources: [], prices: new Set(), stock: new Map(), toolsUsed: [] };
}

function addSource(ctx: ToolContext, s: Source) {
  if (!ctx.sources.some((x) => x.href === s.href)) ctx.sources.push(s);
}

const unknown = (v: string | number | null | undefined) => (v === "" || v === null || v === undefined || v === 0 ? "unknown" : v);
const words = (v: string) => (v ? splitList(v).map((x) => label(x).toLowerCase()) : ["unknown"]);

async function publishedTrees() {
  return db.tree.findMany({ where: { published: true }, orderBy: { name: "asc" } });
}
type TreeRow = Awaited<ReturnType<typeof publishedTrees>>[number];

async function findTree(name: string): Promise<{ tree: TreeRow } | { error: string; options?: string[] }> {
  const trees = await publishedTrees();
  const r = resolveTree(name, trees);
  if ("tree" in r) return { tree: r.tree };
  if ("ambiguous" in r) return { error: `"${name}" matches more than one tree in the catalogue. Ask the user which one.`, options: r.ambiguous.map((t) => t.name) };
  return { error: `No tree called "${name}" is in the Gaach catalogue. Do not describe it from general knowledge as if Gaach sells it.` };
}

function treeSummary(t: TreeRow) {
  return {
    slug: t.slug,
    name: t.name,
    bangla_name: unknown(t.banglaName),
    mature_height_m: unknown(t.matureHeightM),
    canopy_spread_m: unknown(t.canopySpreadM),
    sunlight: words(t.sunlight),
    purposes: words(t.purposes),
    page: `/trees/${t.slug}`,
  };
}

// ---------- tool definitions ----------

type ToolDef<S extends z.ZodTypeAny> = {
  name: string;
  description: string;
  input: S;
  jsonSchema: Record<string, unknown>;
  run: (input: z.infer<S>, ctx: ToolContext) => Promise<unknown>;
};

function tool<S extends z.ZodTypeAny>(d: ToolDef<S>) {
  return d;
}

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });
const str = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra });

const searchCatalogue = tool({
  name: "search_tree_catalogue",
  description:
    "Search the Gaach tree catalogue by name or by attributes. Use it to find trees that fit a purpose, sunlight, size or tolerance, or to check whether a tree is in the catalogue. Returns at most 10 trees with their page links.",
  input: z.object({
    query: z.string().max(100).optional(),
    purpose: z.enum(PURPOSES).optional(),
    sunlight: z.enum(SUNLIGHT).optional(),
    max_spread_m: z.number().positive().max(100).optional(),
    max_height_m: z.number().positive().max(100).optional(),
    tolerates: z.enum(["FLOOD", "DROUGHT", "SALT"]).optional(),
  }),
  jsonSchema: obj({
    query: str("Tree name or words to match, e.g. 'mango' or 'jarul'"),
    purpose: str("What the tree is for", { enum: [...PURPOSES] }),
    sunlight: str("Sunlight at the site", { enum: [...SUNLIGHT] }),
    max_spread_m: { type: "number", description: "Largest canopy spread that fits, in metres" },
    max_height_m: { type: "number", description: "Largest mature height that fits, in metres" },
    tolerates: str("Trees with HIGH tolerance of this condition", { enum: ["FLOOD", "DROUGHT", "SALT"] }),
  }),
  async run(i, ctx) {
    let trees = await publishedTrees();
    if (i.query) {
      const q = i.query.toLowerCase();
      const named = trees.filter((t) => `${t.name} ${t.banglaName} ${t.scientificName} ${t.slug} ${t.description}`.toLowerCase().includes(q));
      trees = named;
    }
    if (i.purpose) trees = trees.filter((t) => splitList(t.purposes).includes(i.purpose!));
    if (i.sunlight) trees = trees.filter((t) => splitList(t.sunlight).includes(i.sunlight!));
    if (i.max_spread_m) trees = trees.filter((t) => t.canopySpreadM <= i.max_spread_m!);
    if (i.max_height_m) trees = trees.filter((t) => t.matureHeightM <= i.max_height_m!);
    if (i.tolerates) {
      const key = { FLOOD: "floodTolerance", DROUGHT: "droughtTolerance", SALT: "salinityTolerance" }[i.tolerates] as "floodTolerance" | "droughtTolerance" | "salinityTolerance";
      trees = trees.filter((t) => t[key] === "HIGH");
    }
    const found = trees.slice(0, 10);
    found.slice(0, 5).forEach((t) => addSource(ctx, { kind: "tree", title: t.name, href: `/trees/${t.slug}` }));
    return { ok: true, count: trees.length, trees: found.map(treeSummary), note: trees.length > 10 ? "Showing the first 10 matches." : undefined };
  },
});

const treeDetails = tool({
  name: "get_tree_details",
  description:
    "Get the full catalogue record for one tree: size, growth, sunlight, soil, water, purposes, regional tolerances, season, cautions, and where its facts come from. Values marked 'unknown' are not recorded; say so instead of guessing.",
  input: z.object({ tree: z.string().min(2).max(80) }),
  jsonSchema: obj({ tree: str("Tree name or slug, e.g. 'guava' or 'mango-amrapali'") }, ["tree"]),
  async run(i, ctx) {
    const f = await findTree(i.tree);
    if ("error" in f) return { ok: false, ...f };
    const t = f.tree;
    addSource(ctx, { kind: "tree", title: t.name, href: `/trees/${t.slug}` });
    return {
      ok: true,
      tree: {
        ...treeSummary(t),
        scientific_name: unknown(t.scientificName),
        description: unknown(t.description),
        growth_rate: unknown(label(t.growthRate)),
        soils: words(t.soils),
        water_need: unknown(label(t.waterNeed)),
        rainfall_survives: words(t.rainfall),
        flood_tolerance: unknown(label(t.floodTolerance)),
        drought_tolerance: unknown(label(t.droughtTolerance)),
        salt_tolerance: unknown(label(t.salinityTolerance)),
        season: unknown(t.fruitingSeason),
        cautions: unknown(t.cautions),
        provenance: {
          source: t.sourceTitle || "not recorded",
          reviewed_by_expert: t.reviewStatus === "REVIEWED",
          reviewed_on: t.reviewedAt ? t.reviewedAt.toISOString().slice(0, 10) : null,
        },
      },
    };
  },
});

const productDetails = tool({
  name: "get_product_details",
  description:
    "Get the current products for a tree: plant size, age, price in taka, stock, plus the delivery fee and payment options. Always use this for prices and availability; never quote prices from memory or earlier in the chat.",
  input: z.object({ tree: z.string().min(2).max(80) }),
  jsonSchema: obj({ tree: str("Tree name or slug") }, ["tree"]),
  async run(i, ctx) {
    const f = await findTree(i.tree);
    if ("error" in f) return { ok: false, ...f };
    const products = await db.product.findMany({ where: { treeId: f.tree.id, active: true }, orderBy: { priceBdt: "asc" } });
    const fee = Number((await db.setting.findUnique({ where: { key: DELIVERY_FEE_KEY } }))?.value ?? DEFAULT_DELIVERY_FEE);
    ctx.prices.add(fee);
    for (const p of products) {
      ctx.prices.add(p.priceBdt);
      ctx.stock.set(p.sizeLabel, p.stock);
    }
    addSource(ctx, { kind: "product", title: `${f.tree.name}: sizes and prices`, href: `/trees/${f.tree.slug}#buy` });
    return {
      ok: true,
      tree: f.tree.name,
      on_sale: products.length > 0,
      products: products.map((p) => ({ size: p.sizeLabel, age_months: p.ageMonths, price_bdt: p.priceBdt, stock: p.stock, available: p.stock > 0 })),
      delivery_fee_bdt: fee,
      payment: "Cash on delivery, or online payment (test mode)",
      how_to_buy: `The user adds a size to the cart on the tree page (/trees/${f.tree.slug}) and checks out. The assistant cannot order for them.`,
    };
  },
});

const compareTrees = tool({
  name: "compare_trees",
  description: "Compare two or three catalogue trees on the same fields as the Gaach comparison page: size, growth, sunlight, soil, water, tolerances, purposes, season and lowest price.",
  input: z.object({ trees: z.array(z.string().min(2).max(80)).min(2).max(3) }),
  jsonSchema: obj({ trees: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3, description: "Two or three tree names or slugs" } }, ["trees"]),
  async run(i, ctx) {
    const rows = [];
    for (const name of i.trees) {
      const f = await findTree(name);
      if ("error" in f) return { ok: false, ...f };
      const t = f.tree;
      const cheapest = await db.product.findFirst({ where: { treeId: t.id, active: true }, orderBy: { priceBdt: "asc" } });
      if (cheapest) ctx.prices.add(cheapest.priceBdt);
      addSource(ctx, { kind: "tree", title: t.name, href: `/trees/${t.slug}` });
      rows.push({
        name: t.name,
        mature_height_m: unknown(t.matureHeightM),
        canopy_spread_m: unknown(t.canopySpreadM),
        growth_rate: unknown(label(t.growthRate)),
        sunlight: words(t.sunlight),
        soils: words(t.soils),
        water_need: unknown(label(t.waterNeed)),
        flood_tolerance: unknown(label(t.floodTolerance)),
        drought_tolerance: unknown(label(t.droughtTolerance)),
        salt_tolerance: unknown(label(t.salinityTolerance)),
        purposes: words(t.purposes),
        season: unknown(t.fruitingSeason),
        price_from_bdt: cheapest?.priceBdt ?? "not on sale",
      });
    }
    addSource(ctx, { kind: "tree", title: "Compare page", href: "/compare" });
    return { ok: true, trees: rows };
  },
});

const savedSites = tool({
  name: "get_saved_sites",
  description: "Get the logged-in user's own saved planting sites (name, district and its regional profile, space, sunlight, soil, purpose). Use it when the user mentions 'my rooftop', 'my backyard' or a site by name.",
  input: z.object({}),
  jsonSchema: obj({}),
  async run(_i, ctx) {
    const sites = await db.site.findMany({ where: { userId: ctx.userId }, include: { district: { include: { region: true } } }, orderBy: { createdAt: "asc" } });
    if (sites.length) addSource(ctx, { kind: "site", title: "Your saved sites", href: "/account" });
    return {
      ok: true,
      sites: sites.map((s) => ({
        name: s.name,
        district: s.district.name,
        regional_profile: `${s.district.region.name}: ${describeRegion(s.district.region)}`,
        space_m: s.spaceM,
        sunlight: label(s.sunlight),
        soil: label(s.soil),
        purpose: label(s.purpose),
      })),
      note: sites.length ? undefined : "The user has no saved sites. Ask for the district, space, sunlight, soil and purpose instead of assuming them.",
    };
  },
});

const purchasedTrees = tool({
  name: "get_user_purchased_trees",
  description: "Get the logged-in user's own purchased trees: name, nickname, quantity, order date and status, planting date and current care stage. Use it for 'my tree', 'the tree I bought', 'what should I do next'.",
  input: z.object({}),
  jsonSchema: obj({}),
  async run(_i, ctx) {
    const owned = await db.ownedTree.findMany({
      where: { userId: ctx.userId, order: { status: { not: "CANCELLED" } } },
      include: { tree: true, order: true },
      orderBy: { createdAt: "desc" },
    });
    if (owned.length) addSource(ctx, { kind: "purchase", title: "Your trees", href: "/my-trees" });
    return {
      ok: true,
      today: new Date().toISOString().slice(0, 10),
      trees: owned.map((o) => {
        const st = currentStage(o.plantedAt);
        return {
          tree: o.tree.name,
          nickname: o.nickname || null,
          quantity: o.quantity,
          ordered_on: o.order.createdAt.toISOString().slice(0, 10),
          order_status: label(o.order.status),
          planted_on: o.plantedAt ? o.plantedAt.toISOString().slice(0, 10) : "not planted yet (or the date was not recorded)",
          days_since_planting: st.days,
          current_care_stage: label(st.stage),
          care_page: `/my-trees/${o.id}`,
        };
      }),
      note: owned.length ? undefined : "The user has not bought any trees on Gaach.",
    };
  },
});

const carePlan = tool({
  name: "get_care_plan",
  description:
    "Get Gaach's care instructions (planting, watering, fertilizing, protection) for a tree at a care stage: Planting day, First week, First season or Ongoing. If the user owns the tree and no stage is given, their current stage is worked out from the planting date.",
  input: z.object({ tree: z.string().min(2).max(80), stage: z.enum(CARE_STAGES).optional() }),
  jsonSchema: obj({ tree: str("Tree name, slug, or the nickname of the user's own tree"), stage: str("Care stage", { enum: [...CARE_STAGES] }) }, ["tree"]),
  async run(i, ctx) {
    // The user's own tree first (by nickname or tree name), then the catalogue
    const owned = await db.ownedTree.findMany({ where: { userId: ctx.userId, order: { status: { not: "CANCELLED" } } }, include: { tree: true } });
    const q = i.tree.toLowerCase();
    const mine = owned.find((o) => (o.nickname && o.nickname.toLowerCase() === q) || o.tree.slug === q || o.tree.name.toLowerCase().includes(q) || q.includes(o.tree.name.split(" (")[0].toLowerCase()));
    let treeId: string, treeName: string, slug: string;
    let stage: CareStageKey = i.stage ?? "FIRST_SEASON";
    let ownedNote: string | undefined;
    if (mine) {
      treeId = mine.treeId; treeName = mine.tree.name; slug = mine.tree.slug;
      if (!i.stage) {
        const st = currentStage(mine.plantedAt);
        stage = st.stage;
        ownedNote = st.days === null ? "The user's tree has no planting date, so the planting day stage is shown." : `The user's tree was planted ${st.days} days ago, so it is in the ${label(st.stage)} stage.`;
      }
      addSource(ctx, { kind: "purchase", title: `Care plan: ${mine.nickname || mine.tree.name}`, href: `/my-trees/${mine.id}` });
    } else {
      const f = await findTree(i.tree);
      if ("error" in f) return { ok: false, ...f };
      treeId = f.tree.id; treeName = f.tree.name; slug = f.tree.slug;
      addSource(ctx, { kind: "tree", title: `${f.tree.name}: care plan`, href: `/trees/${slug}` });
    }
    const row = await db.careStage.findUnique({ where: { treeId_stage: { treeId, stage } } });
    if (!row) return { ok: false, error: `Gaach has no ${label(stage)} care plan for ${treeName}. Say so; do not invent one.` };
    const next = CARE_STAGES[CARE_STAGES.indexOf(stage) + 1];
    return {
      ok: true,
      tree: treeName,
      stage: label(stage),
      owned_tree: ownedNote,
      plan: { planting_or_upkeep: row.planting, watering: row.watering, fertilizing: row.fertilizing, protection: row.protection },
      next_stage: next ? label(next) : null,
    };
  },
});

const recommendation = tool({
  name: "get_recommendation_results",
  description:
    "Run Gaach's recommendation engine (the same deterministic rules as the Find trees page) for a saved site or for given conditions. Returns ranked trees with the engine's own reasons, how many trees each condition removed, and advice when nothing matches. Give explain_tree to get the exact reason one tree was or was not recommended. Never rank trees yourself.",
  input: z.object({
    site_name: z.string().max(60).optional(),
    district: z.string().max(40).optional(),
    space_m: z.number().positive().max(200).optional(),
    sunlight: z.enum(SUNLIGHT).optional(),
    soil: z.enum(SOILS).optional(),
    purpose: z.enum(PURPOSES).optional(),
    explain_tree: z.string().max(80).optional(),
  }),
  jsonSchema: obj({
    site_name: str("Name of one of the user's saved sites, e.g. 'Rooftop'"),
    district: str("District name, e.g. 'Khulna'"),
    space_m: { type: "number", description: "Available width for the canopy, in metres" },
    sunlight: str("Sunlight at the spot", { enum: [...SUNLIGHT] }),
    soil: str("Soil type", { enum: [...SOILS] }),
    purpose: str("What the tree is for", { enum: [...PURPOSES] }),
    explain_tree: str("A tree to explain, e.g. 'mango'"),
  }),
  async run(i, ctx) {
    let cond: { district?: string; space_m?: number; sunlight?: string; soil?: string; purpose?: string } = { ...i };
    let siteLabel = "the conditions given";
    if (i.site_name) {
      const sites = await db.site.findMany({ where: { userId: ctx.userId }, include: { district: true } });
      const site = sites.find((s) => s.name.toLowerCase() === i.site_name!.toLowerCase()) ?? sites.find((s) => s.name.toLowerCase().includes(i.site_name!.toLowerCase()));
      if (!site) return { ok: false, error: `The user has no saved site called "${i.site_name}".`, saved_sites: sites.map((s) => s.name) };
      cond = { district: site.district.name, space_m: site.spaceM, sunlight: site.sunlight, soil: site.soil, purpose: site.purpose, ...stripUndefined({ space_m: i.space_m, sunlight: i.sunlight, soil: i.soil, purpose: i.purpose }) };
      siteLabel = `saved site "${site.name}"`;
    }
    const missing = (["district", "space_m", "sunlight", "soil", "purpose"] as const).filter((k) => cond[k] === undefined);
    if (missing.length) return { ok: false, missing, error: `Ask the user for: ${missing.join(", ")}. Do not assume them.` };
    const district = await db.district.findFirst({ where: { name: { equals: cond.district! } }, include: { region: true } })
      ?? (await db.district.findMany({ include: { region: true } })).find((d) => d.name.toLowerCase() === cond.district!.toLowerCase());
    if (!district) return { ok: false, error: `"${cond.district}" is not one of the 64 districts Gaach knows. Ask the user to check the district name.` };
    const site: SiteConditions = { districtName: district.name, region: district.region, spaceM: cond.space_m!, sunlight: cond.sunlight as never, soil: cond.soil as never, purpose: cond.purpose as never };
    const trees = await db.tree.findMany({ where: { published: true }, include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } } } });
    const out = recommend(trees, site);
    const qs = new URLSearchParams({ divisionId: String(district.divisionId), districtId: String(district.id), spaceM: String(site.spaceM), sunlight: site.sunlight, soil: site.soil, purpose: site.purpose });
    addSource(ctx, { kind: "recommendation", title: `Recommendations for ${siteLabel}`, href: `/recommend?${qs}` });
    let explained: unknown;
    if (i.explain_tree) {
      // An ambiguous name like "mango" explains each matching tree
      const r = resolveTree(i.explain_tree, trees);
      const targets = "tree" in r ? [r.tree] : "ambiguous" in r ? r.ambiguous.slice(0, 3) : [];
      const explainOne = (t: (typeof trees)[number]) => {
        const rank = out.results.findIndex((x) => x.tree.id === t.id);
        addSource(ctx, { kind: "tree", title: t.name, href: `/trees/${t.slug}` });
        return rank >= 0
          ? { tree: t.name, recommended: true, rank: rank + 1, match: out.results[rank].matchLevel, reasons: out.results[rank].reasons, notes: out.results[rank].notes }
          : { tree: t.name, recommended: false, excluded_because: eligibility(t, site).blockers };
      };
      explained = targets.length ? targets.map(explainOne) : { error: `No tree called "${i.explain_tree}" is in the catalogue.` };
    }
    return {
      ok: true,
      site: { label: siteLabel, district: district.name, regional_profile: `${district.region.name}: ${describeRegion(district.region)}`, space_m: site.spaceM, sunlight: label(site.sunlight), soil: label(site.soil), purpose: label(site.purpose) },
      results: out.results.slice(0, 8).map((r, n) => ({ rank: n + 1, tree: r.tree.name, match: r.matchLevel, score: r.score, reasons: r.reasons, notes: r.notes })),
      total_matches: out.results.length,
      removed_by: out.eliminated,
      advice_if_none: out.advice?.message ?? null,
      explain: explained,
      caveat: "District profiles are general; a particular plot can differ (for example a raised yard in a flood-prone district).",
    };
  },
});

let indexCache: { key: string; index: GuideIndex } | null = null;
export async function guideIndex(): Promise<GuideIndex> {
  const agg = await db.careGuide.aggregate({ where: { published: true }, _count: true, _max: { updatedAt: true } });
  const key = `${agg._count}-${agg._max.updatedAt?.getTime() ?? 0}`;
  if (!indexCache || indexCache.key !== key) {
    const guides = await db.careGuide.findMany({ where: { published: true } });
    indexCache = { key, index: new GuideIndex(chunkGuides(guides)) };
  }
  return indexCache.index;
}

const searchKnowledge = tool({
  name: "search_care_knowledge",
  description:
    "Search Gaach's care guides (planting, watering, feeding, pests, diseases, problems like yellow leaves or wilting, site advice). Returns the best matching guide sections with their source and review status. Use this for any care advice beyond the tree's own care plan.",
  input: z.object({ query: z.string().min(2).max(200), tree: z.string().max(80).optional(), stage: z.enum(CARE_STAGES).optional() }),
  jsonSchema: obj({ query: str("What to look for, e.g. 'lemon leaves yellow with green veins'"), tree: str("Tree the question is about, if any"), stage: str("Care stage, if known", { enum: [...CARE_STAGES] }) }, ["query"]),
  async run(i, ctx) {
    let slug: string | null = null;
    if (i.tree) {
      const f = await findTree(i.tree);
      if ("tree" in f) slug = f.tree.slug;
    }
    const passages = (await guideIndex()).search(`${i.query} ${i.tree ?? ""}`, { tree: slug, stage: i.stage ?? null, limit: 3 });
    const good = passages.filter((p) => p.score >= MIN_EVIDENCE_SCORE);
    for (const p of good) addSource(ctx, { kind: "guide", title: p.guideTitle, href: `/guides/${p.guideSlug}`, note: p.reviewed ? undefined : "not yet expert-reviewed" });
    if (!good.length) return { ok: true, passages: [], note: "No guide covers this well. Tell the user Gaach has no verified guidance on it, and ask a clarifying question or suggest a local agricultural extension officer." };
    return {
      ok: true,
      passages: good.map((p) => ({ guide: p.guideTitle, section: p.heading, text: p.text, source: p.sourceTitle, expert_reviewed: p.reviewed, link: `/guides/${p.guideSlug}`, relevance: p.score })),
    };
  },
});

function stripUndefined<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export const TOOLS = [searchCatalogue, treeDetails, recommendation, compareTrees, productDetails, savedSites, purchasedTrees, carePlan, searchKnowledge];
export const TOOL_NAMES = TOOLS.map((t) => t.name);

// Runs one tool call safely: unknown tools, bad input and database errors all
// come back as an error result the model can read, never as a crash.
export async function runTool(name: string, rawInput: unknown, ctx: ToolContext): Promise<{ ok: boolean; [k: string]: unknown }> {
  const def = TOOLS.find((t) => t.name === name);
  if (!def) return { ok: false, error: `Unknown tool "${name}". Only these tools exist: ${TOOL_NAMES.join(", ")}.` };
  const parsed = (def.input as z.ZodTypeAny).safeParse(rawInput ?? {});
  if (!parsed.success) return { ok: false, error: `Invalid input for ${name}: ${parsed.error.issues.map((x) => `${x.path.join(".") || "input"} ${x.message}`).join("; ")}` };
  ctx.toolsUsed.push(name);
  try {
    return (await (def.run as (i: unknown, c: ToolContext) => Promise<unknown>)(parsed.data, ctx)) as { ok: boolean };
  } catch (e) {
    console.error(`assistant tool ${name} failed`, e);
    return { ok: false, error: "The Gaach database could not be read just now. Tell the user this information is temporarily unavailable; do not guess it." };
  }
}

