import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Temporary Mock Guard for initial verification.
 * In a real scenario, this should validate the JWT signature.
 * For now, we assume the Gateway has already validated the OIDC token
 * and passed user info headers, OR we decode the JWT without verification
 * simply to get the 'sub' claim which should match the ZKey ID.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();

        // Check for Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader) return false;

        // Bearer <token>
        const token = authHeader.split(' ')[1];
        if (!token) return false;

        // DECODE WITHOUT VERIFICATION for dev/prototype speed
        // Ideally we should use @nestjs/jwt and verify against ZKey's public key
        try {
            const payloadBase64 = token.split('.')[1];
            const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
            const payload = JSON.parse(payloadJson);

            // Attach user to request
            request.user = {
                zkeyId: payload.sub, // 'sub' is standard for subject ID
                email: payload.email
            };
            return true;
        } catch (e) {
            return false;
        }
    }
}
