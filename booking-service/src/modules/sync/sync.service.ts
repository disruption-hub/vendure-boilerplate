import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private prisma: PrismaService) { }

    async handleUserCreated(payload: any) {
        this.logger.log(`Received user.created event: ${JSON.stringify(payload)}`);

        // Create user in Booking DB
        await this.prisma.user.upsert({
            where: { zkeyId: payload.id },
            update: {
                email: payload.email,
                firstName: payload.firstName,
                lastName: payload.lastName,
            },
            create: {
                zkeyId: payload.id,
                email: payload.email,
                firstName: payload.firstName,
                lastName: payload.lastName,
            },
        });

        this.logger.log(`User synced: ${payload.email}`);
    }
}
