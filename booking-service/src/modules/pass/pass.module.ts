import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassController } from './pass.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassResolver } from '../../graphql/pass.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [PassController],
  providers: [PassService, PassResolver],
  exports: [PassService],
})
export class PassModule { }
