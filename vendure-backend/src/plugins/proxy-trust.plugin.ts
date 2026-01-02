import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@VendurePlugin({
    imports: [PluginCommonModule],
})
export class ProxyTrustPlugin implements OnModuleInit {
    constructor(private adapterHost: HttpAdapterHost) { }

    onModuleInit() {
        const httpAdapter = this.adapterHost.httpAdapter;
        if (httpAdapter) {
            const app = httpAdapter.getInstance();
            // Trust proxy is required for correct IP resolution behind Vercel/Railway/Cloudflare
            // '1' means trust the first hop. Use 'true' to trust all or specify IPs if needed.
            // Using 1 is typical for standard reverse proxy setups.
            app.set('trust proxy', 1);
            console.log('[ProxyTrustPlugin] System: Trust proxy configured to 1');
        }
    }
}
