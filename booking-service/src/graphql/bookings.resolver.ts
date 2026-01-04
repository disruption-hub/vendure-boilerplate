import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service';
import { Booking, Session } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard'; // Ensure this guards handles GqlExecutionContext if needed, or create GqlAuthGuard

@Resolver(() => Booking)
export class BookingsResolver {
  constructor(private readonly bookingsService: BookingsService) {}

  @Query(() => [Booking])
  @UseGuards(JwtAuthGuard)
  async myBookings(@Context() context) {
    // Assuming Guard attaches user to req, and GQL context has req
    const req = context.req;
    return this.bookingsService.findMyBookings(req.user.zkeyId);
  }

  @Mutation(() => Booking)
  @UseGuards(JwtAuthGuard)
  async cancelBooking(@Args('id') id: string, @Context() context) {
    const req = context.req;
    return this.bookingsService.cancelBooking(req.user.zkeyId, id);
  }

  @Query(() => [Session])
  @UseGuards(JwtAuthGuard)
  async myTeachingSessions(@Context() context) {
    const req = context.req;
    return this.bookingsService.findMyTeachingSessions(req.user.zkeyId);
  }

  @Query(() => [Booking])
  // @UseGuards(AdminGuard) // TODO
  async allBookings() {
    return this.bookingsService.findAllBookings();
  }
}
