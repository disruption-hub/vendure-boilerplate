"use client";

import dynamic from 'next/dynamic';

const AnalyticsDashboard = dynamic(
    () => import('@infrabricks/analytics-dashboard/Dashboard').then(mod => mod.AnalyticsDashboard),
    { ssr: false }
);

const CONFIG = {
    apiKey: process.env.NEXT_PUBLIC_ANALYTICS_V2_KEY || 'ib_1766976243766_u9dfl',
    adminSecret: process.env.NEXT_PUBLIC_ANALYTICS_V2_SECRET || '661prgjevle',
    endpoint: process.env.NEXT_PUBLIC_ANALYTICS_V2_URL || 'https://dishubanalitics-production.up.railway.app/api/v1',
    refreshInterval: 0,
    realtimeEnabled: true,
    soketiHost: process.env.NEXT_PUBLIC_SOKETI_HOST || 'soketi-production-8062.up.railway.app',
    soketiKey: process.env.NEXT_PUBLIC_SOKETI_KEY || '12wz9wktra38taedu9t10vv8dwq1j5q7',
    soketiPort: parseInt(process.env.NEXT_PUBLIC_SOKETI_PORT || '443'),
    soketiUseTLS: process.env.NEXT_PUBLIC_SOKETI_USE_TLS !== 'false',
    siteUrl: process.env.NEXT_PUBLIC_ANALYTICS_SITE_URL || 'https://infrabricks.lat',
};

export default function AnalyticsV2Page() {
    return (
        <div className="p-8">
            <AnalyticsDashboard config={CONFIG} />
        </div>
    );
}
