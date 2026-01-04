import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { VenueNetworkService } from './venue-network.service';
import { VenueNetwork, NetworkType } from '../../graphql/types';

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
        @Args('name') name: string,
        @Args('type', { type: () => NetworkType, defaultValue: NetworkType.NETWORK }) type: NetworkType,
        @Args('description', { nullable: true }) description?: string,
    ) {
        return this.venueNetworkService.create({
            name,
            type,
            description,
        });
    }

    @Mutation(() => VenueNetwork)
    @UseGuards(JwtAuthGuard)
    async updateVenueNetwork(
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('type', { type: () => NetworkType, nullable: true }) type?: NetworkType,
        @Args('description', { nullable: true }) description?: string,
    ) {
        return this.venueNetworkService.update(id, {
            name,
            type,
            description,
        });
    }
}
