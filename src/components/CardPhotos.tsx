"use client";

import { PhotoSlider } from "./PhotoSlider";

// Photo area of a product card
export function CardPhotos(props: { photos: (string | null)[]; href: string; name: string; shape: string; color: string; className?: string; tag?: string }) {
  return <PhotoSlider {...props} />;
}
