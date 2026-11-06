// Offline advisor: answers without the AI service, using the same router,
// tools and care guides. Used when no API key is set or the AI fails, so the
// assistant keeps working (NFR-4.3). Replies are built from templates, so
// they are plainer than AI replies, but every fact comes from Gaach's data.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SOILS, SUNLIGHT, PURPOSES, type CareStageKey } from "@/lib/constants";
import { runTool, type ToolContext } from "./tools";
import { CHEMICAL_DOSE, SLOT_QUESTIONS, SYMPTOMS, type ConvoState, type Intent, type Slot, type Trouble } from "./router";

type Input = {
  message: string;
  intent: Intent;
  state: ConvoState;
  treeNames: string[]; // catalogue trees named in this message (names)
  compareNames: string[]; // trees in the conversation's last comparison
  focusTree: string | null; // tree the conversation is about (name)
  nextSlot: Slot | null; // troubleshooting question to ask next, if any
  trouble: Trouble | null;
  districts: string[];
  ctx: ToolContext;
};

// A tree the user names that is not in the catalogue, e.g. "baobab" in "How much is a baobab tree?"
const NOT_NAMES = new Set("a an the my this that which what any some fruit shade flowering timber small big good best new young old your our their his her each every other one two three mango very tiny little large size space place more less many few nice local".split(" "));
function unknownTree(message: string): string | null {
  const m = message.toLowerCase().match(/\b([a-z]+) (tree|trees|sapling|saplings|seedling|plant|plants)\b/);
  if (m && !NOT_NAMES.has(m[1])) return m[1];
  const sell = message.toLowerCase().match(/\b(?:do you|does gaach|you) (?:sell|have|stock) (?:any )?([a-z]+)\b/);
  return sell && !NOT_NAMES.has(sell[1]) && !["trees", "plants", "saplings"].includes(sell[1]) ? sell[1] : null;
}

const first = (s: string, n = 2) => (s.match(/[^.!?]+[.!?]+/g) ?? [s]).slice(0, n).join("").trim();

export async function offlineAnswer(i: Input): Promise<string> {
  switch (i.intent) {
    case "greeting":
      if (/\bthank/.test(i.message.toLowerCase())) return "You're welcome! Ask me any time you need help with a tree.";
      return `I'm the Gaach Tree Advisor. I can help you with:
- Choosing a tree: tell me your district, how much space you have, the sunlight and what you want the tree for, or ask about one of your saved sites.
- Planting and care: watering, fertilizer, pruning, pots and rooftops, monsoon and dry season.
- Plant problems: yellow leaves, wilting, spots, pests or fruit drop. I ask a few questions and suggest likely causes.
- Comparing trees, and prices, sizes and stock in the Gaach shop.
- Your own trees: what to do next for the trees you bought.

For example: "I have a small rooftop in Dhaka with full sun, which fruit tree fits?"`;
    case "tree_recommendation":
      return recommendAnswer(i);
    case "recommendation_explanation":
      return explainAnswer(i);
    case "tree_comparison":
      return compareAnswer(i);
    case "product_question":
      return productAnswer(i);
    case "personal_context":
      return personalAnswer(i);
    case "care_troubleshooting":
      return troubleAnswer(i);
    case "tree_care":
      return careAnswer(i);
    case "tree_info":
      return infoAnswer(i);
    default:
      return knowledgeAnswer(i, true);
  }
}

// ---------- recommendation ----------

function parseConditions(text: string, districts: string[]) {
  const m = text.toLowerCase();
  const district = districts.find((d) => new RegExp(`\\b${d.toLowerCase()}\\b`).test(m));
  const space = m.match(/(\d+(?:\.\d+)?)\s?(?:m\b|metre|meter|metres|meters)/);
  const feet = m.match(/(\d+(?:\.\d+)?)\s?(?:ft|feet|foot)\b/);
  const sunlight = /full sun|sunny|lots of sun|whole day sun/.test(m) ? "FULL" : /partial|half|some sun|few hours/.test(m) ? "PARTIAL" : /\bshade|shady|no sun\b/.test(m) ? "SHADE" : undefined;
  const soil = SOILS.find((s) => m.includes(s.toLowerCase()));
  const purpose = /fruit/.test(m) ? "FRUIT" : /shade tree|for shade|cool/.test(m) ? "SHADE" : /flower|ornament|beaut/.test(m) ? "ORNAMENTAL" : /privacy|hedge|screen/.test(m) ? "PRIVACY" : /timber|wood/.test(m) ? "TIMBER" : undefined;
  return {
    district,
    space_m: space ? Number(space[1]) : feet ? Math.round(Number(feet[1]) * 0.3048 * 10) / 10 : undefined,
    sunlight: sunlight as (typeof SUNLIGHT)[number] | undefined,
    soil,
    purpose: purpose as (typeof PURPOSES)[number] | undefined,
  };
}

