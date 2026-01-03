import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configuration for Vercel deployment
  output: 'standalone',

  // Turbopack configuration
  turbopack: {},

  // Webpack configuration (fallback for non-Turbopack builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      }

    }
    return config
  },

  // Headers configuration for CSP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Allow scripts from multiple sources including Vercel, CDNs, and external services
              // unsafe-eval is required for Pusher/Soketi and Vanta.js libraries
              // Note: Both script-src and script-src-elem need unsafe-eval for eval() to work
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:",
              "script-src-attr 'unsafe-inline' 'unsafe-eval'",
              "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:",
              "font-src 'self' https://fonts.gstatic.com https: data:",
              "img-src 'self' data: https: http: blob:",
              "connect-src 'self' https: wss: ws: http:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },

};

export default nextConfig;
