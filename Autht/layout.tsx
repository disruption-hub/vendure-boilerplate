import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import { Toaster } from "sonner";
import { CombinedAnalyticsTracker } from "@/lib/combined-analytics-tracker";
import { WalletProvider } from "@/lib/stellar-wallet-context";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
});

export const metadata: Metadata = {
    // ... existing metadata ...
    metadataBase: new URL('https://www.infrabricks.lat'),
    title: {
        default: "Infrabricks | Tokenized Infrastructure in Latam",
        template: "%s | Infrabricks"
    },
    description: "Invest in critical infrastructure through utility-based tokens on Stellar. Powered by DOB Protocol.",
    keywords: ["tokenization", "infrastructure", "stellar", "investment", "latam", "real world assets", "rwa", "blockchain"],
    authors: [{ name: "Dishub", url: "https://dishub.city" }],
    creator: "Infrabricks",
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: '/',
        siteName: 'Infrabricks',
        title: "Infrabricks | Tokenized Infrastructure in Latam",
        description: "Invest in critical infrastructure through utility-based tokens on Stellar. Powered by DOB Protocol.",
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Infrabricks Platform',
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: "Infrabricks | Tokenized Infrastructure in Latam",
        description: "Invest in critical infrastructure through utility-based tokens on Stellar. Powered by DOB Protocol.",
        images: ['/og-image.png'],
        creator: "@infrabricks",
    },
    icons: {
        icon: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark scroll-smooth">
            <head>
                <link rel="dns-prefetch" href="https://api-production-bbc1.up.railway.app" />
                <link rel="preconnect" href="https://api-production-bbc1.up.railway.app" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://images.unsplash.com" />
                <link rel="preconnect" href="https://images.unsplash.com" />
            </head>
            <body className={`${inter.className} bg-brand-blue antialiased`}>
                <WalletProvider>
                    <Suspense fallback={null}>
                        <CombinedAnalyticsTracker />
                    </Suspense>
                    {children}
                    <Toaster position="top-right" theme="dark" richColors />
                </WalletProvider>
            </body>
        </html>
    );
}
