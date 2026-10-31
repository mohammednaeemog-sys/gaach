// Festival and season styles for sale banners, plus the Bangladesh calendar used
// to suggest the next sales. Lunar dates (Eid, Puja, Buddha Purnima) are the expected
// dates and can move a day with the moon; the admin can always edit them.

export type Motif =
  | "lantern" | "crescent" | "stars" | "arch" | "bunting" | "pumpkin" | "bat" | "spider" | "diya" | "marigold"
  | "alpona" | "snow" | "ornament" | "pine" | "candy" | "sun" | "mango" | "cloud" | "rain" | "umbrella" | "flag"
  | "minar" | "lotus" | "heart" | "firework" | "leaf" | "kite" | "fish" | "trident" | "palash" | "confetti" | "gift";

export type Festival = {
  key: string;
  label: string;
  group: "Religious" | "National" | "Cultural" | "Season" | "Global" | "Other";
  bg: string; // banner background
  ink: string; // headline colour
  accent: string; // badge and button colour
  soft: string; // small text colour
  left: Motif[]; // decorations on the left
  right: Motif[]; // decorations on the right
  fall?: "snow" | "rain" | "petals" | "leaves" | "confetti" | "stars" | "embers"; // things drifting across
  bunting?: string[]; // flag colours along the top
  font?: "display" | "spooky" | "script" | "bold";
  badge: string;
  message: string;
  percent: number;
};

