import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendureSyncService {
  private readonly logger = new Logger(VendureSyncService.name);

  constructor(private prisma: PrismaService) { }

  async syncUser(user: any) {
    try {
      const config = await this.getVendureConfig(user.tenantId);
      if (!config) {
        this.logger.warn(`No Vendure configuration found for tenant ${user.tenantId}. Skipping sync.`);
        return;
      }

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
      const result = await this.callVendure(query, variables, config);
      this.logger.log(`[Sync Debug] Vendure Response for ${user.primaryEmail}: ${JSON.stringify(result)}`);

      if (result?.syncZKeyUser?.id) {
        const vendureId = result.syncZKeyUser.id;

        if (user.vendureId !== vendureId) {
          this.logger.log(`Updating local user ${user.id} with Vendure ID ${vendureId}`);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { vendureId: vendureId },
            select: { id: true }
          });
        }
      }

      this.logger.log(`Successfully synced user ${user.primaryEmail} to Vendure`);
    } catch (error) {
      this.logger.error(`Failed to sync user ${user.primaryEmail} to Vendure: ${error.message}`);
    }
  }

  private async getVendureConfig(tenantId?: string) {
    if (!tenantId) return null;
    // Mirroring logic from Dashboard components/users/actions.ts
    const apps = await this.prisma.application.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' }, // Use most recent app config
      take: 25,
    });

    for (const app of apps) {
      const vendure = (app.integrations as any)?.vendure;
      if (vendure?.enabled) {
        return {
          url: vendure.adminApiUrlProd || vendure.adminApiUrl || 'http://localhost:3000/admin-api',
          username: vendure.superadminUsername || 'superadmin',
          password: vendure.superadminPassword || 'superadmin',
          tokenHeader: vendure.authTokenHeader,
          apiKey: vendure.adminApiToken,
        };
      }
    }
    return null;
  }

  private async callVendure(query: string, variables: any, config: any) {
    // Attempt with new login every time to ensure correct tenant
    const token = await this.login(config);

    const response = await this.execute(query, variables, config, token);

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    return response.data;
  }

  private async execute(query: string, variables: any, config: any, token: string) {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    return res.json();
  }

  private async login(config: any) {
    this.logger.log(`Logging in to Vendure Admin API at ${config.url}...`);
    const query = `
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          ... on CurrentUser {
            id
          }
        }
      }
    `;

    const res = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { username: config.username, password: config.password },
      }),
    });

    const authHeader = res.headers.get('vendure-auth-token');
    if (authHeader) {
      return authHeader;
    } else {
      const data = await res.json();
      if (data.errors) {
        throw new Error(`Vendure login failed: ${data.errors[0].message}`);
      }
      throw new Error('Vendure login failed: No auth token returned');
    }
  }
}
