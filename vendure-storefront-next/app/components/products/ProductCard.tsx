import Link from 'next/link';
import Image from 'next/image';
import { formatAssetUrl } from '@/app/utils/format-asset-url';

export function ProductCard({ product }: { product: any }) {
    const { name, variants, assets, slug, featuredAsset } = product;
    const price = variants[0]?.price;
    const currency = variants[0]?.currencyCode;
    const imageUrl = formatAssetUrl(assets?.[0]?.preview || featuredAsset?.preview);

    return (
        <Link href={`/products/${slug}`} className="group">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        width={500}
                        height={500}
                        unoptimized
                        className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>
            <h3 className="mt-4 text-sm text-gray-700">{name}</h3>
            <p className="mt-1 text-lg font-medium text-gray-900">
                {price ? `${price / 100} ${currency}` : 'N/A'}
            </p>
        </Link>
    );
}
