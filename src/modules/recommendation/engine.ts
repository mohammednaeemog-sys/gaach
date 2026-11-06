// Recommendation engine (FR-3). Pure and deterministic: identical inputs and
// identical catalogue data always give the same ranking (NFR-4.1).
import { label, splitList, type Purpose, type Soil, type Sunlight } from "@/lib/constants";
import { MATCH_LEVELS, WEIGHTS } from "./weights";
import { monthRange } from "@/lib/planting";

export type RegionProfile = {
  name: string;
  rainfall: string; // LOW | MEDIUM | HIGH
  floodProne: boolean;
  droughtProne: boolean;
  saline: boolean;
};

export type TreeFacts = {
  id: string;
  slug: string;
  name: string;
  canopySpreadM: number;
  sunlight: string;
  soils: string;
  purposes: string;
  rainfall: string;
  floodTolerance: string;
  droughtTolerance: string;
  salinityTolerance: string;
  plantingMonths?: number[]; // best planting months (1 to 12)
};

export type SiteConditions = {
  districtName: string;
  region: RegionProfile;
  spaceM: number;
  sunlight: Sunlight;
  soil: Soil;
  purpose: Purpose;
  planting?: { months: number[]; label: string }; // when the user will plant, e.g. "now (Nov)"
};

export type Recommendation<T extends TreeFacts> = {
  tree: T;
  score: number;
  matchLevel: string;
  reasons: string[];
  notes: string[]; // things to be aware of, e.g. soil needs improving
};

export type Eliminator = "region" | "space" | "sunlight";

export type NoMatchAdvice = {
  condition: Eliminator;
  removed: number;
  message: string;
};

export type RecommendationResult<T extends TreeFacts> = {
  results: Recommendation<T>[];
  eliminated: Record<Eliminator, number>;
  advice: NoMatchAdvice | null;
};

function regionBlockers(t: TreeFacts, r: RegionProfile): string[] {
  const out: string[] = [];
  if (!splitList(t.rainfall).includes(r.rainfall)) out.push(`${label(r.rainfall).toLowerCase()} rainfall`);
  if (r.floodProne && t.floodTolerance === "LOW") out.push("flooding");
  if (r.droughtProne && t.droughtTolerance === "LOW") out.push("dry spells");
  if (r.saline && t.salinityTolerance === "LOW") out.push("salty soil");
  return out;
}

