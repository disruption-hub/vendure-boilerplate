import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { Request, Response, NextFunction } from 'express';

/**
 * This middleware captures the raw request body for routes that need
 * to verify HMAC signatures (like Lyra IPN webhooks).
 * It must run BEFORE the JSON body parser to capture the original bytes.
 */
function rawBodyMiddleware(req: Request & { rawBody?: Buffer }, res: Response, next: NextFunction) {
    if (req.readable) {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
            req.rawBody = Buffer.concat(chunks);
            // Also parse as JSON/form-data for the body decorator
            const contentType = req.headers['content-type'] || '';
            const bodyStr = req.rawBody.toString('utf8');

            if (contentType.includes('application/json')) {
                try {
                    req.body = JSON.parse(bodyStr);
                } catch {
                    req.body = {};
                }
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                const params = new URLSearchParams(bodyStr);
                req.body = Object.fromEntries(params.entries());
                // Try to parse nested JSON values (like kr-answer)
                for (const key of Object.keys(req.body)) {
                    try {
                        req.body[key] = JSON.parse(req.body[key]);
                    } catch {
                        // Keep as string
                    }
                }
            } else {
                req.body = { _raw: bodyStr };
            }
            next();
        });
        req.on('error', (err) => {
            console.error('[RawBodyPlugin] Error reading body:', err);
            next(err);
        });
    } else {
        next();
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
})
export class RawBodyPlugin implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(rawBodyMiddleware)
            .forRoutes('/payments/lyra-ipn');
        console.log('[RawBodyPlugin] Configured raw body capture for /payments/lyra-ipn');
    }
}
