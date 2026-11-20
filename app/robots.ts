import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/account", "/auth/"],
      },
    ],
    sitemap: "https://www.jkcurryhouse.co.uk/sitemap.xml",
    host: "https://www.jkcurryhouse.co.uk",
  };
}
