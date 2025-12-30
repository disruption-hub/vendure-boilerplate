import { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        // This is necessary to display images from your local Vendure instance
        remotePatterns: [
            {
                hostname: 'readonlydemo.vendure.io',
            },
            {
                hostname: 'demo.vendure.io'
            },
            {
                hostname: 'localhost'
            },
            {
                hostname: '*.up.railway.app'
            }
        ],
    },
    experimental: {
        useCache: true
    },
    eslint: {
        ignoreDuringBuilds: true
    },
    typescript: {
        ignoreBuildErrors: true
    }
};

export default nextConfig;