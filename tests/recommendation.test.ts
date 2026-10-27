import { test } from "node:test";
import assert from "node:assert/strict";
import { recommend, type TreeFacts, type SiteConditions } from "../src/modules/recommendation/engine";
import { TREES } from "../prisma/data/trees";

const catalogue: TreeFacts[] = TREES.map((t, i) => ({
  id: String(i), slug: t.slug, name: t.name, canopySpreadM: t.canopySpreadM,
  sunlight: t.sunlight.join(","), soils: t.soils.join(","), purposes: t.purposes.join(","),
  rainfall: t.rainfall.join(","), floodTolerance: t.floodTolerance,
  droughtTolerance: t.droughtTolerance, salinityTolerance: t.salinityTolerance,
}));

const dhakaRooftop: SiteConditions = {
  districtName: "Dhaka",
  region: { name: "Central", rainfall: "MEDIUM", floodProne: false, droughtProne: false, saline: false },
  spaceM: 3, sunlight: "FULL", soil: "LOAM", purpose: "FRUIT",
};

test("only trees that fit the space and sunlight are returned", () => {
  const { results } = recommend(catalogue, dhakaRooftop);
  assert.ok(results.length > 0);
  for (const r of results) assert.ok(r.tree.canopySpreadM <= 3);
  assert.ok(results.slice(0, 3).some((r) => r.tree.slug === "mango-amrapali"));
  assert.match(results[0].reasons[0], /fits your 3 m space/);
});

test("identical inputs give identical rankings (NFR-4.1)", () => {
  const a = recommend(catalogue, dhakaRooftop).results.map((r) => r.tree.id);
  const b = recommend([...catalogue].reverse(), dhakaRooftop).results.map((r) => r.tree.id);
  assert.deepEqual(a, b);
});

test("salty coast removes salt-sensitive trees", () => {
  const { results } = recommend(catalogue, {
    ...dhakaRooftop, districtName: "Khulna", spaceM: 20,
    region: { name: "SW coast", rainfall: "HIGH", floodProne: true, droughtProne: false, saline: true },
  });
  const slugs = results.map((r) => r.tree.slug);
  assert.ok(slugs.includes("coconut"));
  assert.ok(!slugs.includes("mango-himsagar"));
});

test("no match names the condition that removed the most trees", () => {
  const out = recommend(catalogue, { ...dhakaRooftop, spaceM: 1, sunlight: "SHADE" });
  assert.equal(out.results.length, 0);
  assert.ok(out.advice);
  assert.equal(out.advice!.condition, "space");
  assert.match(out.advice!.message, /space/i);
});
