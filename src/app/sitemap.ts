import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://dustyork.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/briefing`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/goals`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/io`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
