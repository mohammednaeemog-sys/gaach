// Photo check: input limits, honest wording and guide links (fake Gemini, no network).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { checkPhoto, formatVerdict, validImage, PhotoCheckError } from "../src/modules/assistant/photo";
import type { FetchLike } from "../src/modules/assistant/gemini";

const tiny = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQ==";
after(() => db.$disconnect());

function fake(content: string): FetchLike {
  return async (_url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.messages[1].content[1].type, "image_url", "the photo is sent to the model");
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }), text: async () => "" };
  };
}

test("only small jpg/png/webp data URLs are accepted", () => {
  assert.ok(validImage(tiny));
  assert.equal(validImage("data:image/gif;base64,AAAA"), false);
  assert.equal(validImage("https://example.com/a.jpg"), false);
  assert.equal(validImage("data:image/jpeg;base64," + "A".repeat(1_500_000)), false);
});

test("a finding is worded with its certainty and links only real guides", async () => {
  process.env.GEMINI_API_KEY ||= "test-key";
  const guide = await db.careGuide.findFirstOrThrow({ where: { published: true, topic: "disease" } });
  const out = await checkPhoto({
    image: tiny,
    note: "spots after rain",
    fetchImpl: fake(JSON.stringify({ is_plant: true, plant: "Mango", photo_quality: "good", healthy: false, findings: [{ problem: "Leaf spot", likelihood: "possible", signs: "brown rings" }], steps: ["Remove bad leaves"], avoid: "Avoid wetting leaves", need_more: "", guides: [guide.slug, "made-up-guide"] })),
  });
  assert.match(out.reply, /Possibly: Leaf spot/);
  assert.match(out.reply, /Avoid: wetting leaves/);
  assert.match(out.reply, /can't confirm a diagnosis/);
  assert.deepEqual(out.sources.map((s) => s.href), [`/guides/${guide.slug}`]);
});

test("unclear photos and non-plants ask for a better photo instead of guessing", () => {
  const base = { plant: "unknown", healthy: false, steps: [], avoid: "", guides: [] };
  assert.match(formatVerdict({ ...base, is_plant: false, photo_quality: "good", findings: [], need_more: "" }), /couldn't see a plant/);
  assert.match(formatVerdict({ ...base, is_plant: true, photo_quality: "unclear", findings: [], need_more: "" }), /closer photo/);
});

test("without a Gemini key the photo check explains what is missing", async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(checkPhoto({ image: tiny }), PhotoCheckError);
  process.env.GEMINI_API_KEY = saved;
});
