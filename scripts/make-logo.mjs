// Draws the Gaach logo: a spreading tree on grass inside a round badge with a
// ribbon, like a traditional nursery seal. Writes plain SVG files, with all
// lettering turned into shapes so they look the same everywhere:
//   public/brand/gaach-badge.svg  full badge (footer, home page, print)
//   public/brand/gaach-mark.svg   round tree mark (header, browser icon)
//   public/brand/gaach-tree.svg   the tree on its own
// The tree is drawn from a seed, so it comes out the same every time.
// Run: npm run logo   (or node scripts/make-logo.mjs <seed> to try other trees)
import { mkdirSync, writeFileSync } from "fs";
import opentype from "opentype.js";

let seed = Number(process.argv[2] ?? 42);
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => a + rand() * (b - a);
const rad = (d) => (d * Math.PI) / 180;

const branches = []; // { x1, y1, cx, cy, x2, y2, w }
const leaves = []; // { x, y, r }
const tips = [];

function grow(x, y, angle, len, w, depth) {
  const x2 = x + Math.cos(rad(angle)) * len;
  const y2 = y - Math.sin(rad(angle)) * len;
  const bend = between(-0.18, 0.18) * len;
  const cx = (x + x2) / 2 + Math.cos(rad(angle + 90)) * bend;
  const cy = (y + y2) / 2 - Math.sin(rad(angle + 90)) * bend;
  branches.push({ x1: x, y1: y, cx, cy, x2, y2, w });
  if (depth <= 1) {
    // a clump of leaves round each twig tip, and smaller ones further in,
    // lifted a little so the lower branches stay visible
    const n = depth === 0 ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const a = between(0, 360), d = between(0, depth === 0 ? 9 : 6);
      const leaf = { x: x2 + Math.cos(rad(a)) * d, y: y2 - Math.abs(Math.sin(rad(a))) * d - (depth === 0 ? 2 : 7), r: between(5, depth === 0 ? 8.5 : 8) };
      leaves.push(leaf);
      if (depth === 0) {
        // small leaves round the edge give a ragged, leafy outline
        for (let k = 0; k < 3; k++) {
          const b = between(-200, 20), r = between(1.6, 3.2);
          leaves.push({ x: leaf.x + Math.cos(rad(b)) * (leaf.r + r * 0.3), y: leaf.y + Math.sin(rad(b)) * (leaf.r + r * 0.3), r });
        }
      }
    }
    tips.push({ x: x2, y: y2 });
  }
  if (depth === 0) return;
  const kids = depth > 2 ? 3 : 2;
  for (let i = 0; i < kids; i++) {
    const spread = kids === 3 ? [-32, 0, 32][i] : [-24, 24][i];
    // branches lean outward and flatten a little, like an old oak
    const lean = (90 - angle) * -0.05;
    grow(x2, y2, angle + spread + lean + between(-10, 10), len * between(0.66, 0.8), w * 0.66, depth - 1);
  }
}

// short thick trunk, then wide main limbs
const baseX = 100, baseY = 150, forkY = 108;
branches.push({ x1: baseX, y1: baseY, cx: baseX - 1, cy: (baseY + forkY) / 2, x2: baseX + 1, y2: forkY, w: 15 });
for (const [a, l] of [[150, 34], [122, 36], [94, 33], [64, 36], [32, 34]]) grow(baseX + 1, forkY, a + between(-4, 4), l, 7.5, 3);

