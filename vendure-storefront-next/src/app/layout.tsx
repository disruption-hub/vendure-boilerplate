import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";
import { AuthProvider } from "@/components/auth/auth-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description:
        "Join the movement. Shop the best yoga mats and accessories at MatMax Yoga. Premium quality, eco-friendly materials, and designed for your practice.",
    openGraph: {
        type: "website",
        siteName: SITE_NAME,
        locale: "en_US",
        images: [
            {
                url: "/matmax-yoga-hero.png",
                width: 1200,
                height: 630,
                alt: "MatMax Yoga - Join the movement",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Lyra Payment Form CSS */}
                <link
                    rel="stylesheet"
                    href="https://api.lyra.com/static/js/krypton-client/V4.0/ext/neon-reset.min.css"
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
            >
                <ThemeProvider>
                    <AuthProvider>
                        <Navbar />
                        {children}
                        <Footer />
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>

                {/* Lyra Payment Form JS - loaded lazily for performance */}
                <Script
                    src="https://api.lyra.com/static/js/krypton-client/V4.0/ext/neon.js"
                    strategy="lazyOnload"
                />
            </body>
        </html>
    );
}
