import type { MetadataRoute } from "next";

// Makes the site installable on Android as a first step toward the app (PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gaach - Trees for Bangladesh",
    short_name: "Gaach",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f1",
    theme_color: "#2e7d32",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