// fill the upper middle of the crown so it reads as one full canopy
{
  const xs = tips.map((t) => t.x), ys = tips.map((t) => t.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, top = Math.min(...ys);
  const rx = (Math.max(...xs) - Math.min(...xs)) / 2 * 0.78, ry = (Math.max(...ys) - top) * 0.62;
  const cy = top + ry * 0.75;
  for (let i = 0; i < 70; i++) {
    const a = between(0, 360), d = Math.sqrt(rand());
    const y = cy + Math.sin(rad(a)) * ry * d;
    if (y > cy + ry * 0.25) continue;
    leaves.push({ x: cx + Math.cos(rad(a)) * rx * d, y, r: between(6, 10) });
  }
}

// roots flaring into the ground
const roots = [];
for (const [dx, w] of [[-18, 5], [-9, 4], [10, 4], [19, 5]]) {
  roots.push({ x1: baseX + dx * 0.15, y1: baseY - 6, cx: baseX + dx * 0.7, cy: baseY - 1, x2: baseX + dx * 1.5, y2: baseY + 2, w });
}

// fit the drawing into the box x 22..178, y 26..150
let minX = Infinity, maxX = -Infinity, minY = Infinity;
for (const l of leaves) { minX = Math.min(minX, l.x - l.r); maxX = Math.max(maxX, l.x + l.r); minY = Math.min(minY, l.y - l.r); }
const s = Math.min(156 / (maxX - minX), (baseY - 26) / (baseY - minY));
const mx = (x) => +(100 + (x - (minX + maxX) / 2) * s).toFixed(1);
const my = (y) => +(baseY - (baseY - y) * s).toFixed(1);

// group branch strokes by width so each group is one path
const groups = new Map();
for (const b of [...branches, ...roots]) {
  const w = +(Math.max(0.9, b.w * s)).toFixed(1);
  const d = `M${mx(b.x1)} ${my(b.y1)}Q${mx(b.cx)} ${my(b.cy)} ${mx(b.x2)} ${my(b.y2)}`;
  groups.set(w, (groups.get(w) ?? "") + d);
}
// leaves hidden inside the crown are dropped to keep the file small
const placed = leaves.map((l) => ({ x: mx(l.x), y: my(l.y), r: +(l.r * s).toFixed(1) }));
const covered = (l, i) => placed.some((o, j) => j !== i && o.r >= l.r && Math.hypot(o.x - l.x, o.y - l.y) + l.r <= o.r * 0.98 && (o.r > l.r || j < i));
const leafPath = placed
  .filter((l, i) => !covered(l, i))
  .map(({ x, y, r }) => `M${+(x - r).toFixed(1)} ${y}a${r} ${r} 0 1 0 ${+(2 * r).toFixed(1)} 0a${r} ${r} 0 1 0 ${-(2 * r).toFixed(1)} 0`)
  .join("");

// grass along the ground line
let grass = "";
for (let x = 40; x <= 160; x += between(2.2, 3.6)) {
  const h = between(3, 9) * (1 - Math.abs(x - 100) / 95), lean = between(-2.5, 2.5);
  grass += `M${(x - 1.1).toFixed(1)} 151L${(x + lean).toFixed(1)} ${(151 - h).toFixed(1)}L${(x + 1.1).toFixed(1)} 151Z`;
}

const TREE = [...groups].map(([w, d]) => `<path d="${d}" stroke-width="${w}"/>`).join("");
const tree = (color) =>
  `<g fill="none" stroke="${color}" stroke-linecap="round">${TREE}</g>` +
  `<path d="${leafPath}" fill="${color}"/><path d="${grass}" fill="${color}"/>` +
  `<path d="M36 151.6H164" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;

// ---------- lettering ----------
const root = new URL("..", import.meta.url).pathname;
const serif = opentype.loadSync(`${root}scripts/fonts/Cinzel-Bold.ttf`);
const bangla = opentype.loadSync(`${root}scripts/fonts/NotoSerifBengali-Bold.ttf`);
const f1 = (n) => +n.toFixed(2);

// Lays text along a circle. tops "out": reads clockwise over the top.
// tops "in": reads left to right along the bottom.
function arcText(text, { font = serif, size, cx, cy, r, at, tops, tracking = 0, fill }) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text).map((g) => ({ g, adv: g.advanceWidth * scale + tracking }));
  const total = glyphs.reduce((a, g) => a + g.adv, 0) - tracking;
  const dir = tops === "out" ? 1 : -1;
  let phi = rad(at) - dir * (total / 2) / r;
  let out = "";
  for (const { g, adv } of glyphs) {
    const mid = phi + dir * (adv - tracking) / 2 / r;
    const x = cx + r * Math.cos(mid), y = cy + r * Math.sin(mid);
    const rot = (mid * 180) / Math.PI + (tops === "out" ? 90 : -90);
    const d = g.getPath(-(adv - tracking) / 2, 0, size).toPathData(1);
    if (d) out += `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})" d="${d}"/>`;
    phi += dir * adv / r;
  }
  return `<g fill="${fill}">${out}</g>`;
}

function lineText(text, { font = serif, size, x, y, fill, tracking = 0 }) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  const total = glyphs.reduce((a, g) => a + g.advanceWidth * scale + tracking, 0) - tracking;
  let cur = x - total / 2, d = "";
  for (const g of glyphs) { d += g.getPath(cur, y, size).toPathData(1); cur += g.advanceWidth * scale + tracking; }
  return `<path fill="${fill}" d="${d}"/>`;
}

