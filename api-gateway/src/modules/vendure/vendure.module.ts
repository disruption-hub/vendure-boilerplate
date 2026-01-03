import { Module } from '@nestjs/common';
import { VendureService } from './vendure.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [VendureService],
    exports: [VendureService],
})
export class VendureModule { }
