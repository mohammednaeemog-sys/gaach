// Chooses a usable photo from Wikimedia Commons search results.
// Only openly licensed photos are accepted, and the author and license are kept
// so the site can credit them as the licenses require.

export type CommonsPage = {
  title: string;
  index?: number;
  imageinfo?: {
    mime: string;
    width: number;
    height: number;
    thumburl?: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value: string } | undefined>;
  }[];
};

export type PhotoCredit = {
  title: string;
  downloadUrl: string;
  sourceUrl: string;
  author: string;
  license: string;
  credit: string;
};

const LICENSES = [/^cc0/i, /^public domain/i, /^pd/i, /^cc by(-sa)? \d(\.\d)?/i];
const SKIP_WORDS = /\b(map|maps|distribution|herbarium|drawing|illustration|diagram|logo|stamp|seeds?|wood|timber|bark|section|xylarium)\b/i;

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GOOD_WORDS = /\b(tree|trees|plant|plants|palm|shrub|sapling|bush|hedge|garden|habit|whole|grove)\b/i;
// Close-ups and things that are not the plant itself
const WEAK_WORDS = /\b(fruits?|flowers?|flower|blossom|bloom|inflorescence|leaf|leaves|insects?|aphids?|ants?|bugs?|beetle|larva|caterpillar|butterfly|bird|macro|close-?up|closeup|cut|sliced|market|food|dish|juice|seeds?|pod|pods|bud|petal|stamen)\b/i;

// Scores each result and returns the best one. A photo of the whole plant
// beats a close-up of its fruit or of insects on a leaf.
export function pickPhoto(pages: CommonsPage[]): PhotoCredit | null {
  let best: { score: number; credit: PhotoCredit } | null = null;
  pages.forEach((p, rank) => {
    const info = p.imageinfo?.[0];
    if (!info || !info.thumburl) return;
    if (info.mime !== "image/jpeg") return;
    if (info.width < 800 || info.height < 600) return;
    const ratio = info.width / info.height;
    if (ratio < 0.6 || ratio > 2) return;
    if (SKIP_WORDS.test(p.title)) return;
    const meta = info.extmetadata ?? {};
    const license = stripHtml(meta.LicenseShortName?.value ?? "");
    if (!LICENSES.some((re) => re.test(license))) return;
    if (meta.Restrictions?.value) return;
    const words = `${p.title} ${stripHtml(meta.ImageDescription?.value ?? "").slice(0, 300)}`;
    let score = 10 - rank * 0.5; // the search engine's own ranking still counts a little
    if (GOOD_WORDS.test(words)) score += 6;
    if (WEAK_WORDS.test(p.title)) score -= 8;
    if (ratio >= 1 && ratio <= 1.6) score += 1; // fits the cards best
    const author = stripHtml(meta.Artist?.value ?? "") || "Unknown author";
    const credit: PhotoCredit = {
      title: p.title.replace(/^File:/, ""),
      downloadUrl: info.thumburl,
      sourceUrl: info.descriptionurl,
      author,
      license,
      credit: `Photo: ${author.slice(0, 80)}, ${license}, via Wikimedia Commons`,
    };
    if (!best || score > best.score) best = { score, credit };
  });
  return best ? (best as { credit: PhotoCredit }).credit : null;
}
