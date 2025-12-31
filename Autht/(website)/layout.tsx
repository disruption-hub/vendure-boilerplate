import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { HeatmapRenderer } from "@/components/analytics/HeatmapRenderer";

export default function WebsiteLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
            <HeatmapRenderer />
        </>
    );
}
