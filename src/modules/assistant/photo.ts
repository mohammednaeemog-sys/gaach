// Photo check: the user sends a picture of a sick plant and Gemini (free key)
// suggests likely problems. The answer always says how sure it is, links only
// to Gaach's own care guides, and the photo itself is never stored.
import { db } from "@/lib/db";
import { geminiCall, geminiConfigured, GeminiError, geminiProblem, type FetchLike } from "./gemini";
import type { Source } from "./tools";

export const MAX_IMAGE_CHARS = 1_400_000; // about 1 MB once decoded; the browser shrinks photos first
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function validImage(dataUrl: string) {
  return dataUrl.length <= MAX_IMAGE_CHARS && IMAGE_RE.test(dataUrl);
}

type Finding = { problem: string; likelihood: "likely" | "possible"; signs: string };
export type PhotoVerdict = {
  is_plant: boolean;
  plant: string;
  photo_quality: "good" | "unclear";
  healthy: boolean;
  findings: Finding[];
  steps: string[];
  avoid: string;
  need_more: string;
  guides: string[];
};

const RULES = `You check photos of plants and trees for home gardeners in Bangladesh for the Gaach tree shop.
Look carefully at the photo and any note from the user. Reply with JSON only, in exactly this shape:
{"is_plant": true, "plant": "plant name or 'unknown'", "photo_quality": "good" | "unclear", "healthy": false,
 "findings": [{"problem": "short name", "likelihood": "likely" | "possible", "signs": "what in this photo points to it"}],
 "steps": ["safe thing to do now", "..."], "avoid": "one common mistake to avoid, or empty",
 "need_more": "one question or photo request that would make you surer, or empty", "guides": ["guide-slug"]}
Rules:
- Be honest about uncertainty. Use "likely" only when the signs are clear; otherwise "possible". At most 3 findings, most likely first.
- Only describe what you can see. Never invent a plant name; say "unknown" if unsure.
- If the photo is blurry, too far, too dark, or the problem area is not visible, set photo_quality to "unclear" and ask for a better photo in need_more.
- If it is not a plant, set is_plant to false and leave the lists empty.
- Steps: 2 to 5 short, safe steps in plain English (watering, drainage, removing damaged leaves, neem oil or soap spray, compost, sun or shade). Never give chemical pesticide doses; say to follow the product label or ask the local Upazila Agriculture Office.
- guides: choose up to 2 slugs from the GUIDES list below that match the problem. Use only slugs from the list.`;

function parseVerdict(text: string): PhotoVerdict | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const v = JSON.parse(m[0]);
    const str = (x: unknown, n = 300) => (typeof x === "string" ? x.trim().slice(0, n) : "");
    const list = (x: unknown) => (Array.isArray(x) ? x : []);
    return {
      is_plant: v.is_plant !== false,
      plant: str(v.plant, 80) || "unknown",
      photo_quality: v.photo_quality === "unclear" ? "unclear" : "good",
      healthy: v.healthy === true,
      findings: list(v.findings).slice(0, 3).map((f: any): Finding => ({ problem: str(f?.problem, 80), likelihood: f?.likelihood === "likely" ? "likely" : "possible", signs: str(f?.signs) })).filter((f: Finding) => f.problem),
      steps: list(v.steps).map((s: unknown) => str(s, 240)).filter(Boolean).slice(0, 5),
      avoid: str(v.avoid),
      need_more: str(v.need_more),
      guides: list(v.guides).map((s: unknown) => str(s, 80)).filter(Boolean).slice(0, 2),
    };
  } catch {
    return null;
  }
}

// Plain-text answer shown in the chat
export function formatVerdict(v: PhotoVerdict): string {
  if (!v.is_plant) return "I couldn't see a plant in this photo. Please send a close, clear photo of the leaves, stem or fruit that look wrong.";
  const out: string[] = [];
  const name = v.plant !== "unknown" ? v.plant : "your plant";
  if (v.photo_quality === "unclear" && !v.findings.length) {
    return `I can't see enough in this photo to judge ${name}. ${v.need_more || "Please send a closer photo in daylight, showing the top and underside of an affected leaf."}`;
  }
  if (v.healthy && !v.findings.length) out.push(`📷 Photo check: ${name} looks healthy in this photo. I can't see signs of pests or disease.`);
  else {
    out.push(`📷 Photo check: ${name}`);
    const [first, ...rest] = v.findings;
    if (first) out.push(`${first.likelihood === "likely" ? "Most likely" : "Possibly"}: ${first.problem}. ${first.signs}`.trim());
    if (rest.length) out.push(`Also possible:\n${rest.map((f) => `- ${f.problem}${f.signs ? `: ${f.signs}` : ""}`).join("\n")}`);
  }
  if (v.steps.length) out.push(`What to do now:\n${v.steps.map((s) => `- ${s}`).join("\n")}`);
  if (v.avoid) out.push(`Avoid: ${v.avoid.replace(/^avoid\s+/i, "")}`);
  if (v.need_more) out.push(`To be surer: ${v.need_more}`);
  if (v.findings.length) out.push("A photo can't confirm a diagnosis. If it keeps getting worse, take a leaf sample to your local Upazila Agriculture Office.");
  return out.join("\n\n");
}

export class PhotoCheckError extends Error {}

export async function checkPhoto(opts: { image: string; note?: string; treeName?: string | null; fetchImpl?: FetchLike }): Promise<{ reply: string; sources: Source[] }> {
  if (!geminiConfigured()) throw new PhotoCheckError("Photo checks need the free Gemini key. An admin can add GEMINI_API_KEY to the .env file.");
  if (!validImage(opts.image)) throw new PhotoCheckError("Please send a JPG, PNG or WebP photo under about 1 MB.");
  const guides = await db.careGuide.findMany({ where: { published: true }, select: { slug: true, title: true, topic: true } });
  const guideList = guides.filter((g) => ["troubleshooting", "pests", "disease", "watering", "feeding", "site"].includes(g.topic)).map((g) => `${g.slug}: ${g.title}`).join("\n");
  const note = [opts.treeName ? `The user says this is: ${opts.treeName}.` : "", opts.note ? `User's note: ${opts.note.slice(0, 500)}` : ""].filter(Boolean).join(" ");

  let data: any;
  try {
    data = await geminiCall(
      {
        messages: [
          { role: "system", content: `${RULES}\n\nGUIDES:\n${guideList}` },
          { role: "user", content: [{ type: "text", text: note || "Please check this plant." }, { type: "image_url", image_url: { url: opts.image } }] },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      opts.fetchImpl,
    );
  } catch (e) {
    if (e instanceof GeminiError) throw new PhotoCheckError(`The photo check is not available right now: ${geminiProblem(e.status, e.message)}`);
    throw e;
  }
  const verdict = parseVerdict(String(data?.choices?.[0]?.message?.content ?? ""));
  if (!verdict) throw new PhotoCheckError("I couldn't read that photo properly. Please try again, or describe the problem in words.");
  const sources: Source[] = verdict.guides
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter((g): g is (typeof guides)[number] => !!g)
    .map((g) => ({ kind: "guide", title: g.title, href: `/guides/${g.slug}` }));
  return { reply: formatVerdict(verdict), sources };
}
