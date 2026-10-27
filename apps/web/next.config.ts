import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@git-forensics/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'github.com'
      }
    ]
  }
};

export default nextConfig;
