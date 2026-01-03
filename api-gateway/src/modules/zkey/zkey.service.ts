import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZKeyUser } from '../dashboard/types';

@Injectable()
export class ZKeyService {
    private baseUrl: string;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.get<string>('ZKEY_SERVICE_URL') || 'http://localhost:3002';
    }

    async getProfile(token: string): Promise<ZKeyUser> {
        try {
            const response = await fetch(`${this.baseUrl}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new UnauthorizedException('Invalid ZKey Token');
            }

            return await response.json();
        } catch (error) {
            throw new UnauthorizedException('Failed to validate ZKey session');
        }
    }
}