async function pickSite(i: Input): Promise<{ site?: string; ask?: string }> {
  const sites: any = await runTool("get_saved_sites", {}, i.ctx);
  const names: string[] = (sites.sites ?? []).map((s: any) => s.name);
  const m = i.message.toLowerCase();
  const named = names.find((n) => m.includes(n.toLowerCase())) ?? names.find((n) => n.toLowerCase().split(/\s+/).some((w) => w.length > 3 && m.includes(w)));
  if (named) return { site: named };
  if (i.state.siteName && names.includes(i.state.siteName)) return { site: i.state.siteName };
  if (/\bmy\b/.test(m) && names.length === 1) return { site: names[0] };
  if (/\bmy\b/.test(m) && names.length > 1) return { ask: `Which of your saved sites do you mean: ${names.map((n) => `"${n}"`).join(" or ")}?` };
  return {};
}

function listResults(r: any): string {
  if (!r.results?.length) return `No tree in the catalogue fits all of these conditions. ${r.advice_if_none ?? ""}`.trim();
  const lines = r.results.slice(0, 3).map((x: any) => `- ${x.tree} (${x.match}): ${x.reasons[0]}${x.notes?.length ? " " + x.notes[0] : ""}`);
  return `Top matches from Gaach's recommendation engine (${r.total_matches} tree${r.total_matches === 1 ? "" : "s"} fit):\n${lines.join("\n")}`;
}

