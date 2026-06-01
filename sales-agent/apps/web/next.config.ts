import type { NextConfig } from "next";

const apiOrigin = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required when accessing dev server via tunnel (trycloudflare, loca.lt, etc.)
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "localhost",
    "127.0.0.1",
  ],
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
