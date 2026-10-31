import { test } from "node:test";
import assert from "node:assert/strict";
import { priceFor, isLive, treePrices } from "../src/modules/shop/price-rules";

const eid = { id: "p1", name: "Eid sale", badge: "EID SALE", percentOff: 20, allTrees: true, treeIds: [] };
const mangoOnly = { id: "p2", name: "Mango week", badge: "MANGO WEEK", percentOff: 30, allTrees: false, treeIds: ["mango"] };

test("no discount keeps the normal price", () => {
  assert.deepEqual(priceFor({ priceBdt: 500 }, "neem", []), { now: 500, was: null, percentOff: 0, badge: null, occasion: null });
});

test("admin sale price shows the old price crossed out", () => {
  const p = priceFor({ priceBdt: 2695, salePriceBdt: 1795 }, "neem", []);
  assert.equal(p.now, 1795);
  assert.equal(p.was, 2695);
  assert.equal(p.percentOff, 33);
  assert.equal(p.badge, "SALE");
});

test("a sale price higher than the normal price is ignored", () => {
  assert.equal(priceFor({ priceBdt: 300, salePriceBdt: 400 }, "neem", []).now, 300);
});

test("the occasion sale applies to every tree when set to all trees", () => {
  const p = priceFor({ priceBdt: 500 }, "neem", [eid]);
  assert.equal(p.now, 400);
  assert.equal(p.badge, "EID SALE");
  assert.equal(p.occasion, "Eid sale");
});

test("a sale for chosen trees only applies to those trees, and the best price wins", () => {
  assert.equal(priceFor({ priceBdt: 500 }, "neem", [eid, mangoOnly]).now, 400);
  assert.equal(priceFor({ priceBdt: 500 }, "mango", [eid, mangoOnly]).now, 350);
  assert.equal(priceFor({ priceBdt: 500, salePriceBdt: 300 }, "mango", [eid, mangoOnly]).now, 300);
});

test("sale dates decide whether it is live", () => {
  const now = new Date("2026-06-01");
  assert.equal(isLive({ active: true, startsAt: new Date("2026-05-01"), endsAt: new Date("2026-06-30") }, now), true);
  assert.equal(isLive({ active: true, startsAt: new Date("2026-07-01"), endsAt: null }, now), false);
  assert.equal(isLive({ active: true, startsAt: null, endsAt: new Date("2026-05-31") }, now), false);
  assert.equal(isLive({ active: false, startsAt: null, endsAt: null }, now), false);
});

test("tree prices give the cheapest size and the biggest discount", () => {
  const r = treePrices([{ priceBdt: 800 }, { priceBdt: 400, salePriceBdt: 360 }], "neem", []);
  assert.equal(r.cheapest?.price.now, 360);
  assert.equal(r.top?.percentOff, 10);
});
