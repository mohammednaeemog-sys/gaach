// Knowledge retrieval for the assistant (RAG step).
//
// Care guides are split into sections ("chunks"), each carrying metadata:
// guide, species, care stage, symptoms and source. Search uses BM25 ranking
// with a small synonym list (English and Bangla) and boosts chunks whose
// metadata matches the tree, stage or symptom being discussed.
//
// Why BM25 and not embeddings: it runs inside the app with no extra service
// or API key, results are explainable, and the guide collection is small.
// The search() interface would stay the same if an embedding index replaced it.

export type GuideRecord = {
  slug: string;
  title: string;
  topic: string;
  species: string; // comma-separated tree slugs
  stage: string;
  symptoms: string; // comma-separated
  sections: string; // JSON [{ heading, text }]
  sourceTitle: string;
  sourceUrl: string;
  status: string; // UNREVIEWED | REVIEWED
};

export type Chunk = {
  id: string;
  guideSlug: string;
  guideTitle: string;
  heading: string;
  text: string;
  species: string[];
  stage: string;
  symptoms: string[];
  topic: string;
  sourceTitle: string;
  sourceUrl: string;
  reviewed: boolean;
};

export type Passage = Chunk & { score: number };

const STOP = new Set(
  "a an and are as at be but by can do does for from has have how i if in into is it its me my of on or our should so that the their them then there these they this to too was what when where which who why will with you your about after any also been before being could did am get got just more most much not now only other over same some such than very would".split(" "),
);

// Words people use mapped onto the words the guides use
const SYNONYMS: Record<string, string[]> = {
  yellow: ["yellow", "chlorosis", "pale"],
  yellowing: ["yellow", "chlorosis"],
  pale: ["yellow", "pale"],
  droop: ["wilt", "droop"],
  drooping: ["wilt", "droop"],
  wilt: ["wilt", "droop"],
  wilting: ["wilt", "droop"],
  dying: ["wilt", "decline", "rot"],
  bug: ["pest", "insect"],
  bugs: ["pest", "insect"],
  insect: ["pest", "insect"],
  insects: ["pest", "insect"],
  pest: ["pest", "insect"],
  pests: ["pest", "insect"],
  ants: ["ant", "honeydew", "aphid", "mealybug"],
  sticky: ["honeydew", "sticky", "aphid", "scale"],
  white: ["white", "mealybug", "powdery", "whitefly"],
  spots: ["spot", "anthracnose", "fungal"],
  spot: ["spot", "anthracnose", "fungal"],
  fungus: ["fungal", "mould", "mildew"],
  mold: ["mould", "fungal"],
  rot: ["rot", "waterlogging", "drainage"],
  overwatering: ["waterlogging", "drainage", "wet"],
  overwatered: ["waterlogging", "drainage", "wet"],
  fertilizer: ["fertilizer", "feed", "compost", "manure"],
  fertiliser: ["fertilizer", "feed", "compost", "manure"],
  fertilize: ["fertilizer", "feed", "compost"],
  feed: ["feed", "fertilizer", "compost"],
  manure: ["manure", "compost", "dung"],
  pot: ["container", "drum", "tub"],
  pots: ["container", "drum", "tub"],
  drum: ["drum", "container"],
  roof: ["rooftop", "roof", "drum"],
  rooftop: ["rooftop", "roof", "drum", "container"],
  balcony: ["container", "drum", "rooftop"],
  flood: ["flood", "waterlogging"],
  flooding: ["flood", "waterlogging"],
  salt: ["salt", "salty", "saline", "coastal"],
  salty: ["salt", "salty", "saline", "coastal"],
  coastal: ["coastal", "salt", "saline"],
  drought: ["drought", "dry"],
  dry: ["dry", "drought"],
  cut: ["prune", "pruning"],
  trim: ["prune", "pruning"],
  plant: ["plant", "planting"],
  planting: ["plant", "planting", "pit"],
  transplant: ["transplant", "planting", "shock"],
  goat: ["goat", "cattle", "guard"],
  goats: ["goat", "cattle", "guard"],
  cow: ["cattle", "guard"],
  cows: ["cattle", "guard"],
  storm: ["storm", "wind", "stake", "cyclone"],
  wind: ["wind", "stake", "storm"],
  spray: ["spray", "neem", "soap"],
  pesticide: ["spray", "pesticide", "label"],
  chemical: ["spray", "chemical", "label"],
  falling: ["drop", "fall"],
  fall: ["drop", "fall"],
  holes: ["hole", "chewed", "caterpillar"],
  eaten: ["chewed", "caterpillar"],
  curl: ["curl", "curled", "leaf", "miner", "aphid"],
  curled: ["curl", "curled", "miner", "aphid"],
  slow: ["slow", "growth", "growing"],
  growing: ["growth", "growing"],
  // Bangla
  "হলুদ": ["yellow", "chlorosis"],
  "পাতা": ["leaf", "leaves"],
  "পোকা": ["pest", "insect"],
  "পানি": ["water", "watering"],
  "জল": ["water", "watering"],
  "সার": ["fertilizer", "compost", "manure"],
  "মাটি": ["soil"],
  "রোদ": ["sun", "sunlight"],
  "চারা": ["sapling", "plant"],
  "লাগানো": ["planting", "plant"],
  "রোপণ": ["planting", "plant"],
  "ছাদ": ["rooftop", "drum", "container"],
  "টব": ["container", "drum"],
  "বন্যা": ["flood"],
  "লবণ": ["salt", "saline"],
  "শুকিয়ে": ["wilt", "dry"],
  "নেতিয়ে": ["wilt", "droop"],
  "ঝরে": ["drop", "fall"],
  "ছাঁটাই": ["prune", "pruning"],
};

