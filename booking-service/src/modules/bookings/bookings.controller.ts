import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Start with placeholder, will need to implement AuthGuard

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createBookingDto: { sessionId: string }) {
        // req.user should be populated by the Guard (from ZKey token)
        return this.bookingsService.create(req.user.zkeyId, createBookingDto.sessionId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    findMyBookings(@Request() req) {
        return this.bookingsService.findMyBookings(req.user.zkeyId);
    }
}