export const FESTIVALS: Festival[] = [
  { key: "general", label: "General sale", group: "Other", bg: "linear-gradient(115deg,#123524,#2f6b3f 55%,#183d27)", ink: "#f6f2ea", accent: "#f2994a", soft: "#cfe3c9", left: ["leaf", "leaf"], right: ["gift", "leaf"], fall: "leaves", font: "display", badge: "SALE", message: "Fresh saplings at a lower price, for a little while only.", percent: 10 },
  { key: "eid", label: "Eid ul-Fitr", group: "Religious", bg: "linear-gradient(115deg,#5b0f3a,#b0144f 50%,#7a0f3f)", ink: "#fff6df", accent: "#e9c46a", soft: "#ffd9e6", left: ["lantern", "lantern"], right: ["crescent", "stars", "arch"], fall: "stars", font: "script", badge: "EID SALE", message: "Celebrate Eid by planting a tree for your family. Eid Mubarak!", percent: 20 },
  { key: "eid-adha", label: "Eid ul-Adha", group: "Religious", bg: "linear-gradient(115deg,#0b3b2e,#11634a 50%,#0b3b2e)", ink: "#fff6df", accent: "#e9c46a", soft: "#cfeee0", left: ["lantern", "crescent"], right: ["arch", "lantern"], fall: "stars", font: "script", badge: "EID SALE", message: "Share the joy of Eid ul-Adha with a tree that gives for years.", percent: 15 },
  { key: "ramadan", label: "Ramadan", group: "Religious", bg: "linear-gradient(115deg,#1b1446,#33307a 55%,#1b1446)", ink: "#fbe7b0", accent: "#e9c46a", soft: "#d8d3ff", left: ["crescent", "stars", "arch"], right: ["lantern", "lantern", "stars"], fall: "stars", font: "script", badge: "RAMADAN", message: "Ramadan Kareem. Plant a tree as a gift that keeps giving.", percent: 10 },
  { key: "puja", label: "Durga Puja", group: "Religious", bg: "radial-gradient(circle at 70% 50%,#f08a24 0%,#c0262d 45%,#8a1030 100%)", ink: "#fff3c4", accent: "#ffd166", soft: "#ffe2c2", left: ["trident", "diya"], right: ["marigold", "diya", "arch"], fall: "petals", bunting: ["#f6a21a", "#e0412b", "#ffd166"], font: "display", badge: "PUJA OFFER", message: "Shubho Sharodiya! A special offer for Durga Puja.", percent: 20 },
  { key: "diwali", label: "Kali Puja / Diwali", group: "Religious", bg: "linear-gradient(115deg,#26073d,#5a1470 55%,#26073d)", ink: "#ffd98a", accent: "#ffb703", soft: "#f3d6ff", left: ["diya", "diya"], right: ["firework", "diya"], fall: "embers", font: "display", badge: "DIWALI", message: "Light up your home with a new green friend this Diwali.", percent: 15 },
  { key: "buddha", label: "Buddha Purnima", group: "Religious", bg: "linear-gradient(115deg,#123a5c,#2c6e9b 55%,#123a5c)", ink: "#fff8e1", accent: "#ffd166", soft: "#d6ecff", left: ["lotus", "lotus"], right: ["crescent", "lotus"], fall: "stars", font: "display", badge: "PURNIMA", message: "Peace and kindness on Buddha Purnima. Plant a tree of calm.", percent: 10 },
  { key: "christmas", label: "Christmas", group: "Religious", bg: "linear-gradient(115deg,#bfe6fb,#86cff5 55%,#a9dcf8)", ink: "#12384a", accent: "#d6213f", soft: "#2b5568", left: ["pine", "ornament", "candy"], right: ["gift", "stars", "ornament"], fall: "snow", font: "bold", badge: "XMAS SALE", message: "Merry Christmas! Give a living gift this season.", percent: 20 },
  { key: "boishakh", label: "Pohela Boishakh", group: "Cultural", bg: "linear-gradient(115deg,#fff1d6,#ffe1a8 55%,#ffd28a)", ink: "#b3141c", accent: "#d62828", soft: "#7a2e00", left: ["alpona", "fish"], right: ["kite", "alpona"], bunting: ["#d62828", "#ffffff", "#f4a300"], fall: "petals", font: "display", badge: "SUBHO NOBOBORSHO", message: "Shubho Noboborsho! Start the Bangla new year with a new tree.", percent: 14 },
  { key: "falgun", label: "Pohela Falgun & Valentine's", group: "Cultural", bg: "linear-gradient(115deg,#ffe066,#ffb703 50%,#fb8500)", ink: "#7a1a00", accent: "#d00000", soft: "#5c2a00", left: ["palash", "marigold"], right: ["heart", "palash"], fall: "petals", font: "script", badge: "FALGUN", message: "Spring is here. Celebrate Falgun and love with flowering trees.", percent: 14 },
  { key: "language", label: "Language Martyrs' Day (21 Feb)", group: "National", bg: "linear-gradient(115deg,#1d1d1f,#3a3a3d 55%,#1d1d1f)", ink: "#ffffff", accent: "#e63946", soft: "#d9d9d9", left: ["minar"], right: ["palash", "palash"], fall: "petals", font: "display", badge: "21 FEB", message: "Amar bhaier rokte rangano Ekushe February. A tree in their memory.", percent: 21 },
  { key: "independence", label: "Independence Day (26 Mar)", group: "National", bg: "linear-gradient(115deg,#004d38,#006a4e 55%,#004d38)", ink: "#ffffff", accent: "#f42a41", soft: "#cdeee2", left: ["flag"], right: ["firework", "flag"], fall: "confetti", bunting: ["#006a4e", "#f42a41", "#ffffff"], font: "bold", badge: "26 MARCH", message: "Happy Independence Day! Grow a greener Bangladesh.", percent: 26 },
  { key: "victory", label: "Victory Day (16 Dec)", group: "National", bg: "linear-gradient(115deg,#004d38,#006a4e 55%,#004d38)", ink: "#ffffff", accent: "#f42a41", soft: "#cdeee2", left: ["flag"], right: ["firework", "flag"], fall: "confetti", bunting: ["#006a4e", "#f42a41", "#ffffff"], font: "bold", badge: "VICTORY", message: "Joy Bangla! Mark 16 December with a tree that grows for decades.", percent: 16 },
  { key: "newyear", label: "New Year", group: "Global", bg: "linear-gradient(115deg,#0b1026,#1f2a5a 55%,#0b1026)", ink: "#ffe08a", accent: "#ffd166", soft: "#cfd8ff", left: ["firework", "stars", "gift"], right: ["firework", "confetti", "stars"], fall: "confetti", font: "bold", badge: "NEW YEAR", message: "New year, new roots. Start it with a tree.", percent: 15 },
  { key: "halloween", label: "Halloween", group: "Global", bg: "linear-gradient(180deg,#3b2215,#5a3420 50%,#3b2215)", ink: "#ff8a1e", accent: "#ff7b00", soft: "#ffd7ab", left: ["pumpkin", "bat"], right: ["spider", "pumpkin", "bat"], bunting: ["#ff7b00", "#1c1c1c", "#f6c445"], fall: "leaves", font: "spooky", badge: "HALLOWEEN", message: "Spooky savings! No tricks, just treats for your garden.", percent: 31 },
  { key: "winter", label: "Winter", group: "Season", bg: "linear-gradient(115deg,#1e3a5f,#3f6e8f 55%,#1e3a5f)", ink: "#ffffff", accent: "#fde68a", soft: "#d8ecff", left: ["snow", "pine"], right: ["snow", "pine"], fall: "snow", font: "display", badge: "WINTER", message: "Cool weather is great for planting fruit trees. Winter offer!", percent: 20 },
  { key: "summer", label: "Summer & mango season", group: "Season", bg: "linear-gradient(115deg,#ffb703,#fb8500 60%,#f06a00)", ink: "#fffbe8", accent: "#2f6b3f", soft: "#fff1cc", left: ["sun"], right: ["mango", "mango"], fall: "leaves", font: "bold", badge: "SUMMER", message: "Beat the heat with shade trees, and get ready for mango season.", percent: 15 },
  { key: "monsoon", label: "Monsoon planting", group: "Season", bg: "linear-gradient(115deg,#0f3b4a,#1f6f78 55%,#0f3b4a)", ink: "#ffffff", accent: "#a7f3d0", soft: "#cdeff0", left: ["cloud", "umbrella"], right: ["cloud", "leaf"], fall: "rain", font: "display", badge: "MONSOON", message: "The rains are the best time to plant. Saplings settle in fast.", percent: 20 },
];

