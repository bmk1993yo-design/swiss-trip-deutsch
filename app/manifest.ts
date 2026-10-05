import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Swiss Trip Deutsch",
    short_name: "Swiss Deutsch",
    description: "스위스 여행을 위한 하루 10단어 독일어",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f3",
    theme_color: "#d52b1e",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
