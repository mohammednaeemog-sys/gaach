import { test } from "node:test";
import assert from "node:assert/strict";
import { currentStage } from "../src/modules/care/stage";

const day = 86_400_000;
const now = new Date("2026-06-01T12:00:00Z");

test("care stage follows days since planting", () => {
  assert.equal(currentStage(null, now).stage, "PLANTING_DAY");
  assert.equal(currentStage(new Date(now.getTime() - 2 * 3600_000), now).stage, "PLANTING_DAY");
  assert.equal(currentStage(new Date(now.getTime() - 3 * day), now).stage, "FIRST_WEEK");
  assert.equal(currentStage(new Date(now.getTime() - 30 * day), now).stage, "FIRST_SEASON");
  assert.equal(currentStage(new Date(now.getTime() - 200 * day), now).stage, "ONGOING");
});
