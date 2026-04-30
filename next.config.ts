import type { NextConfig } from 'next';
import * as path from 'path';

const nextConfig: NextConfig = {
  // Mirrors `.env` `ENV` so client code can gate dev-only UI (e.g. simulate purchase panel).
  env: {
    NEXT_PUBLIC_ENV: process.env.ENV ?? 'production',
  },
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
