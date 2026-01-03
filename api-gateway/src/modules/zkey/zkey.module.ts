import { Module } from '@nestjs/common';
import { ZKeyService } from './zkey.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [ZKeyService],
    exports: [ZKeyService],
})
export class ZKeyModule { }
