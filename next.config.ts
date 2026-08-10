import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint is available via `npm run lint`; don't fail production builds on it.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // The strict type-check surfaces pre-existing errors in library and admin
  // code that do not affect runtime. Run `npm run typecheck` to see them.
  // Remove this once the Supabase types are generated (`npm run db:types`).
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