async function recommendAnswer(i: Input): Promise<string> {
  const pick = await pickSite(i);
  if (pick.ask) return pick.ask;
  const parsed = parseConditions(i.message, i.districts);
  const input: any = pick.site ? { site_name: pick.site } : Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));
  const r: any = await runTool("get_recommendation_results", input, i.ctx);
  if (!r.ok) {
    if (r.missing) {
      // Without a full site, a question about a kind of tree can still be answered from the catalogue
      const found = await attributeSearch(i, parsed);
      if (found) return found;
      const ask: Record<string, string> = { district: "which district it is in", space_m: "how much width the tree can spread (in metres)", sunlight: "how much direct sun the spot gets", soil: "the soil type (clay, sandy or loam)", purpose: "what you want the tree for (fruit, shade, flowers, privacy or timber)" };
      return `I can run Gaach's recommendation for you with a little more about the spot. Could you tell me ${r.missing.map((k: string) => ask[k]).join("; ")}? You can also save the spot under Profile & sites and ask about it by name.`;
    }
    return r.error;
  }
  const where = pick.site ? `your saved site "${pick.site}" (${r.site.district}, ${r.site.regional_profile})` : `${r.site.district} (${r.site.regional_profile}), ${r.site.space_m} m space, ${r.site.sunlight.toLowerCase()}, ${r.site.soil.toLowerCase()} soil, for ${r.site.purpose.toLowerCase()}`;
  return `For ${where}:\n\n${listResults(r)}\n\n${r.caveat}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// "Which tree for summer?" -> SUMMER; Bangla season names too
const SEASON_WORDS: Record<string, string> = { NOW: "now", SUMMER: "in summer (April and May, before the rains)", MONSOON: "in the monsoon (June to September)", AUTUMN: "in autumn (September to November)", WINTER: "in winter (December to February)", SPRING: "in spring (February to April)" };
function seasonFromText(m: string): string | undefined {
  if (/\bsummer\b|গ্রীষ্ম|গরমে|গরমের/.test(m)) return "SUMMER";
  if (/\bmonsoon\b|\brain(y)? season\b|\bthe rains\b|বর্ষা/.test(m)) return "MONSOON";
  if (/\bwinter\b|শীত/.test(m)) return "WINTER";
  if (/\bspring\b|বসন্ত/.test(m)) return "SPRING";
  if (/\bautumn\b|\bfall season\b|শরৎ|হেমন্ত/.test(m)) return "AUTUMN";
  if (/\b(plant|grow)\w* (right )?now\b|\bthis (month|season)\b|এখন/.test(m)) return "NOW";
  return undefined;
}

async function attributeSearch(i: Input, parsed: ReturnType<typeof parseConditions>): Promise<string | null> {
  const m = i.message.toLowerCase();
  const input: any = {};
  if (parsed.purpose) input.purpose = parsed.purpose;
  if (/flower|bloom/.test(m)) input.purpose = "ORNAMENTAL";
  if (parsed.sunlight) input.sunlight = parsed.sunlight;
  if (/\bshade\b/.test(m) && /grow|tolerat|in (the )?shade|shady/.test(m)) { input.sunlight = "SHADE"; if (input.purpose === "SHADE") delete input.purpose; }
  if (parsed.space_m) input.max_spread_m = parsed.space_m;
  if (/\bsmall\b/.test(m) && !input.max_spread_m) input.max_spread_m = 3;
  if (/flood|waterlog|low land/.test(m)) input.tolerates = "FLOOD";
  else if (/salt|saline|coastal|coast/.test(m)) input.tolerates = "SALT";
  else if (/drought|dry area|dry region|little water/.test(m)) input.tolerates = "DROUGHT";
  const season = seasonFromText(m);
  if (season) input.season = season;
  if (!Object.keys(input).length) return null;
  const r: any = await runTool("search_tree_catalogue", input, i.ctx);
  if (!r.ok) return null;
  if (!r.trees.length && season && Object.keys(input).length === 1) {
    // Nothing is best planted then: point to the next good months instead
    const start = season === "NOW" ? new Date(Date.now() + 6 * 3600_000).getUTCMonth() + 1 : ({ SUMMER: 4, MONSOON: 6, AUTUMN: 9, WINTER: 12, SPRING: 2 } as Record<string, number>)[season];
    for (let k = 1; k <= 12; k++) {
      const month = ((start - 1 + k) % 12) + 1;
      const next: any = await runTool("search_tree_catalogue", { plant_month: month }, i.ctx);
      if (next.ok && next.trees.length) {
        const names = next.trees.slice(0, 6).map((t: any) => `- ${t.name}: best planted ${t.best_planting_months}`);
        return `None of Gaach's trees is at its best for planting ${SEASON_WORDS[season]}. The next good time starts in ${MONTH_NAMES[month - 1]}:\n${names.join("\n")}\n\nYou can still plant now if you water regularly; the tree just settles more slowly. Most trees do best early in the monsoon, June to September.`;
      }
    }
  }
  if (!r.trees.length) return "No tree in the Gaach catalogue matches all of that. Could you tell me more about the spot (district, space, sunlight, soil) so I can run the full recommendation?";
  const lines = r.trees.slice(0, 6).map((t: any) => `- ${t.name}: about ${t.mature_height_m} m tall, ${t.canopy_spread_m} m wide; ${t.sunlight.join(" or ")}; for ${t.purposes.join(", ")}${season ? `; best planted ${t.best_planting_months}` : ""}`);
  const intro = season ? `Trees in the Gaach catalogue that are good to plant ${SEASON_WORDS[season]} (${r.count} in all). Most trees in Bangladesh settle best when planted early in the monsoon, June to September:` : `Trees in the Gaach catalogue that match (${r.count} in all):`;
  return `${intro}\n${lines.join("\n")}\n\nFor a ranked recommendation for your exact spot, tell me the district, space, sunlight and soil, or ask about one of your saved sites.`;
}

