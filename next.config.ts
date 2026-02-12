import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow images from Supabase storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vqkoxfenyjomillmxawh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "api.microlink.io",
      },
      {
        protocol: "https",
        hostname: "opengraph.githubassets.com",
      },
    ],
  },
  
  // Remove X-Powered-By header
  poweredByHeader: false,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "react",
      "react-dom",
      "@supabase/supabase-js",
      "lucide-react",
    ],
  },
  
  // Security and caching headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/(.*).(js|css|woff|woff2|png|jpg|jpeg|gif|ico|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
