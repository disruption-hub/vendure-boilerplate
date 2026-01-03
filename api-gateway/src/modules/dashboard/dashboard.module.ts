import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { ZKeyModule } from '../zkey/zkey.module';
import { VendureModule } from '../vendure/vendure.module';

@Module({
    imports: [ZKeyModule, VendureModule],
    controllers: [DashboardController],
})
export class DashboardModule { }
