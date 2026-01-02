import {
    AuthenticationStrategy,
    CustomerService,
    ExternalAuthenticationService,
    Injector,
    RequestContext,
    User,
    Logger,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

export type ZKeyAuthData = {
    token: string;
};

export class ZKeyAuthenticationStrategy implements AuthenticationStrategy<ZKeyAuthData> {
    readonly name = 'zkey';
    private externalAuthenticationService: ExternalAuthenticationService;
    private customerService: CustomerService;

    init(injector: Injector) {
        this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
        this.customerService = injector.get(CustomerService);
    }

    defineInputType(): DocumentNode {
        return gql`
      input ZKeyAuthInput {
        token: String!
      }
    `;
    }

    async authenticate(ctx: RequestContext, data: ZKeyAuthData): Promise<User | false | string> {
        const { token } = data;

        try {
            const isDev = process.env.APP_ENV === 'dev' || process.env.NODE_ENV !== 'production';
            const baseUrl = (process.env.ZKEY_SERVICE_URL || (isDev ? 'http://localhost:3002' : '')).replace(/\/$/, '');
            if (!baseUrl) {
                Logger.error('Missing ZKEY_SERVICE_URL in production', 'ZKeyAuthenticationStrategy');
                return 'ZKey service URL is not configured (missing ZKEY_SERVICE_URL)';
            }

            // Fetch user profile from ZKey service
            const response = await fetch(`${baseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                Logger.error(`ZKey profile fetch failed: ${response.status} ${response.statusText}`, 'ZKeyAuthenticationStrategy');
                return `ZKey profile fetch failed (${response.status})`;
            }

            const zkeyUser = await response.json();
            Logger.info(`[ZKey] Decoded user id: ${zkeyUser.id} (${zkeyUser.primaryEmail || zkeyUser.email})`, 'ZKeyAuthenticationStrategy');

            const walletAddress = zkeyUser.walletAddress || null;

            // Use email as the unique identifier
            const email = zkeyUser.email || zkeyUser.primaryEmail;
            if (!email) {
                Logger.error('ZKey user missing email', 'ZKeyAuthenticationStrategy');
                return 'ZKey profile missing email';
            }

            Logger.info(`[ZKey] Authenticating user: ${email} (Name: ${zkeyUser.firstName} ${zkeyUser.lastName})`, 'ZKeyAuthenticationStrategy');

            // Create or update user in Vendure
            Logger.info(`[ZKey] Calling createCustomerAndUser...`, 'ZKeyAuthenticationStrategy');
            const user: any = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
                strategy: this.name,
                externalIdentifier: zkeyUser.id,
                verified: zkeyUser.emailVerified || false,
                emailAddress: email,
                firstName: zkeyUser.firstName || email.split('@')[0],
                lastName: zkeyUser.lastName || '',
            } as any);

            Logger.info(`[ZKey] User created/found: ${user.id} (Identifier: ${user.identifier})`, 'ZKeyAuthenticationStrategy');

            // Ensure Vendure Customer details are in sync with ZKey on every login
            const customer = await this.customerService.findOneByUserId(ctx, user.id);
            if (customer) {
                Logger.info(`[ZKey] Syncing customer details for ${customer.emailAddress}`, 'ZKeyAuthenticationStrategy');
                try {
                    const updateInput: any = {
                        id: customer.id,
                        firstName: zkeyUser.firstName || customer.firstName,
                        lastName: zkeyUser.lastName || customer.lastName,
                        phoneNumber: zkeyUser.phoneNumber || customer.phoneNumber,
                    };

                    updateInput.customFields = {
                        walletAddress: walletAddress,
                        logtoUserId: zkeyUser.id,
                    };

                    await this.customerService.update(ctx, updateInput);
                    Logger.info(`[ZKey] Customer sync successful`, 'ZKeyAuthenticationStrategy');
                } catch (syncError: any) {
                    Logger.error(`[ZKey] Customer sync failed: ${syncError.message}`, 'ZKeyAuthenticationStrategy');
                }
            } else {
                Logger.warn(`[ZKey] No customer found for user ${user.id}`, 'ZKeyAuthenticationStrategy');
            }

            return user;
        } catch (error: any) {
            Logger.error(`[ZKey Auth] Error authenticating user: ${error.message}`, 'ZKeyAuthenticationStrategy', error.stack);
            return `ZKey auth error: ${error?.message || 'unknown error'}`;
        }
    }
}