async function explainAnswer(i: Input): Promise<string> {
  const tree = i.treeNames[0] ?? i.focusTree;
  if (!tree) return "Which tree would you like me to explain? For example: \"Why wasn't mango recommended for my rooftop?\"";
  const pick = await pickSite(i);
  if (pick.ask) return pick.ask;
  const parsed = parseConditions(i.message, i.districts);
  const input: any = pick.site ? { site_name: pick.site, explain_tree: tree } : { ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined)), explain_tree: tree };
  const r: any = await runTool("get_recommendation_results", input, i.ctx);
  if (!r.ok) {
    if (r.missing) return `To explain that, I need the site conditions. Which saved site or which district, space, sunlight, soil and purpose do you mean?`;
    return r.error;
  }
  const list: any[] = Array.isArray(r.explain) ? r.explain : [];
  if (!list.length) return r.explain?.error ?? "I could not find that tree in the catalogue.";
  const lines = list.map((e) =>
    e.recommended
      ? `${e.tree} is recommended for ${r.site.label} at rank ${e.rank} (${e.match}). The engine's reasons: ${e.reasons.join(" ")}${e.notes?.length ? " To be aware of: " + e.notes.join(" ") : ""}`
      : `${e.tree} is not recommended for ${r.site.label} because it ${e.excluded_because.join("; and it ")}.`,
  );
  return `${lines.join("\n\n")}\n\nThese are the same rules the Find trees page uses.`;
}

// ---------- comparison and products ----------

async function compareAnswer(i: Input): Promise<string> {
  const names = (i.treeNames.length >= 2 ? i.treeNames : i.compareNames.length >= 2 ? i.compareNames : [...new Set([...i.treeNames, ...(i.focusTree ? [i.focusTree] : [])])]).slice(0, 3);
  if (names.length < 2) return "Which two or three trees would you like to compare?";
  const r: any = await runTool("compare_trees", { trees: names }, i.ctx);
  if (!r.ok) return r.error + (r.options ? ` Options: ${r.options.join(", ")}.` : "");
  const t = r.trees;
  const m = i.message.toLowerCase();
  const lines = t.map((x: any) => `- ${x.name}: about ${x.mature_height_m} m tall and ${x.canopy_spread_m} m wide, ${String(x.growth_rate).toLowerCase()} growth, ${x.sunlight.join(" or ")}, water need ${String(x.water_need).toLowerCase()}, drought tolerance ${String(x.drought_tolerance).toLowerCase()}, flood tolerance ${String(x.flood_tolerance).toLowerCase()}, from ${typeof x.price_from_bdt === "number" ? "৳" + x.price_from_bdt : x.price_from_bdt}.`);
  let verdict = "";
  if (/space|smaller|small|less room|narrow|wide|spread/.test(m)) {
    const s = [...t].filter((x: any) => typeof x.canopy_spread_m === "number").sort((a: any, b: any) => a.canopy_spread_m - b.canopy_spread_m)[0];
    if (s) verdict = `${s.name} needs the least space (spreads about ${s.canopy_spread_m} m).`;
  } else if (/water|dry|drought/.test(m)) {
    const order = { Low: 0, Medium: 1, High: 2 } as Record<string, number>;
    const s = [...t].sort((a: any, b: any) => (order[a.water_need] ?? 9) - (order[b.water_need] ?? 9))[0];
    verdict = `${s.name} needs the least water (${String(s.water_need).toLowerCase()}).`;
  } else if (/cheap|price|cost/.test(m)) {
    const s = [...t].filter((x: any) => typeof x.price_from_bdt === "number").sort((a: any, b: any) => a.price_from_bdt - b.price_from_bdt)[0];
    if (s) verdict = `${s.name} is the cheapest, from ৳${s.price_from_bdt}.`;
  }
  return `${verdict ? verdict + "\n\n" : ""}${lines.join("\n")}\n\nThe Compare page shows these side by side.`;
}

