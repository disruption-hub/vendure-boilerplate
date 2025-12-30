import { getProduct } from '@/app/providers/product-data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/app/components/products/AddToCartButton';
import { formatAssetUrl } from '@/app/utils/format-asset-url';

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    const { name, description, variants, assets, featuredAsset } = product;
    const price = variants[0]?.price;
    const currency = variants[0]?.currencyCode;
    const imageUrl = formatAssetUrl(assets?.[0]?.preview || featuredAsset?.preview);

    return (
        <div className="bg-white">
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">

                {/* Product Image */}
                <div className="lg:max-w-lg lg:self-end">
                    <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg">
                        {imageUrl && (
                            <Image
                                src={imageUrl}
                                alt={name}
                                width={800}
                                height={800}
                                unoptimized
                                className="h-full w-full object-cover object-center"
                            />
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{name}</h1>

                    <div className="mt-3">
                        <h2 className="sr-only">Product information</h2>
                        <p className="text-3xl tracking-tight text-gray-900">
                            {price ? `${price / 100} ${currency}` : 'N/A'}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h3 className="sr-only">Description</h3>
                        <div className="space-y-6 text-base text-gray-700" dangerouslySetInnerHTML={{ __html: description }} />
                    </div>

                    <div className="mt-10 flex">
                        <AddToCartButton productVariantId={variants[0]?.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
