// Controlled vocabularies (NFR-7.1). Every screen uses these labels so
// terminology stays the same everywhere (NFR-1.2).

export const SUNLIGHT = ["FULL", "PARTIAL", "SHADE"] as const;
export const SOILS = ["CLAY", "SANDY", "LOAM"] as const;
export const PURPOSES = ["FRUIT", "SHADE", "ORNAMENTAL", "PRIVACY", "TIMBER"] as const;
export const LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const GROWTH = ["SLOW", "MEDIUM", "FAST"] as const;
export const SHAPES = ["round", "tall", "spreading", "palm", "shrub", "columnar"] as const;
export const ORDER_STATUSES = ["PLACED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_METHODS = ["COD", "ONLINE_TEST"] as const;
export const CARE_STAGES = ["PLANTING_DAY", "FIRST_WEEK", "FIRST_SEASON", "ONGOING"] as const;

export type Sunlight = (typeof SUNLIGHT)[number];
export type Soil = (typeof SOILS)[number];
export type Purpose = (typeof PURPOSES)[number];
export type Level = (typeof LEVELS)[number];
export type CareStageKey = (typeof CARE_STAGES)[number];

export const LABELS: Record<string, string> = {
  FULL: "Full sun",
  PARTIAL: "Partial sun",
  SHADE: "Shade",
  CLAY: "Clay",
  SANDY: "Sandy",
  LOAM: "Loam",
  FRUIT: "Fruit",
  SHADE_PURPOSE: "Shade",
  ORNAMENTAL: "Ornamental",
  PRIVACY: "Privacy",
  TIMBER: "Timber",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  SLOW: "Slow",
  FAST: "Fast",
  PLACED: "Placed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  COD: "Cash on delivery",
  ONLINE_TEST: "Online payment (test mode)",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  PLANTING_DAY: "Planting day",
  FIRST_WEEK: "First week",
  FIRST_SEASON: "First season",
  ONGOING: "Ongoing",
};

// "SHADE" is both a sunlight level and a purpose; both read as "Shade".
export function label(value: string): string {
  return LABELS[value] ?? value;
}

export const SUNLIGHT_HINTS: Record<Sunlight, string> = {
  FULL: "6 or more hours of direct sun, e.g. an open rooftop or yard",
  PARTIAL: "3 to 6 hours of sun, e.g. beside a building",
  SHADE: "Under 3 hours of direct sun, e.g. a narrow lane or under big trees",
};

export const SOIL_HINTS: Record<Soil, string> = {
  CLAY: "Sticky when wet, cracks when dry. Common in floodplains.",
  SANDY: "Gritty and drains fast. Common near rivers and the coast.",
  LOAM: "Dark, crumbly garden soil. Also choose this for potting mix in rooftop drums.",
};

export const DELIVERY_FEE_KEY = "deliveryFeeBdt";
export const DEFAULT_DELIVERY_FEE = 120;

export const ASSISTANT_REFUSAL =
  "Sorry, I can only assist with tree selection, planting, purchasing, and tree-care questions.";

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function joinList(values: readonly string[]): string {
  return values.join(",");
}
