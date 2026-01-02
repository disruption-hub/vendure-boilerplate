import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VendureSyncService } from './vendure-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, VendureSyncService],
  exports: [UsersService, VendureSyncService],
})
export class UsersModule { }
