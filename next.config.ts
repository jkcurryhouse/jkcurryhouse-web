import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimisation — allow S3 bucket and common CDN domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",            value: "nosniff" },
          { key: "X-Frame-Options",                   value: "DENY" },
          { key: "X-XSS-Protection",                  value: "1; mode=block" },
          { key: "Referrer-Policy",                   value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",                value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Cache images via CloudFront
      {
        source: "/images/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },

  // Redirect www → non-www handled at CloudFront level; this handles common path variants
  async redirects() {
    return [
      { source: "/book",    destination: "/reservations", permanent: true },
      { source: "/booking", destination: "/reservations", permanent: true },
      { source: "/takeaway",destination: "/order",        permanent: true },
      { source: "/delivery",destination: "/order",        permanent: true },
      { source: "/contact", destination: "/#contact",     permanent: false },
    ];
  },
};

export default nextConfig;
