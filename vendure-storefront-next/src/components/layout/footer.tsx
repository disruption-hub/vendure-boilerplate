import { cacheLife } from 'next/cache';
import { getTopCollections } from '@/lib/vendure/cached';
import Image from "next/image";
import Link from "next/link";


async function Copyright() {
    'use cache'
    cacheLife('days');

    return (
        <div>
            © {new Date().getFullYear()} MatMax Yoga. All rights reserved.
        </div>
    )
}

export async function Footer() {
    'use cache'
    cacheLife('days');

    const collections = await getTopCollections();

    return (
        <footer className="border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-sm font-semibold mb-4 uppercase tracking-wider">
                            MatMax Yoga
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold mb-4">Categories</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {collections.map((collection) => (
                                <li key={collection.id}>
                                    <Link
                                        href={`/collection/${collection.slug}`}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {collection.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link
                                    href="/about"
                                    className="hover:text-foreground transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div
                    className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <Copyright />
                    <div className="flex items-center gap-2">
                        <span>Powered by</span>
                        <span className="font-semibold text-foreground">MatMax Yoga</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