async function productAnswer(i: Input): Promise<string> {
  const m = i.message.toLowerCase();
  const action = /\b(order|buy|purchase|pay|cancel)\b.*\b(for me|now|it)\b|\b(place|make) (an |the |my )?order\b|\badd (it )?to (my )?cart\b/.test(m);
  const tree = i.treeNames[0] ?? i.focusTree;
  if (!tree) {
    const other = unknownTree(i.message);
    if (other) return `${other.charAt(0).toUpperCase() + other.slice(1)} is not in the Gaach catalogue, so I don't have a price or stock for it. Would you like me to suggest a similar tree that Gaach sells?`;
    if (/deliver|payment|pay|cash/.test(m)) {
      return "Gaach delivers to all 64 districts. You can pay cash on delivery, or use online payment (test mode). The delivery fee is added at checkout. Which tree are you thinking of?";
    }
    return "Which tree would you like prices or stock for?";
  }
  const r: any = await runTool("get_product_details", { tree }, i.ctx);
  if (!r.ok) return r.error + (r.options ? ` Options: ${r.options.join(", ")}.` : "");
  const head = action ? "I can't place orders or change your cart, but here is what you need to order it yourself.\n\n" : "";
  if (!r.on_sale) return `${head}${r.tree} is not on sale right now.`;
  const lines = r.products.map((p: any) => `- ${p.size} (about ${p.age_months} months old): ৳${p.price_bdt}, ${p.available ? (p.stock <= 5 ? `only ${p.stock} left` : "in stock") : "out of stock"}`);
  return `${head}${r.tree} on Gaach right now:\n${lines.join("\n")}\n\nDelivery is ৳${r.delivery_fee_bdt}. Payment: ${r.payment.toLowerCase()}. Add a size to your cart on the tree page, then check out.`;
}

// ---------- personal context and care ----------

function stageFromText(m: string): CareStageKey | undefined {
  if (/planting day|on the day|when (i )?plant|how (do|to) (i )?plant|pit/.test(m)) return "PLANTING_DAY";
  if (/first week|this week|just planted|newly planted/.test(m)) return "FIRST_WEEK";
  if (/first season|first few months|first months/.test(m)) return "FIRST_SEASON";
  if (/ongoing|established|every year|mature|older tree/.test(m)) return "ONGOING";
  return undefined;
}

function pickFields(m: string, plan: any): string[] {
  const out: string[] = [];
  if (/water|পানি/.test(m)) out.push(`Watering: ${plan.watering}`);
  if (/fertil|compost|manure|feed|সার/.test(m)) out.push(`Fertilizing: ${plan.fertilizing}`);
  if (/plant|pit|weed|mulch|stake/.test(m)) out.push(`Planting and upkeep: ${plan.planting_or_upkeep}`);
  if (/protect|pest|insect|goat|cattle|wind|storm|shade/.test(m)) out.push(`Protection: ${plan.protection}`);
  if (!out.length) out.push(`Planting and upkeep: ${plan.planting_or_upkeep}`, `Watering: ${plan.watering}`, `Fertilizing: ${plan.fertilizing}`, `Protection: ${plan.protection}`);
  return out;
}

