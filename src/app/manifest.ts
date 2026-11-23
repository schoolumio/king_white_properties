import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "King White",
    short_name: "King White",
    description: "Real estate, infrastructure and automotive mobility.",
    start_url: "/",
    display: "browser",
    background_color: "#0F3D2E",
    theme_color: "#0F3D2E",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
