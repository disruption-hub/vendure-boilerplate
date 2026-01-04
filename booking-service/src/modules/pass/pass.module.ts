import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassController } from './pass.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassResolver } from '../../graphql/pass.resolver';
import { PassTemplateResolver } from '../../graphql/pass-template.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [PassController],
  providers: [PassService, PassResolver, PassTemplateResolver],
  exports: [PassService],
})
export class PassModule { }
