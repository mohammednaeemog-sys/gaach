import { z } from "zod";
import { GROWTH, LEVELS, PURPOSES, SHAPES, SOILS, SUNLIGHT } from "@/lib/constants";

const list = <T extends readonly [string, ...string[]]>(values: T) => z.array(z.enum(values));
const optLevel = z.union([z.enum(LEVELS), z.literal("")]);

export const treeSchema = z.object({
  name: z.string().trim().min(2, "Enter the tree's name.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, like mango-himsagar.")
    .max(60),
  banglaName: z.string().trim().max(80),
  scientificName: z.string().trim().max(100),
  description: z.string().trim().max(2000),
  shape: z.enum(SHAPES),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour."),
  matureHeightM: z.coerce.number().min(0).max(100, "Height must be under 100 m."),
  canopySpreadM: z.coerce.number().min(0).max(60, "Spread must be under 60 m."),
  growthRate: z.union([z.enum(GROWTH), z.literal("")]),
  sunlight: list(SUNLIGHT),
  soils: list(SOILS),
  purposes: list(PURPOSES),
  waterNeed: optLevel,
  rainfall: list(LEVELS),
  floodTolerance: optLevel,
  droughtTolerance: optLevel,
  salinityTolerance: optLevel,
  fruitingSeason: z.string().trim().max(200),
  plantMonths: z.string().regex(/^(\d{1,2}(,\d{1,2})*)?$/, "Pick months from the list.").max(40),
  cautions: z.string().trim().max(500),
  imageCredit: z.string().trim().max(200),
  imageSourceUrl: z.union([z.literal(""), z.string().trim().url("Enter a full link starting with https://").max(500)]),
});

export type TreeInput = z.infer<typeof treeSchema>;

// A tree cannot be published until every required attribute is filled in (FR-8.1).
export function missingForPublish(t: {
  banglaName: string; scientificName: string; description: string; matureHeightM: number; canopySpreadM: number;
  growthRate: string; sunlight: string | string[]; soils: string | string[]; purposes: string | string[]; waterNeed: string;
  rainfall: string | string[]; floodTolerance: string; droughtTolerance: string; salinityTolerance: string;
  fruitingSeason: string; cautions: string;
}): string[] {
  const empty = (v: string | string[]) => (Array.isArray(v) ? v.length === 0 : !v.trim());
  const checks: [string, boolean][] = [
    ["Bangla name", empty(t.banglaName)],
    ["Scientific name", empty(t.scientificName)],
    ["Description", empty(t.description)],
    ["Mature height", !(t.matureHeightM > 0)],
    ["Canopy spread", !(t.canopySpreadM > 0)],
    ["Growth rate", empty(t.growthRate)],
    ["Sunlight", empty(t.sunlight)],
    ["Soil", empty(t.soils)],
    ["Purpose", empty(t.purposes)],
    ["Water need", empty(t.waterNeed)],
    ["Rainfall", empty(t.rainfall)],
    ["Flood tolerance", empty(t.floodTolerance)],
    ["Drought tolerance", empty(t.droughtTolerance)],
    ["Salt tolerance", empty(t.salinityTolerance)],
    ["Fruiting / flowering season", empty(t.fruitingSeason)],
    ["Cautions (write \"None significant.\" if there are none)", empty(t.cautions)],
  ];
  return checks.filter(([, missing]) => missing).map(([name]) => name);
}