async function personalAnswer(i: Input): Promise<string> {
  const m = i.message.toLowerCase();
  if (/\b(site|sites|rooftop|roof|backyard|yard|garden|land)\b/.test(m) && !/\btree|lemon|mango|plant\b/.test(m)) {
    if (/\b(which|what) (tree|plant)|recommend|suggest|suit|grow/.test(m)) return recommendAnswer(i);
    const s: any = await runTool("get_saved_sites", {}, i.ctx);
    if (!s.sites.length) return s.note;
    const one = s.sites.find((x: any) => m.includes(x.name.toLowerCase()));
    if (one) return `Your saved site "${one.name}" is in ${one.district} (${one.regional_profile}): ${one.space_m} m of space, ${one.sunlight.toLowerCase()}, ${one.soil.toLowerCase()} soil, saved for ${one.purpose.toLowerCase()} trees. Ask me which trees suit it.`;
    return `Your saved sites:\n${s.sites.map((x: any) => `- "${x.name}": ${x.district} (${x.regional_profile}), ${x.space_m} m space, ${x.sunlight.toLowerCase()}, ${x.soil.toLowerCase()} soil, for ${x.purpose.toLowerCase()}`).join("\n")}\n\nAsk me which trees suit one of them.`;
  }
  const r: any = await runTool("get_user_purchased_trees", {}, i.ctx);
  const howTo = /\bhow (do|should|can) i\b|\bhow to\b|\bwhen should i\b/.test(m);
  if (!r.trees.length) {
    if (howTo) return careAnswer(i);
    return `You have not bought any trees on Gaach yet. When you do, I can guide you through each one's care plan stage by stage. Would you like help choosing a tree?`;
  }
  const named = i.treeNames[0] ?? i.focusTree;
  const mine = r.trees.find((t: any) => (named && t.tree.toLowerCase().includes(named.toLowerCase().split(" (")[0])) || (t.nickname && m.includes(t.nickname.toLowerCase()))) ?? (r.trees.length === 1 ? r.trees[0] : null);
  if (!mine) return `You have ${r.trees.length} trees from Gaach: ${r.trees.map((t: any) => t.nickname || t.tree).join(", ")}. Which one do you mean?`;
  const plan: any = await runTool("get_care_plan", { tree: mine.nickname || mine.tree }, i.ctx);
  if (!plan.ok) return plan.error;
  const when = typeof mine.days_since_planting === "number" ? `planted ${mine.days_since_planting} days ago` : "not marked as planted yet";
  const extra: any = howTo ? await runTool("search_care_knowledge", { query: i.message, tree: mine.tree }, i.ctx) : null;
  const tip = extra?.passages?.[0] ? `\n\nFrom the guide "${extra.passages[0].guide}": ${first(extra.passages[0].text)}` : "";
  return `Your ${mine.nickname || mine.tree} (${mine.tree}) was ${when}${mine.planted_on && /^\d{4}/.test(mine.planted_on) ? ` (on ${mine.planted_on})` : ""}, so it is in the ${plan.stage} stage. What to do now:\n${pickFields(m, plan.plan).map((x) => `- ${x}`).join("\n")}${tip}${plan.next_stage ? `\n\nNext comes the ${plan.next_stage} stage; the plan on My trees updates automatically.` : ""}`;
}

async function careAnswer(i: Input): Promise<string> {
  const m = i.message.toLowerCase();
  if (CHEMICAL_DOSE.test(m)) {
    const r: any = await runTool("search_care_knowledge", { query: "using sprays safely pesticide label" }, i.ctx);
    const p = r.passages?.find((x: any) => /spray/i.test(x.guide));
    return `I can't give doses for pesticides or other chemicals. The right product and amount depend on the pest, the tree and the label, and wrong use can harm you, children, animals and the fruit.\n\n${p ? `From "${p.guide}": ${first(p.text, 3)}\n\n` : ""}Try the mild steps first (washing pests off, removing affected parts, neem or soap sprays as the bottle directs). For a chemical spray, ask your local Upazila agriculture office and follow the product label exactly.`;
  }
  const tree = i.treeNames[0] ?? i.focusTree;
  const stage = stageFromText(m);
  if (tree) {
    const plan: any = await runTool("get_care_plan", { tree, ...(stage ? { stage } : {}) }, i.ctx);
    if (plan.ok) {
      const extra: any = await runTool("search_care_knowledge", { query: i.message, tree, ...(stage ? { stage } : {}) }, i.ctx);
      const tip = extra.passages?.[0] ? `\n\nFrom the guide "${extra.passages[0].guide}": ${first(extra.passages[0].text)}` : "";
      return `${plan.tree}, ${plan.stage.toLowerCase()} stage${plan.owned_tree ? ` (${plan.owned_tree})` : ""}:\n${pickFields(m, plan.plan).map((x) => `- ${x}`).join("\n")}${tip}`;
    }
    if (plan.error && !plan.options) return plan.error;
    if (plan.options) return `Which tree do you mean: ${plan.options.join(" or ")}?`;
  }
  return knowledgeAnswer(i, false);
}

