import {
    AuthenticationStrategy,
    ExternalAuthenticationService,
    User,
    RequestContext,
    Injector,
    Logger,
    RoleService,
    CustomerService,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type LogtoAuthData = {
    token: string;
};

export class LogtoAuthenticationStrategy implements AuthenticationStrategy<LogtoAuthData> {
    readonly name = 'logto';
    private externalAuthenticationService: ExternalAuthenticationService;
    private customerService: CustomerService;
    private JWKS: ReturnType<typeof createRemoteJWKSet>;

    constructor() {
        // Initialize JWKS with the Logto endpoint
        const endpoint = process.env.LOGTO_ENDPOINT;
        if (!endpoint) {
            throw new Error('LOGTO_ENDPOINT environment variable is required for LogtoAuthenticationStrategy');
        }
        this.JWKS = createRemoteJWKSet(new URL(`${endpoint.replace(/\/$/, '')}/oidc/jwks`));
    }

    init(injector: Injector) {
        this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
        this.customerService = injector.get(CustomerService);
    }

    defineInputType(): DocumentNode {
        return gql`
            input LogtoAuthInput {
                token: String!
            }
        `;
    }

    async authenticate(ctx: RequestContext, data: LogtoAuthData): Promise<User | false> {
        try {
            const { payload } = await jwtVerify(data.token, this.JWKS, {
                issuer: `${process.env.LOGTO_ENDPOINT?.replace(/\/$/, '')}/oidc`,
            });

            const logtoUserId = payload.sub;
            const email = payload.email as string;

            if (!logtoUserId || !email) {
                Logger.error('Logto token missing sub or email claim', 'LogtoAuthenticationStrategy');
                return false;
            }

            const user = await this.externalAuthenticationService.findCustomerUser(ctx, this.name, logtoUserId);

            if (user) {
                return user;
            }

            // Create new customer if not found
            Logger.info(`Creating new customer for Logto user: ${email}`, 'LogtoAuthenticationStrategy');
            const newCustomer = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
                strategy: this.name,
                externalIdentifier: logtoUserId,
                verified: !!payload.email_verified,
                emailAddress: email,
                firstName: (payload.name as string) || (payload.given_name as string) || email.split('@')[0],
                lastName: (payload.family_name as string) || '',
            });

            // Store extra metadata if needed
            // createCustomerAndUser returns a User, not Customer?
            // "Property 'user' does not exist on type 'User'" implies it returns User.
            // But we need the Customer to update custom fields (Customer entity).
            if (newCustomer) {
                const customer = await this.customerService.findOneByUserId(ctx, newCustomer.id);
                if (customer) {
                    await this.customerService.update(ctx, {
                        id: customer.id,
                        customFields: {
                            logtoUserId: logtoUserId,
                            logtoData: JSON.stringify(payload),
                        },
                    });
                }
                return newCustomer;
            }

            return false;

        } catch (e: any) {
            Logger.error(`Logto authentication failed: ${e.message}`, 'LogtoAuthenticationStrategy');
            return false;
        }
    }
}
