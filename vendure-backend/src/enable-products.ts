import { bootstrap, ProductService, RequestContext, ChannelService, LanguageCode, ProductVariantService } from '@vendure/core';
import { config } from './vendure-config';

async function enableProducts() {
    const app = await bootstrap(config);
    const productService = app.get(ProductService);
    const productVariantService = app.get(ProductVariantService);
    const channelService = app.get(ChannelService);

    const channel = await channelService.getDefaultChannel();
    const ctx = new RequestContext({
        apiType: 'admin',
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
        channel,
        languageCode: LanguageCode.en,
    });

    const products = await productService.findAll(ctx);
    console.log(`Found ${products.totalItems} products.`);

    for (const product of products.items) {
        if (!product.enabled) {
            console.log(`Enabling product: ${product.name}`);
            await productService.update(ctx, {
                id: product.id,
                enabled: true,
            });
        }

        const variants = await productVariantService.getVariantsByProductId(ctx, product.id);
        for (const variant of variants.items) {
            if (!variant.enabled) {
                console.log(`Enabling variant: ${variant.name}`);
                await productVariantService.update(ctx, [{
                    id: variant.id,
                    enabled: true,
                }]);
            }
        }
    }

    console.log('Done.');
    process.exit(0);
}

enableProducts().catch(e => {
    console.error(e);
    process.exit(1);
});
