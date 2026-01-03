import { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        // This is necessary to display images from your local Vendure instance
        unoptimized: true,
        remotePatterns: [
            {
                hostname: 'readonlydemo.vendure.io',
            },
            {
                hostname: 'demo.vendure.io'
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '3000',
                pathname: '/**',
            },
            {
                hostname: '*.up.railway.app'
            }
        ],
    },
    experimental: {
        useCache: true
    },
    typescript: {
        ignoreBuildErrors: true
    }
};

export default nextConfig;