async function infoAnswer(i: Input): Promise<string> {
  const tree = i.treeNames[0] ?? i.focusTree;
  if (!tree) return knowledgeAnswer(i, true);
  const r: any = await runTool("get_tree_details", { tree }, i.ctx);
  if (!r.ok) return r.error + (r.options ? ` Options: ${r.options.join(", ")}.` : "");
  const t = r.tree;
  const m = i.message.toLowerCase();
  const unrecorded = m.match(/\b(root depth|roots?|oxygen|lifespan|life span|how long (does it|do they) live|yield|how many (fruits?|mangoes|kg)|wood density|carbon)\b/);
  if (unrecorded) return `Gaach's record for ${t.name} does not include ${unrecorded[1].replace(/^how many /, "the number of ")}, so I can't give you a reliable figure. What it does record: about ${t.mature_height_m} m tall and ${t.canopy_spread_m} m wide, ${String(t.growth_rate).toLowerCase()} growth. For anything more specific, the local Upazila agriculture or forest office can help.`;
  const focus: string[] = [];
  if (/water|drought|dry/.test(m)) focus.push(`${t.name} needs ${String(t.water_need).toLowerCase()} water, and its drought tolerance is ${String(t.drought_tolerance).toLowerCase()}.`);
  if (/salt|saline|coast/.test(m)) focus.push(`${t.name}'s salt tolerance is ${String(t.salt_tolerance).toLowerCase()}${t.salt_tolerance === "High" ? ", so yes, it copes with salty soil" : t.salt_tolerance === "Low" ? ", so salty soil is a problem for it" : ""}.`);
  if (/flood|waterlog/.test(m)) focus.push(`${t.name}'s flood tolerance is ${String(t.flood_tolerance).toLowerCase()}.`);
  if (/sun|shade|light/.test(m)) focus.push(`${t.name} takes ${t.sunlight.join(" or ")}.`);
  if (/tall|height|big/.test(m)) focus.push(`${t.name} grows about ${t.mature_height_m} m tall.`);
  if (/wide|width|spread|big/.test(m)) focus.push(`It spreads about ${t.canopy_spread_m} m wide.`);
  if (/season|when does|fruit|flower/.test(m)) focus.push(`Season: ${t.season}.`);
  if (/scientific/.test(m)) focus.push(`Its scientific name is ${t.scientific_name}.`);
  if (/bangla|bengali|local name/.test(m)) focus.push(`In Bangla it is called ${t.bangla_name}.`);
  if (focus.length) return `${focus.join(" ")}${t.cautions !== "unknown" && !/^none/i.test(t.cautions) && /safe|child|poison|toxic|caution/.test(m) ? `\n\nCaution: ${t.cautions}` : ""}`;
  const cautions = t.cautions !== "unknown" && !/^none/i.test(t.cautions) ? `\n\nCaution: ${t.cautions}` : "";
  return `${t.name} (${t.bangla_name}; ${t.scientific_name}) grows about ${t.mature_height_m} m tall and ${t.canopy_spread_m} m wide, with ${String(t.growth_rate).toLowerCase()} growth. It takes ${t.sunlight.join(" or ")} and ${t.soils.join(" or ")} soil, needs ${String(t.water_need).toLowerCase()} water, and is grown for ${t.purposes.join(" and ")}. Season: ${t.season}. Tolerance: flood ${String(t.flood_tolerance).toLowerCase()}, drought ${String(t.drought_tolerance).toLowerCase()}, salt ${String(t.salt_tolerance).toLowerCase()}.${cautions}`;
}

async function knowledgeAnswer(i: Input, askBack: boolean): Promise<string> {
  const tree = i.treeNames[0] ?? i.focusTree ?? undefined;
  const r: any = await runTool("search_care_knowledge", { query: i.message.slice(0, 200), ...(tree ? { tree } : {}) }, i.ctx);
  if (!r.passages?.length) {
    return `Gaach does not have verified guidance on that.${askBack ? " Could you tell me which tree it is about and what you want to do, for example planting, watering or a problem you see?" : " For anything specific to your plot, the local Upazila agriculture office can help."}`;
  }
  const parts = r.passages.slice(0, 2).map((p: any) => `- ${p.section} (${p.guide}): ${first(p.text, 3)}`);
  const unreviewed = r.passages.some((p: any) => !p.expert_reviewed) ? "\n\nThese guides have not been checked by an expert yet." : "";
  return `Here is what Gaach's care guides say:\n${parts.join("\n")}${unreviewed}`;
}

// ---------- troubleshooting ----------

