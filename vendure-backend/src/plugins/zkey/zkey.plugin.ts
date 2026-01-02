import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { ZKeyResolver } from './zkey.resolver';
import { ZKeyAuthenticationStrategy } from './zkey-auth-strategy';
import gql from 'graphql-tag';

@VendurePlugin({
    imports: [PluginCommonModule],
    adminApiExtensions: {
        schema: gql`
            input SyncZKeyUserInput {
                id: String!
                email: String!
                firstName: String
                lastName: String
                phoneNumber: String
                walletAddress: String
                vendureId: String
            }

            extend type Mutation {
                syncZKeyUser(input: SyncZKeyUserInput!): Customer
                # deleteZKeyUser(id: String!, email: String): Boolean
                # hardDeleteZKeyUser(id: String!, email: String): Boolean
            }
        `,
        resolvers: [ZKeyResolver],
    },
    providers: [],
    configuration: config => {
        config.authOptions.shopAuthenticationStrategy.push(new ZKeyAuthenticationStrategy());
        return config;
    },
})
export class ZKeyPlugin { }
