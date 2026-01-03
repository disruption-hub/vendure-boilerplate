import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        express.raw({
            type: '*/*',
            verify: (req: any, res, buf) => {
                req.rawBody = buf;
            }
        })(req, res, (err: any) => {
            if (err) {
                return next(err);
            }
            next();
        });
    }
}
