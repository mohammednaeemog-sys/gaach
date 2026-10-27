import { test } from "node:test";
import assert from "node:assert/strict";
import { pickPhoto, type CommonsPage } from "../scripts/photo-pick";

const page = (title: string, license: string, extra: Partial<NonNullable<CommonsPage["imageinfo"]>[number]> = {}): CommonsPage => ({
  title,
  imageinfo: [{
    mime: "image/jpeg", width: 2000, height: 1500, thumburl: `https://upload.example/${title}`, descriptionurl: `https://commons.example/${title}`,
    extmetadata: { LicenseShortName: { value: license }, Artist: { value: '<a href="x">Jane &amp; Co</a>' } },
    ...extra,
  }],
});

test("picks the first openly licensed photo and credits its author", () => {
  const out = pickPhoto([
    page("File:Neem distribution map.jpg", "CC BY-SA 4.0"),
    page("File:Neem all rights.jpg", "All rights reserved"),
    page("File:Small.jpg", "CC0", { width: 300, height: 200 }),
    page("File:Neem tree in Dhaka.jpg", "CC BY-SA 4.0"),
  ]);
  assert.ok(out);
  assert.equal(out!.title, "Neem tree in Dhaka.jpg");
  assert.equal(out!.author, "Jane & Co");
  assert.equal(out!.credit, "Photo: Jane & Co, CC BY-SA 4.0, via Wikimedia Commons");
});

test("returns null when nothing qualifies", () => {
  assert.equal(pickPhoto([page("File:Logo.jpg", "CC0")]), null);
});

test("prefers a whole-plant photo over close-ups", () => {
  const out = pickPhoto([
    page("File:Aphids on lemon leaf.jpg", "CC BY-SA 4.0"),
    page("File:Jackfruit fruits cut.jpg", "CC BY 4.0"),
    page("File:Lemon tree in garden.jpg", "CC BY-SA 3.0"),
  ]);
  assert.equal(out!.title, "Lemon tree in garden.jpg");
});
