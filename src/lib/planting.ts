// Best planting months for each tree in Bangladesh, and helpers to read them.
// Most saplings do best when planted early in the monsoon, once the rain has
// softened the soil (roughly June to September). A few have their own windows:
// bamboo goes in before the rains, papaya in the mild months either side of
// winter, and mangrove keora in mid-monsoon. Admins can change a tree's months
// in Admin → Trees; an empty value falls back to this table.

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const MONSOON = [6, 7, 8, 9];
export const DEFAULT_PLANTING: Record<string, number[]> = {
  "amloki": MONSOON,
  "areca-palm": [5, 6, 7, 8, 9],
  "arjun": MONSOON,
  "bamboo-borak": [4, 5, 6, 7],
  "bel": MONSOON,
  "coconut": [5, 6, 7, 8, 9, 10],
  "date-palm": MONSOON,
  "guava": [5, 6, 7, 8, 9],
  "hibiscus": [2, 3, 6, 7, 8, 9],
  "hijal": MONSOON,
  "jackfruit": MONSOON,
  "jarul": MONSOON,
  "java-plum": MONSOON,
  "kadam": MONSOON,
  "kamini": [2, 3, 6, 7, 8, 9],
  "keora": [7, 8],
  "koroch": MONSOON,
  "krishnachura": MONSOON,
  "lemon": [5, 6, 7, 8, 9, 10],
  "litchi": MONSOON,
  "mahogany": MONSOON,
  "mango-amrapali": MONSOON,
  "mango-himsagar": MONSOON,
  "neem": MONSOON,
  "palmyra": MONSOON,
  "papaya": [2, 3, 9, 10],
  "radhachura": MONSOON,
  "sonalu": MONSOON,
  "teak": MONSOON,
  "wax-apple": MONSOON,
};

// Seasons people name, as Bangladesh months (Bangla six seasons, simplified)
export const SEASONS: Record<string, { label: string; months: number[] }> = {
  SUMMER: { label: "summer (Grishma, the hot months before the rains)", months: [4, 5] },
  MONSOON: { label: "monsoon (Borsha, mid-June to mid-August, rains often last to September)", months: [6, 7, 8, 9] },
  AUTUMN: { label: "autumn (Sharat and Hemanta, mid-August to mid-December)", months: [9, 10, 11] },
  WINTER: { label: "winter (Sheet, mid-December to mid-February)", months: [12, 1, 2] },
  SPRING: { label: "spring (Boshonto, mid-February to mid-April)", months: [2, 3, 4] },
};
export type SeasonKey = keyof typeof SEASONS;

// "6,7,8,9" -> [6,7,8,9]; ignores anything that is not a month number
export function parseMonths(v: string | null | undefined): number[] {
  return [...new Set((v ?? "").split(",").map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12))].sort((a, b) => a - b);
}

export function plantMonths(t: { slug: string; plantMonths?: string | null }): number[] {
  const own = parseMonths(t.plantMonths);
  if (own.length) return own;
  return DEFAULT_PLANTING[t.slug] ?? MONSOON;
}

// Month (1 to 12) in Bangladesh time
export function dhakaMonth(now = new Date()) {
  return new Date(now.getTime() + 6 * 3600_000).getUTCMonth() + 1;
}

// [6,7,8,9] -> "Jun–Sep"; [2,3,6,7,8,9] -> "Feb–Mar and Jun–Sep"; wraps over the new year
export function monthRange(months: number[], long = false): string {
  if (!months.length) return "";
  if (months.length === 12) return "all year";
  const names = long ? MONTH_LONG : MONTHS;
  const set = new Set(months);
  let start = 1;
  while (set.has(start) || !set.has(start % 12 + 1)) start = start % 12 + 1; // a month that begins a run
  const runs: [number, number][] = [];
  for (let i = 0, m = start; i < 12; i++, m = m % 12 + 1) {
    if (!set.has(m)) continue;
    const prev = (m + 10) % 12 + 1;
    if (set.has(prev) && runs.length) runs[runs.length - 1][1] = m;
    else runs.push([m, m]);
  }
  const text = runs.map(([a, b]) => (a === b ? names[a - 1] : `${names[a - 1]}–${names[b - 1]}`));
  return text.length > 1 ? `${text.slice(0, -1).join(", ")} and ${text[text.length - 1]}` : text[0];
}

export function inSeason(months: number[], month = dhakaMonth()) {
  return months.includes(month);
}

// What to tell a shopper about planting this tree now
export function plantingAdvice(t: { slug: string; plantMonths?: string | null }, now = new Date()) {
  const months = plantMonths(t);
  const month = dhakaMonth(now);
  const range = monthRange(months);
  const good = inSeason(months, month);
  let wait = 0;
  for (let m = month; !months.includes(m) && wait < 12; m = m % 12 + 1) wait++;
  return {
    months,
    range,
    good,
    short: good ? "Plant now" : `Plant ${range}`,
    text: good
      ? `Now is a good time to plant it. Best months: ${range}.`
      : wait <= 3
        ? `Best planted ${range}, about ${wait} month${wait > 1 ? "s" : ""} from now. You can buy now and keep it in its pot, watered and in light shade, until then.`
        : `Best planted ${range}. It can still be planted now if you water it regularly, but it settles fastest in those months.`,
  };
}
