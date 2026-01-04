import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';
import { VendureCustomer } from '../dashboard/types';

const GET_ACTIVE_CUSTOMER = `
  query GetActiveCustomer {
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
      orders(options: { take: 5, sort: { createdAt: DESC } }) {
        items {
          id
          code
          state
          totalWithTax
          currencyCode
          createdAt
        }
      }
    }
  }
`;

@Injectable()
export class VendureService {
  private client: GraphQLClient;
  private readonly logger = new Logger(VendureService.name);

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('VENDURE_SHOP_API_URL') || 'http://localhost:3000/shop-api';
    this.logger.log(`Initializing with Vendure URL: ${url}`);
    this.client = new GraphQLClient(url);
  }

  async getCustomerProfile(vendureToken?: string): Promise<VendureCustomer | null> {
    if (!vendureToken) return null;

    try {
      this.client.setHeader('vendure-auth-token', vendureToken);
      const data: any = await this.client.request(GET_ACTIVE_CUSTOMER);

      if (!data.activeCustomer) return null;

      return {
        ...data.activeCustomer,
        orders: data.activeCustomer.orders.items
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch Vendure profile: ${error.message}`);
      return null;
    }
  }
}
