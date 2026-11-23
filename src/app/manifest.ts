import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "King White",
    short_name: "King White",
    description: "Real estate, infrastructure and automotive mobility.",
    start_url: "/",
    display: "browser",
    background_color: "#101D32",
    theme_color: "#101D32",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