function stem(w: string): string {
  if (/[ঀ-৿]/.test(w)) return w;
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+|[ঀ-৿]+/g) ?? []).filter((w) => !STOP.has(w) && w.length > 1).map(stem);
}

function expandQuery(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z]+|[ঀ-৿]+/g) ?? [];
  const out: string[] = [];
  for (const w of raw) {
    if (STOP.has(w)) continue;
    const syn = SYNONYMS[w];
    if (syn) out.push(...syn.map(stem));
    else if (w.length > 1) out.push(stem(w));
  }
  return [...new Set(out)];
}

export function chunkGuides(guides: GuideRecord[]): Chunk[] {
  const out: Chunk[] = [];
  for (const g of guides) {
    let sections: { heading: string; text: string }[] = [];
    try {
      sections = JSON.parse(g.sections);
    } catch {
      continue; // a broken guide is skipped rather than breaking search
    }
    sections.forEach((s, i) =>
      out.push({
        id: `${g.slug}#${i + 1}`,
        guideSlug: g.slug,
        guideTitle: g.title,
        heading: s.heading,
        text: s.text,
        species: g.species.split(",").filter(Boolean),
        stage: g.stage,
        symptoms: g.symptoms.split(",").filter(Boolean),
        topic: g.topic,
        sourceTitle: g.sourceTitle,
        sourceUrl: g.sourceUrl,
        reviewed: g.status === "REVIEWED",
      }),
    );
  }
  return out;
}

export class GuideIndex {
  private docs: { chunk: Chunk; tf: Map<string, number>; len: number }[] = [];
  private df = new Map<string, number>();
  private avgLen = 1;

  constructor(chunks: Chunk[]) {
    for (const chunk of chunks) {
      // The guide title and heading count twice: they say what the chunk is about
      const tokens = [...tokenize(`${chunk.guideTitle} ${chunk.heading}`), ...tokenize(`${chunk.guideTitle} ${chunk.heading} ${chunk.text}`)];
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({ chunk, tf, len: tokens.length });
    }
    this.avgLen = this.docs.reduce((a, d) => a + d.len, 0) / Math.max(1, this.docs.length);
  }

  get size() {
    return this.docs.length;
  }

  search(query: string, opts: { tree?: string | null; stage?: string | null; symptom?: string | null; limit?: number } = {}): Passage[] {
    const terms = expandQuery(query);
    if (!terms.length && !opts.symptom) return [];
    const N = this.docs.length;
    const k1 = 1.4, b = 0.75;
    const scored: Passage[] = [];
    for (const d of this.docs) {
      let s = 0;
      for (const t of terms) {
        const f = d.tf.get(t);
        if (!f) continue;
        const df = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / this.avgLen)));
      }
      const c = d.chunk;
      // Metadata: prefer chunks written for this tree, stage or symptom, and
      // drop chunks written for a different tree
      if (c.species.length) {
        if (opts.tree && c.species.includes(opts.tree)) s += 2.5;
        else if (opts.tree) s *= 0.4;
      }
      if (opts.stage && c.stage === opts.stage) s += 1.5;
      if (opts.symptom && c.symptoms.includes(opts.symptom)) s += 2;
      if (s > 0) scored.push({ ...c, score: Math.round(s * 100) / 100 });
    }
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    // At most two chunks from the same guide, so results cover more ground
    const perGuide = new Map<string, number>();
    const out: Passage[] = [];
    for (const p of scored) {
      const n = perGuide.get(p.guideSlug) ?? 0;
      if (n >= 2) continue;
      perGuide.set(p.guideSlug, n + 1);
      out.push(p);
      if (out.length >= (opts.limit ?? 3)) break;
    }
    return out;
  }
}

// Below this score the evidence is too weak to answer from
export const MIN_EVIDENCE_SCORE = 3;
