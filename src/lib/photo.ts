// A tree's picture: its own photo, or else the first size photo an admin uploaded.
type WithPhotos = { imageUrl: string | null; products?: { imageUrl?: string | null }[]; slug?: string };

// Built-in photos for trees that have none uploaded yet (public/featured/)
const BUILT_IN: Record<string, string> = {
  "mango-himsagar": "/featured/mango.jpg",
  "mango-amrapali": "/featured/mango.jpg",
  neem: "/featured/neem.jpg",
  krishnachura: "/featured/krishnachura.jpg",
  guava: "/featured/guava.jpg",
  "bamboo-borak": "/featured/bamboo.jpg",
};

export function treePhoto(t: WithPhotos): string | null {
  return t.imageUrl ?? t.products?.find((p) => p.imageUrl)?.imageUrl ?? (t.slug ? BUILT_IN[t.slug] ?? null : null);
}

// Every picture for a card slider: the main photo, extra photos the admin added, then size photos
export function treePhotos(t: WithPhotos & { photos?: { url: string }[] }): string[] {
  const all = [treePhoto(t), ...(t.photos ?? []).map((p) => p.url), ...(t.products ?? []).map((p) => p.imageUrl)].filter((u): u is string => !!u);
  return [...new Set(all)].slice(0, 8);
}

// Slides for a photo slider: every photo, then the potted-sapling drawing showing how it arrives
export function treeSlides(t: WithPhotos & { photos?: { url: string }[] }): (string | null)[] {
  const list = treePhotos(t);
  return list.length ? [...list, null] : [null];
}