export const FESTIVAL_KEYS = FESTIVALS.map((f) => f.key);

// A ready-made headline for each style
const TITLES: Record<string, string> = {
  general: "Big tree sale", eid: "Eid Mega Sale", "eid-adha": "Eid ul-Adha Sale", ramadan: "Ramadan Offer", puja: "Durga Puja Special Offer",
  diwali: "Diwali Offer", buddha: "Buddha Purnima Offer", christmas: "Christmas Sale", boishakh: "Pohela Boishakh Offer",
  falgun: "Falgun Offer", language: "Ekushe February", independence: "Independence Day Sale", victory: "Victory Day Sale",
  newyear: "New Year Sale", halloween: "Halloween Sale", winter: "Winter Sale", summer: "Summer Mango Sale", monsoon: "Monsoon Planting Week",
};
export const saleTitle = (key: string) => TITLES[key] ?? "Big tree sale";
export const festival = (key: string) => FESTIVALS.find((f) => f.key === key) ?? FESTIVALS[0];

// When each festival happens (start and end of a good sale window)
type When = { key: string; name: string; start: string; end: string; approx?: boolean };
const DATES: When[] = [
  { key: "halloween", name: "Halloween sale", start: "2026-10-28", end: "2026-10-31" },
  { key: "diwali", name: "Kali Puja / Diwali sale", start: "2026-11-05", end: "2026-11-09", approx: true },
  { key: "winter", name: "Winter planting offer", start: "2026-12-01", end: "2027-01-31" },
  { key: "victory", name: "Victory Day sale", start: "2026-12-14", end: "2026-12-17" },
  { key: "christmas", name: "Christmas sale", start: "2026-12-20", end: "2026-12-26" },
  { key: "newyear", name: "New Year sale", start: "2026-12-30", end: "2027-01-03" },
  { key: "ramadan", name: "Ramadan offer", start: "2027-02-09", end: "2027-03-08", approx: true },
  { key: "falgun", name: "Pohela Falgun & Valentine's offer", start: "2027-02-12", end: "2027-02-15" },
  { key: "language", name: "Ekushe February offer", start: "2027-02-19", end: "2027-02-22" },
  { key: "eid", name: "Eid ul-Fitr sale", start: "2027-03-03", end: "2027-03-12", approx: true },
  { key: "independence", name: "Independence Day sale", start: "2027-03-24", end: "2027-03-27" },
  { key: "boishakh", name: "Pohela Boishakh offer", start: "2027-04-10", end: "2027-04-15" },
  { key: "summer", name: "Summer & mango season sale", start: "2027-04-16", end: "2027-05-31" },
  { key: "eid-adha", name: "Eid ul-Adha sale", start: "2027-05-10", end: "2027-05-19", approx: true },
  { key: "buddha", name: "Buddha Purnima offer", start: "2027-05-18", end: "2027-05-21", approx: true },
  { key: "monsoon", name: "Monsoon planting week", start: "2027-06-15", end: "2027-08-31" },
  { key: "puja", name: "Durga Puja offer", start: "2027-10-03", end: "2027-10-10", approx: true },
  { key: "halloween", name: "Halloween sale", start: "2027-10-28", end: "2027-10-31" },
  { key: "diwali", name: "Kali Puja / Diwali sale", start: "2027-10-26", end: "2027-10-30", approx: true },
  { key: "winter", name: "Winter planting offer", start: "2027-12-01", end: "2028-01-31" },
  { key: "victory", name: "Victory Day sale", start: "2027-12-14", end: "2027-12-17" },
  { key: "christmas", name: "Christmas sale", start: "2027-12-20", end: "2027-12-26" },
];

// The festivals coming up next (and any happening now), soonest first.
// Fixed-date festivals repeat every year, so they are rolled forward when a listed year has passed.
export function upcomingFestivals(now = new Date(), limit = 12) {
  const fixed = new Set(["winter", "victory", "christmas", "newyear", "falgun", "language", "independence", "boishakh", "summer", "monsoon", "halloween"]);
  const out: { key: string; name: string; start: Date; end: Date; approx: boolean; live: boolean }[] = [];
  const seen = new Set<string>();
  for (const d of DATES) {
    let start = new Date(`${d.start}T00:00:00+06:00`);
    let end = new Date(`${d.end}T23:59:00+06:00`);
    if (end < now && fixed.has(d.key)) {
      while (end < now) {
        start = new Date(start.setFullYear(start.getFullYear() + 1));
        end = new Date(end.setFullYear(end.getFullYear() + 1));
      }
    }
    if (end < now) continue;
    const id = `${d.key}-${start.getFullYear()}-${start.getMonth()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ key: d.key, name: d.name, start, end, approx: !!d.approx, live: start <= now });
  }
  return out.sort((a, b) => +a.start - +b.start).slice(0, limit);
}
