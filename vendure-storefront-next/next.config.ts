import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/shop-api';
let apiHost = 'localhost';

try {
  apiHost = new URL(apiUrl).hostname;
} catch (e) {
  console.warn('[Next Config] Invalid NEXT_PUBLIC_API_URL, falling back to localhost');
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/assets/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/assets/**',
      },
      {
        protocol: apiUrl.startsWith('https') ? 'https' : 'http',
        hostname: apiHost,
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
