import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ZKeyService } from '../zkey/zkey.service';
import { VendureService } from '../vendure/vendure.service';
import { UnifiedDashboardData } from './types';

@Controller('api/dashboard')
export class DashboardController {
    constructor(
        private readonly zkeyService: ZKeyService,
        private readonly vendureService: VendureService,
    ) { }

    @Get()
    async getDashboard(
        @Headers('authorization') authHeader: string,
        @Headers('vendure-auth-token') vendureToken?: string,
    ): Promise<UnifiedDashboardData> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const token = authHeader.split(' ')[1];

        // 1. Validate & Fetch ZKey Profile (Source of Truth)
        const zkeyProfile = await this.zkeyService.getProfile(token);

        // 2. Fetch Vendure Data (Best Effort)
        const vendureCustomer = await this.vendureService.getCustomerProfile(vendureToken);

        return {
            user: zkeyProfile,
            customer: vendureCustomer || undefined,
        };
    }
}
