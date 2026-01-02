import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendureSyncService {
  private readonly logger = new Logger(VendureSyncService.name);
  private readonly vendureUrl = process.env.VENDURE_API_URL || 'http://localhost:3000/admin-api';
  private readonly username = process.env.VENDURE_ADMIN_USER || 'superadmin';
  private readonly password = process.env.VENDURE_ADMIN_PASSWORD || 'superadmin';
  private token: string | null = null;

  constructor(private prisma: PrismaService) { }

  async syncUser(user: any) {
    try {
      const query = `
        mutation SyncZKeyUser($input: SyncZKeyUserInput!) {
          syncZKeyUser(input: $input) {
            id
            emailAddress
          }
        }
      `;

      const variables = {
        input: {
          id: user.id,
          email: user.primaryEmail,
          firstName: user.firstName === undefined ? undefined : user.firstName,
          lastName: user.lastName === undefined ? undefined : user.lastName,
          phoneNumber: (user.phoneNumber || user.phone) === undefined ? undefined : (user.phoneNumber || user.phone),
          walletAddress: user.walletAddress === undefined ? undefined : user.walletAddress,
          vendureId: user.vendureId === undefined ? undefined : user.vendureId,
        },
      };

      this.logger.log(`[Sync Debug] Sending to Vendure for ${user.primaryEmail}: ${JSON.stringify(variables)}`);
      const result = await this.callVendure(query, variables);
      this.logger.log(`[Sync Debug] Vendure Response for ${user.primaryEmail}: ${JSON.stringify(result)}`);

      if (result?.syncZKeyUser?.id) {
        const vendureId = result.syncZKeyUser.id;

        if (user.vendureId !== vendureId) {
          this.logger.log(`Updating local user ${user.id} with Vendure ID ${vendureId}`);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { vendureId: vendureId },
          });
        }
      }

      this.logger.log(`Successfully synced user ${user.primaryEmail} to Vendure`);
    } catch (error) {
      this.logger.error(`Failed to sync user ${user.primaryEmail} to Vendure: ${error.message}`);
    }
  }


  private async callVendure(query: string, variables: any) {
    if (!this.token) {
      await this.login();
    }

    let response = await this.execute(query, variables);

    // If unauthorized, try to login again
    if (response.errors && response.errors.some((e: any) => e.extensions?.code === 'FORBIDDEN')) {
      await this.login();
      response = await this.execute(query, variables);
    }

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    return response.data;
  }

  private async execute(query: string, variables: any) {
    const res = await fetch(this.vendureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    return res.json();
  }

  private async login() {
    this.logger.log('Logging in to Vendure Admin API...');
    const query = `
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          ... on currentUser {
            id
          }
        }
      }
    `;

    const res = await fetch(this.vendureUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { username: this.username, password: this.password },
      }),
    });

    const authHeader = res.headers.get('vendure-auth-token');
    if (authHeader) {
      this.token = authHeader;
    } else {
      const data = await res.json();
      if (data.errors) {
        throw new Error(`Vendure login failed: ${data.errors[0].message}`);
      }
    }
  }
}
