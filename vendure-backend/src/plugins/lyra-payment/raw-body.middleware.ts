import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Diagnostic log: see every request hitting this middleware
        const path = req.path || req.url;
        if (path.includes('lyra-ipn') || path.includes('webhook')) {
            console.log(`[RawBodyMiddleware] Intercepting request for path: ${path}`);
        }

        express.raw({
            type: '*/*',
            verify: (req: any, res, buf) => {
                if (buf && buf.length > 0) {
                    req.rawBody = buf;
                    if (path.includes('lyra-ipn') || path.includes('webhook')) {
                        console.log(`[RawBodyMiddleware] Captured rawBody (length: ${buf.length}) for ${path}`);
                    }
                }
            }
        })(req, res, (err: any) => {
            if (err) {
                console.error(`[RawBodyMiddleware] Error in express.raw: ${err.message}`);
                return next(err);
            }
            next();
        });
    }
}
