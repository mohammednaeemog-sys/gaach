// A tree's picture: its own photo, or else the first size photo an admin uploaded.
type WithPhotos = { imageUrl: string | null; products?: { imageUrl: string | null }[]; slug?: string };

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
