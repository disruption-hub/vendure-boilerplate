import dynamic from 'next/dynamic';
const PlatformHero = dynamic(() => import('@/components/layout/PlatformHero'));
const ProjectSpotlight = dynamic(() => import('@/components/layout/ProjectSpotlight'));

const ProjectsMarketplace = dynamic(() => import('@/components/layout/ProjectsMarketplace'));
const AssetSection = dynamic(() => import('@/components/layout/AssetSection'));
const Tokenomics = dynamic(() => import('@/components/layout/Tokenomics'));
const TrustEngine = dynamic(() => import('@/components/layout/TrustEngine'));
const DocumentLibrary = dynamic(() => import('@/components/layout/DocumentLibrary'));
const NewsletterSection = dynamic(() => import('@/components/layout/NewsletterSection'));

export default function Home() {
    return (
        <main className="min-h-screen bg-brand-blue font-sans selection:bg-brand-gold/30">
            {/* Global Platform Intro */}
            <div id="platform">
                <PlatformHero />
            </div>

            {/* Featured Project Layer */}
            <ProjectSpotlight />

            {/* Marketplace Layer */}
            <ProjectsMarketplace />

            {/* Detailed Info for Featured Project (Turboducto) */}
            <div id="asset" className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />
                </div>
                <AssetSection />
                <Tokenomics />
            </div>

            {/* Platform Trust Layer */}
            <div id="trust">
                <TrustEngine />
            </div>

            <DocumentLibrary />
            <NewsletterSection />
        </main>
    );
}
