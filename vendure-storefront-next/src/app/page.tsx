import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSection } from "@/components/layout/hero-section";
import { FeaturedProducts } from "@/components/commerce/featured-products";
import { SITE_NAME, SITE_URL, buildCanonicalUrl } from "@/lib/metadata";
import { getLogtoContext, signIn, signOut } from '@logto/next/server-actions';
import SignIn from './sign-in';
import SignOut from './sign-out';
import { logtoConfig } from './logto';

export const metadata: Metadata = {
    title: {
        absolute: `${SITE_NAME} - Your One-Stop Shop`,
    },
    description:
        "Discover high-quality products at competitive prices. Shop now for the best deals on electronics, fashion, home goods, and more.",
    alternates: {
        canonical: buildCanonicalUrl("/"),
    },
    openGraph: {
        title: `${SITE_NAME} - Your One-Stop Shop`,
        description:
            "Discover high-quality products at competitive prices. Shop now for the best deals.",
        type: "website",
        url: SITE_URL,
    },
};

async function AuthNav() {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
    return (
        <div className="flex items-center">
            {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">Hello, {claims?.name || claims?.sub}</span>
                    <SignOut
                        onSignOut={async () => {
                            'use server';
                            await signOut(logtoConfig);
                        }}
                    />
                </div>
            ) : (
                <SignIn
                    onSignIn={async () => {
                        'use server';
                        await signIn(logtoConfig);
                    }}
                />
            )}
        </div>
    );
}

export default async function Home(_props: PageProps<'/'>) {
    return (
        <div className="min-h-screen">
            <nav className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span className="text-xl font-bold">{SITE_NAME}</span>
                </div>
                <Suspense fallback={<div className="h-10 w-20 bg-gray-100 animate-pulse rounded" />}>
                    <AuthNav />
                </Suspense>
            </nav>
            <HeroSection />
            <FeaturedProducts />

            {/* You can add more sections here */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="space-y-3">
                            <div
                                className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold">High Quality</h3>
                            <p className="text-muted-foreground">Premium products carefully selected for you</p>
                        </div>
                        <div className="space-y-3">
                            <div
                                className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold">Best Prices</h3>
                            <p className="text-muted-foreground">Competitive pricing on all our products</p>
                        </div>
                        <div className="space-y-3">
                            <div
                                className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold">Fast Delivery</h3>
                            <p className="text-muted-foreground">Quick and reliable shipping worldwide</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