const star = (x, y, r, fill) =>
  `<path fill="${fill}" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z"/>`;

// ---------- colours ----------
const DEEP = "#1d5a34", LEAF = "#2a7a44", RIBBON = "#2f8a4c", RIBBON_DARK = "#24703f", CREAM = "#f7f2e2";

// ---------- badge ----------
const C = 120;
function ribbon() {
  // a gently smiling banner: arcs round a centre far above the badge
  const ox = C, oy = -128, R1 = 290, R2 = 316, half = 0.25; // radians either side
  const pt = (r, a) => `${f1(ox + r * Math.sin(a))} ${f1(oy + r * Math.cos(a))}`;
  const band = `M${pt(R1, -half)}A${R1} ${R1} 0 0 0 ${pt(R1, half)}L${pt(R2, half)}A${R2} ${R2} 0 0 1 ${pt(R2, -half)}Z`;
  // folded tails tucked behind each end
  const tail = (s) => {
    const a1 = s * (half - 0.03), a2 = s * (half + 0.075);
    const notch = `${f1(ox + (R1 + R2) / 2 * Math.sin(a2 - s * 0.03))} ${f1(oy + 6 + (R1 + R2) / 2 * Math.cos(a2 - s * 0.03))}`;
    return `<path fill="${RIBBON_DARK}" stroke="${CREAM}" stroke-width="0.8" stroke-linejoin="round" d="M${pt(R1 + 6, a1)}L${pt(R1 + 6, a2)}L${notch}L${pt(R2 + 6, a2)}L${pt(R2 + 6, a1)}Z"/>`;
  };
  const fold = (s) => `<path fill="#123b22" d="M${pt(R2, s * half)}L${pt(R2 + 6, s * (half - 0.03))}L${pt(R2, s * (half - 0.03))}Z"/>`;
  const word = arcText("GAACH", { size: 19, cx: ox, cy: oy, r: (R1 + R2) / 2 + 7, at: 90, tops: "in", tracking: 3.2, fill: CREAM });
  return tail(-1) + tail(1) + `<path fill="${RIBBON}" stroke="${CREAM}" stroke-width="0.8" d="${band}"/>` + fold(-1) + fold(1) + word;
}

const treeInBadge = `<g transform="translate(${C - 100 * 0.7} ${160 - 151.6 * 0.7}) scale(0.7)">${tree(LEAF)}</g>`;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Gaach, trees for Bangladesh">
<circle cx="${C}" cy="${C}" r="118" fill="${DEEP}"/>
<circle cx="${C}" cy="${C}" r="113" fill="none" stroke="${CREAM}" stroke-width="1"/>
<circle cx="${C}" cy="${C}" r="86" fill="${CREAM}"/>
<circle cx="${C}" cy="${C}" r="82" fill="none" stroke="${LEAF}" stroke-width="0.8"/>
${arcText("TREES FOR BANGLADESH", { size: 13, cx: C, cy: C, r: 95, at: -90, tops: "out", tracking: 1.6, fill: CREAM })}
${arcText("PLANT · GROW · CARE", { size: 11.5, cx: C, cy: C, r: 103.5, at: 90, tops: "in", tracking: 1.8, fill: CREAM })}
${star(C - 99, C, 4.5, CREAM)}${star(C + 99, C, 4.5, CREAM)}
${treeInBadge}
${ribbon()}
${lineText("গাছ", { font: bangla, size: 12, x: C, y: 200, fill: LEAF })}
</svg>
`;

// ---------- round mark ----------
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Gaach">
<circle cx="50" cy="50" r="49" fill="${DEEP}"/>
<circle cx="50" cy="50" r="44.5" fill="${CREAM}"/>
<g transform="translate(${50 - 100 * 0.44} ${76 - 151.6 * 0.44}) scale(0.44)">${tree(LEAF)}</g>
</svg>
`;

const treeOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 20 160 136" role="img" aria-label="Tree">${tree(LEAF)}</svg>\n`;

mkdirSync(`${root}public/brand`, { recursive: true });
writeFileSync(`${root}public/brand/gaach-badge.svg`, badge);
writeFileSync(`${root}public/brand/gaach-mark.svg`, mark);
writeFileSync(`${root}public/brand/gaach-tree.svg`, treeOnly);
writeFileSync(`${root}public/icon.svg`, mark);
writeFileSync(`${root}src/app/icon.svg`, mark);
console.log(`badge ${(badge.length / 1024).toFixed(1)} KB, mark ${(mark.length / 1024).toFixed(1)} KB`);
