import { Module } from '@nestjs/common';
import { BookingProfileService } from './booking-profile.service';
import { BookingProfileResolver } from './booking-profile.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [BookingProfileService, BookingProfileResolver],
    exports: [BookingProfileService],
})
export class BookingProfileModule { }
