import type { NextConfig } from "next";

const orchardOrigin =
  process.env.ORCHARD_ORIGIN ??
  "https://dashboard-six-iota-44.vercel.app";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Orchard's sign-in redirect leaves out its /orchard base path; send it to the real page.
  async redirects() {
    return [{ source: "/auth/signin", destination: "/orchard/auth/signin", permanent: false }];
  },
  async rewrites() {
    return [
      {
        source: "/orchard",
        destination: `${orchardOrigin}/orchard`,
      },
      {
        source: "/orchard/:path*",
        destination: `${orchardOrigin}/orchard/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
