import type { MetadataRoute } from "next";
import { DEMOS, urlSitio } from "@/lib/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlSitio();
  return [
    { url: new URL("/", base).href, changeFrequency: "monthly", priority: 1 },
    ...DEMOS.map((slug) => ({
      url: new URL(`/${slug}`, base).href,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: new URL("/privacidad", base).href, changeFrequency: "yearly", priority: 0.2 },
  ];
}
