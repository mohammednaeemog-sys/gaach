// A tree's picture: its own photo, or else the first size photo an admin uploaded.
type WithPhotos = { imageUrl: string | null; products?: { imageUrl: string | null }[] };

export function treePhoto(t: WithPhotos): string | null {
  return t.imageUrl ?? t.products?.find((p) => p.imageUrl)?.imageUrl ?? null;
}
