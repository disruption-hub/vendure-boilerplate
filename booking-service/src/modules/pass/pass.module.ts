import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassController } from './pass.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PassController],
  providers: [PassService],
  exports: [PassService],
})
export class PassModule {}
