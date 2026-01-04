import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { VenueNetworkService } from './venue-network.service';
import { VenueNetwork, NetworkType } from '../../graphql/types';
import { GqlUser } from '../../graphql/decorators';

@Resolver(() => VenueNetwork)
export class VenueNetworkResolver {
    constructor(private readonly venueNetworkService: VenueNetworkService) { }

    @Query(() => [VenueNetwork])
    @UseGuards(JwtAuthGuard)
    async allVenueNetworks() {
        return this.venueNetworkService.findAll();
    }

    @Mutation(() => VenueNetwork)
    @UseGuards(JwtAuthGuard)
    async createVenueNetwork(
        @GqlUser() user: any,
        @Args('name') name: string,
        @Args('type', { type: () => NetworkType, defaultValue: NetworkType.NETWORK }) type: NetworkType,
        @Args('description', { nullable: true }) description?: string,
    ) {
        if (!user.roles.includes('system-admin') && !user.roles.includes('booking-admin')) {
            throw new Error('Forbidden: System Admin or Booking Admin only');
        }
        return this.venueNetworkService.create({
            name,
            type,
            description,
        });
    }

    @Mutation(() => VenueNetwork)
    @UseGuards(JwtAuthGuard)
    async updateVenueNetwork(
        @GqlUser() user: any,
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('type', { type: () => NetworkType, nullable: true }) type?: NetworkType,
        @Args('description', { nullable: true }) description?: string,
    ) {
        if (!user.roles.includes('system-admin') && !user.roles.includes('booking-admin')) {
            throw new Error('Forbidden: System Admin or Booking Admin only');
        }
        return this.venueNetworkService.update(id, {
            name,
            type,
            description,
        });
    }

    @Mutation(() => VenueNetwork)
    @UseGuards(JwtAuthGuard)
    async deleteVenueNetwork(
        @GqlUser() user: any,
        @Args('id') id: string,
    ) {
        if (!user.roles.includes('system-admin') && !user.roles.includes('booking-admin')) {
            throw new Error('Forbidden: System Admin or Booking Admin only');
        }
        return this.venueNetworkService.delete(id);
    }
}
