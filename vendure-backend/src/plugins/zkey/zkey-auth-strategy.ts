import {
    AuthenticationStrategy,
    ExternalAuthenticationService,
    Injector,
    Logger,
    RequestContext,
    User,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

export type ZKeyAuthData = {
    token: string;
};

type ZKeyProfile = {
    id: string;
    email?: string | null;
    primaryEmail?: string | null;
    emailVerified?: boolean | null;
    firstName?: string | null;
    lastName?: string | null;
};

export class ZKeyAuthenticationStrategy implements AuthenticationStrategy<ZKeyAuthData> {
    readonly name = 'zkey';
    private externalAuthenticationService!: ExternalAuthenticationService;

    init(injector: Injector) {
        this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
    }

    defineInputType(): DocumentNode {
        return gql`
            input ZKeyAuthInput {
                token: String!
            }
        `;
    }

    async authenticate(ctx: RequestContext, data: ZKeyAuthData): Promise<User | false | string> {
        const token = data?.token;
        if (!token) {
            return false;
        }

        try {
            const isDev = process.env.APP_ENV === 'dev' || process.env.NODE_ENV !== 'production';
            const baseUrl = (process.env.ZKEY_SERVICE_URL || (isDev ? 'http://localhost:3002' : '')).replace(/\/$/, '');
            if (!baseUrl) {
                Logger.error('Missing ZKEY_SERVICE_URL', 'ZKeyAuthenticationStrategy');
                return false;
            }

            const profileRes = await fetch(`${baseUrl}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!profileRes.ok) {
                Logger.warn(`ZKey profile fetch failed: ${profileRes.status} ${profileRes.statusText}`, 'ZKeyAuthenticationStrategy');
                return false;
            }

            const profile = (await profileRes.json()) as ZKeyProfile;
            const email = profile.email || profile.primaryEmail;
            if (!email) {
                Logger.warn('ZKey profile missing email', 'ZKeyAuthenticationStrategy');
                return false;
            }

            const user = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
                strategy: this.name,
                externalIdentifier: profile.id,
                verified: Boolean(profile.emailVerified),
                emailAddress: email,
                firstName: profile.firstName || email.split('@')[0],
                lastName: profile.lastName || '',
            } as any);

            return user as any;
        } catch (e) {
            Logger.error(
                `[ZKeyAuth] Unexpected error: ${e instanceof Error ? e.message : String(e)}`,
                'ZKeyAuthenticationStrategy',
            );
            return false;
        }
    }
}