function fmtM(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} m`;
}

export function recommend<T extends TreeFacts>(trees: T[], site: SiteConditions): RecommendationResult<T> {
  const eliminated: Record<Eliminator, number> = { region: 0, space: 0, sunlight: 0 };
  // Trees that fail exactly one filter, used to suggest which condition to relax
  const onlyFailed: Record<Eliminator, T[]> = { region: [], space: [], sunlight: [] };
  const passed: T[] = [];

  for (const t of trees) {
    const fails: Eliminator[] = [];
    if (regionBlockers(t, site.region).length) fails.push("region");
    if (t.canopySpreadM > site.spaceM) fails.push("space");
    if (!splitList(t.sunlight).includes(site.sunlight)) fails.push("sunlight");
    for (const f of fails) eliminated[f]++;
    if (fails.length === 1) onlyFailed[fails[0]].push(t);
    if (!fails.length) passed.push(t);
  }

  const results = passed.map((t) => score(t, site));
  results.sort((a, b) => b.score - a.score || a.tree.name.localeCompare(b.tree.name) || a.tree.id.localeCompare(b.tree.id));

  const advice = results.length ? null : buildAdvice(eliminated, onlyFailed, site);
  return { results, eliminated, advice };
}

function score<T extends TreeFacts>(t: T, site: SiteConditions): Recommendation<T> {
  const W = WEIGHTS;
  const max =
    W.soilMatch + W.purposePrimary + W.spaceFit + W.sunPreferred +
    W.regionStrength * [site.region.floodProne, site.region.droughtProne, site.region.saline].filter(Boolean).length +
    (site.planting && t.plantingMonths?.length ? W.seasonMatch : 0);
  let points = 0;
  const reasons: string[] = [];
  const notes: string[] = [];

  const sun = splitList(t.sunlight);
  const sunText = site.sunlight === "FULL" ? "grows well in full sun" : site.sunlight === "PARTIAL" ? "tolerates partial shade" : "copes with shade";
  if (sun[0] === site.sunlight) points += W.sunPreferred;
  reasons.push(`${sunText} and fits your ${fmtM(site.spaceM)} space (spreads about ${fmtM(t.canopySpreadM)})`);
  const share = t.canopySpreadM / site.spaceM;
  points += share <= W.comfortableShare ? W.spaceFit : W.spaceFit * 0.5;
  if (share > W.comfortableShare) notes.push("It will fill almost all of your space when mature.");

  const purposes = splitList(t.purposes);
  if (purposes[0] === site.purpose) {
    points += W.purposePrimary;
    reasons.push(`a top choice for ${label(site.purpose).toLowerCase()}`);
  } else if (purposes.includes(site.purpose)) {
    points += W.purposeSecondary;
    reasons.push(`also good for ${label(site.purpose).toLowerCase()}`);
  } else {
    notes.push(`Not usually planted for ${label(site.purpose).toLowerCase()}; it is mainly grown for ${purposes.map((p) => label(p).toLowerCase()).join(" and ")}.`);
  }

  if (splitList(t.soils).includes(site.soil)) {
    points += W.soilMatch;
    reasons.push(`suits ${label(site.soil).toLowerCase()} soil`);
  } else {
    notes.push(`Prefers ${splitList(t.soils).map((s) => label(s).toLowerCase()).join(" or ")} soil; mix in compost or sand when planting.`);
  }

  const r = site.region;
  const strengths: string[] = [];
  if (r.floodProne && t.floodTolerance === "HIGH") strengths.push("flooding");
  if (r.droughtProne && t.droughtTolerance === "HIGH") strengths.push("dry spells");
  if (r.saline && t.salinityTolerance === "HIGH") strengths.push("salty soil");
  points += strengths.length * W.regionStrength;
  if (strengths.length) reasons.push(`handles the ${strengths.join(" and ")} common in ${site.districtName}`);
  else reasons.push(`survives the conditions in ${site.districtName}`);

  if (site.planting && t.plantingMonths?.length) {
    if (t.plantingMonths.some((m) => site.planting!.months.includes(m))) {
      points += W.seasonMatch;
      reasons.push(`a good tree to plant ${site.planting.label}`);
    } else {
      notes.push(`Best planted in ${monthRange(t.plantingMonths)}. It can go in ${site.planting.label} with regular watering, but settles fastest in those months.`);
    }
  }

  const scoreOut = Math.round((points / max) * 100);
  const matchLevel = MATCH_LEVELS.find((m) => scoreOut >= m.min)!.level;
  const sentence = reasons.join(", ");
  return { tree: t, score: scoreOut, matchLevel, reasons: [sentence.charAt(0).toUpperCase() + sentence.slice(1) + "."], notes };
}

function buildAdvice<T extends TreeFacts>(
  eliminated: Record<Eliminator, number>,
  onlyFailed: Record<Eliminator, T[]>,
  site: SiteConditions,
): NoMatchAdvice {
  // The condition that removed the most trees; ties broken in a fixed order
  const order: Eliminator[] = ["space", "sunlight", "region"];
  const condition = order.reduce((best, c) => (eliminated[c] > eliminated[best] ? c : best), order[0]);
  const removed = eliminated[condition];

  let message: string;
  if (condition === "space") {
    const smallest = onlyFailed.space.map((t) => t.canopySpreadM).sort((a, b) => a - b)[0];
    message = smallest
      ? `Available space removed ${removed} trees. If you can give a tree about ${fmtM(Math.ceil(smallest))} of width, at least one suitable tree becomes available.`
      : `Available space removed ${removed} trees. Try a larger space, or a different sunlight setting as well.`;
  } else if (condition === "sunlight") {
    const alt = onlyFailed.sunlight.length ? splitList(onlyFailed.sunlight[0].sunlight)[0] : null;
    message = alt
      ? `Sunlight removed ${removed} trees. If the spot gets more light than you thought, try "${label(alt)}".`
      : `Sunlight removed ${removed} trees. Try a sunnier spot.`;
  } else {
    message = `The local conditions in ${site.districtName} (${describeRegion(site.region)}) removed ${removed} trees. This cannot be changed, but a raised bed or a large drum on a rooftop can help, or try a different site.`;
  }
  return { condition, removed, message };
}

// Why one tree is or is not eligible for a site, using the same rules as
// recommend(). The assistant uses this to explain results without inventing
// its own reasons (FR-7.4).
export function eligibility(t: TreeFacts, site: SiteConditions): { eligible: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const region = regionBlockers(t, site.region);
  if (region.length) blockers.push(`cannot cope with the ${region.join(", ")} of ${site.districtName} (${describeRegion(site.region)})`);
  if (t.canopySpreadM > site.spaceM) blockers.push(`spreads about ${fmtM(t.canopySpreadM)}, wider than the ${fmtM(site.spaceM)} space`);
  if (!splitList(t.sunlight).includes(site.sunlight)) {
    blockers.push(`needs ${splitList(t.sunlight).map((s) => label(s).toLowerCase()).join(" or ")}, but the site has ${label(site.sunlight).toLowerCase()}`);
  }
  return { eligible: blockers.length === 0, blockers };
}

export function describeRegion(r: RegionProfile): string {
  const parts = [`${label(r.rainfall).toLowerCase()} rainfall`];
  if (r.floodProne) parts.push("flood-prone");
  if (r.droughtProne) parts.push("dry spells");
  if (r.saline) parts.push("salty soil");
  return parts.join(", ");
}
