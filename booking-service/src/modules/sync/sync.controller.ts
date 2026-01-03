import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SyncService } from './sync.service';

@Controller()
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @EventPattern('user.created')
    async handleUserCreated(@Payload() data: any) {
        await this.syncService.handleUserCreated(data);
    }
}
