import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
    return (
        <section className="relative bg-muted overflow-hidden">
            <div className="container mx-auto px-4 py-12 md:py-24 lg:py-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="text-center md:text-left space-y-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            MatMax Yoga
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
                            Find your inner peace with our premium yoga mats and accessories. Designed for comfort, stability, and style in any setting.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                            <Button asChild size="lg" className="min-w-[160px]">
                                <Link href="/search">
                                    Shop Now
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full rounded-2xl overflow-hidden shadow-xl">
                        <Image
                            src="/matmax-yoga-hero.png"
                            alt="MatMax Yoga"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
