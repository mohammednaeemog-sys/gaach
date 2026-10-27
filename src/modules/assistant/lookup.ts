// Finds catalogue trees mentioned in free text: English names, local names in
// brackets, Bangla names, scientific names and web slugs.

export type NamedTree = { slug: string; name: string; banglaName: string; scientificName: string };

const IGNORE = new Set(["tree", "trees", "palm", "dwarf", "thai", "plant", "the", "bush", "shrub", "orange", "golden", "indian"]);

export function treeAliases(t: NamedTree): string[] {
  const base = t.name.split(" (")[0];
  const inBrackets = t.name.match(/\(([^)]+)\)/)?.[1] ?? "";
  const bangla = t.banglaName.split(/[()/,\s]+/).map((s) => s.trim());
  const out = new Set<string>([
    base,
    t.slug.replace(/-/g, " "),
    t.scientificName.split(" ").slice(0, 2).join(" "),
    ...inBrackets.split(/[,/]/).map((s) => s.trim()),
    ...bangla,
  ]);
  // single important words, e.g. "mango" from "Mango (Himsagar)", "lemon" from "Lemon (Kagzi lime)"
  for (const w of base.split(/\s+/)) out.add(w);
  return [...out].map((s) => s.toLowerCase().trim()).filter((s) => (s.length >= 3 || /[ঀ-৿]{2}/.test(s)) && !IGNORE.has(s) && !BN_IGNORE.has(s));
}

// Bangla words that are part of several names and say nothing on their own
const BN_IGNORE = new Set(["পাম", "গাছ"]);
// Bangla nouns take endings: লেবু, লেবুর, লেবু গাছের, আমগাছ
const BN_SUFFIX = ["", "র", "ের", "গাছ", "গাছের", "গাছটি", "টি", "টা", "গুলো", "চারা"];

function hasWord(text: string, alias: string): boolean {
  if (/[ঀ-৿]/.test(alias)) {
    if (alias.includes(" ")) return text.includes(alias);
    const tokens = text.split(/[\s,.!?।()]+/);
    return tokens.some((tok) => BN_SUFFIX.some((suf) => tok === alias + suf));
  }
  const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${esc}(e?s)?([^a-z]|$)`).test(text);
}

// Every tree named in the text, best (longest) matches first
export function findTreesInText<T extends NamedTree>(text: string, trees: T[]): T[] {
  const lower = text.toLowerCase();
  const hits: { t: T; len: number; pos: number }[] = [];
  for (const t of trees) {
    let best = 0, pos = Infinity;
    for (const a of treeAliases(t)) {
      if (hasWord(lower, a) && a.length > best) {
        best = a.length;
        pos = lower.indexOf(a);
      }
    }
    if (best) hits.push({ t, len: best, pos });
  }
  // "amrapali mango" names one mango; drop the other mangos matched only by the shared word
  const base = (t: NamedTree) => t.name.split(" (")[0].toLowerCase();
  const result = hits.filter((h) => !(h.len <= base(h.t).length && hits.some((o) => o !== h && base(o.t) === base(h.t) && o.len > base(o.t).length)));
  return result.sort((a, b) => a.pos - b.pos || b.len - a.len).map((h) => h.t);
}

export type Resolved<T> = { tree: T } | { ambiguous: T[] } | { notFound: true };

// One tree from a name the model or user gave; ambiguous names list the options
export function resolveTree<T extends NamedTree>(query: string, trees: T[]): Resolved<T> {
  const q = query.toLowerCase().trim();
  const exact = trees.find((t) => t.slug === q || t.name.toLowerCase() === q || t.banglaName.toLowerCase() === q);
  if (exact) return { tree: exact };
  const found = findTreesInText(q, trees);
  if (found.length === 1) return { tree: found[0] };
  if (found.length > 1) {
    // "mango amrapali" names both words; prefer a tree that matches more of the words
    const words = q.split(/\s+/);
    const scored = found.map((t) => ({ t, n: words.filter((w) => treeAliases(t).some((a) => a.includes(w))).length }));
    const top = Math.max(...scored.map((s) => s.n));
    const best = scored.filter((s) => s.n === top).map((s) => s.t);
    return best.length === 1 ? { tree: best[0] } : { ambiguous: best };
  }
  return { notFound: true };
}