function likelyCauses(t: Trouble): string[] {
  const s = Object.fromEntries(Object.entries(t.slots).map(([k, v]) => [k, String(v).toLowerCase()]));
  const wet = /wet|soggy|standing|waterlog|puddle|muddy|every day|daily|twice/.test(`${s.soil ?? ""} ${s.watering ?? ""}`) && !/\bdry\b/.test(s.soil ?? "");
  const dry = /\bdry\b|not watered|forgot|once a week|rarely/.test(`${s.soil ?? ""} ${s.watering ?? ""}`) && !wet;
  const recent = /transplant|moved|planted|new/.test(s.recent ?? "") && !/nothing|no change/.test(s.recent ?? "");
  const out: string[] = [];
  const sym = t.symptom;
  if (["yellow-leaves", "wilting", "leaf-drop", "poor-growth"].includes(sym)) {
    if (wet) out.push("Too much water or poor drainage: the soil you describe stays wet, and roots short of air make leaves yellow, droop or fall.");
    if (dry) out.push("Too little water: the soil is dry at root depth.");
    if (recent) out.push("Transplant shock: the tree was planted or moved recently, and roots are still settling.");
  }
  if (sym === "yellow-leaves") {
    if (/old|older|lower|bottom/.test(s.pattern ?? "")) out.push("Low nitrogen: older, lower leaves are yellowing first, which often points to a nitrogen shortage, especially in pots or sandy soil.");
    if (/new|young|top|upper|veins? (are |stay )?green|green veins/.test(s.pattern ?? "")) out.push("A micronutrient shortage (such as iron or zinc): new leaves are yellow, which is common in citrus and often linked to wet or alkaline soil.");
  }
  if (/pot|drum|tub|container/.test(s.place ?? "") && ["yellow-leaves", "poor-growth"].includes(sym)) out.push("Container limits: soil in pots dries fast and nutrients wash out, so feeding and watering need to be more regular.");
  if (s.pestlook) {
    const p = s.pestlook;
    if (/green|black|aphid/.test(p)) out.push("Aphids: small green or black insects on new shoots.");
    if (/white|cotton|mealy/.test(p)) out.push("Mealybugs: white cottony clumps.");
    if (/bump|scale/.test(p)) out.push("Scale insects: small bumps stuck to stems and leaves.");
    if (/silver|trail/.test(p)) out.push("Leaf miners: silvery trails inside young leaves.");
    if (/hole|chew|caterpillar|worm/.test(p)) out.push("Caterpillars or beetles chewing the leaves.");
  }
  return out;
}

async function troubleAnswer(i: Input): Promise<string> {
  const t = i.trouble;
  if (!t) return knowledgeAnswer(i, true);
  const what = SYMPTOMS[t.symptom]?.label ?? "this problem";
  if (i.nextSlot) {
    const intro = Object.keys(t.slots).length <= 1 && !t.slots.pattern && !t.slots.soil
      ? t.symptom === "general" ? "Let's work out what is wrong. A few quick questions first.\n\n" : `Let's work out what is causing the ${what}. Symptoms can have several causes, so a few quick questions first.\n\n`
      : "";
    return `${intro}${SLOT_QUESTIONS[i.nextSlot]}`;
  }
  const tree = t.slots.tree ? i.focusTree ?? t.slots.tree : undefined;
  const query = `${what} ${Object.values(t.slots).join(" ")}`.slice(0, 200);
  const r: any = await runTool("search_care_knowledge", { query, ...(tree ? { tree } : {}) }, i.ctx);
  const causes = likelyCauses(t);
  const steps = (r.passages ?? []).slice(0, 2).map((p: any) => `- ${p.section} (${p.guide}): ${first(p.text, 2)}`);
  const out: string[] = [];
  out.push(causes.length ? `Possible causes, based on what you told me (this is not a definite diagnosis):\n${causes.map((c) => `- ${c}`).join("\n")}` : `From your answers there is no single clear cause for the ${what}, so here is what Gaach's guides suggest checking.`);
  if (steps.length) out.push(`What the guides suggest:\n${steps.join("\n")}`);
  out.push("Start with the low-risk steps (watering, drainage, removing badly affected leaves). If the tree keeps getting worse, the stem is soft or dark at the base, or many branches die, ask your local Upazila agriculture office to look at it.");
  if ((r.passages ?? []).some((p: any) => !p.expert_reviewed)) out.push("Note: these guides have not been checked by an expert yet.");
  return out.join("\n\n");
}

export const _test = { parseConditions, likelyCauses, stageFromText, seasonFromText };
