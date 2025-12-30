import { bootstrap, ProductService, RequestContext, ChannelService, LanguageCode, ProductVariantService, ProductVariant, TransactionalConnection, Product } from '@vendure/core';
import { config } from './vendure-config';

async function verifyProducts() {
    const app = await bootstrap(config);
    const channelService = app.get(ChannelService);
    const connection = app.get(TransactionalConnection);

    const channel = await channelService.getDefaultChannel();
    console.log(`Default Channel: ${channel.code} (ID: ${channel.id})`);

    const variantRepo = connection.rawConnection.getRepository(ProductVariant);
    const allVariants = await variantRepo.find({ relations: ['product', 'channels'] });

    console.log(`\n--- Raw DB Variants Check ---`);
    console.log(`Total Variants in DB: ${allVariants.length}`);
    for (const v of allVariants) {
        console.log(`Variant ID: ${v.id} | Product: ${v.product?.name} (ID: ${v.product?.id}) | Enabled: ${v.enabled}`);
        console.log(`  Channels: ${v.channels.map((c: any) => c.code).join(', ')}`);
        console.log(`  Stock: ${(v as any).stockOnHand}`);
        if (v.product?.name === 'Premium Yoga Mat' || v.product?.name === 'Zen Yoga Leggings') {
            console.log(`  !!! FOUND TARGET VARIANT !!!`);
        }
    }

    const products = await connection.rawConnection.getRepository(Product).find({
        relations: ['assets', 'featuredAsset']
    });

    console.log(`\n--- Raw DB Products & Assets Check ---`);
    console.log(`Total Products: ${products.length}`);
    products.forEach((p: any) => {
        console.log(`Product: ${p.id} | Slug: ${p.slug} | Assets: ${p.assets?.length || 0}`);
        if (p.featuredAsset) {
            console.log(`  Featured Asset: ${p.featuredAsset.id} | Preview: ${p.featuredAsset.preview}`);
        }
        p.assets?.forEach((a: any) => {
            console.log(`  Asset: ${a.id} | Preview: ${a.preview}`);
        });
    });

    process.exit(0);
}

verifyProducts().catch(e => {
    console.error(e);
    process.exit(1);
});
