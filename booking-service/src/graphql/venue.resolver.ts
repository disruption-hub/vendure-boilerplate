import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, InputType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VenueService } from '../modules/venue/venue.service';
import { Venue, Space, SpacePreset, VenueType } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
class DayHoursInput {
    @Field({ nullable: true })
    open?: string;

    @Field({ nullable: true })
    close?: string;

    @Field({ defaultValue: false })
    closed: boolean;
}

@InputType()
class OpeningHoursInput {
    @Field(() => DayHoursInput, { nullable: true })
    mon?: DayHoursInput;

    @Field(() => DayHoursInput, { nullable: true })
    tue?: DayHoursInput;

    @Field(() => DayHoursInput, { nullable: true })
    wed?: DayHoursInput;

    @Field(() => DayHoursInput, { nullable: true })
    thu?: DayHoursInput;

    @Field(() => DayHoursInput, { nullable: true })
    fri?: DayHoursInput;

    @Field(() => DayHoursInput, { nullable: true })
    sat?: DayHoursInput;

    @Field(() => DayHoursInput, { nullable: true })
    sun?: DayHoursInput;
}

@Resolver(() => Venue)
export class VenueResolver {
    constructor(private readonly venueService: VenueService) { }

    @Query(() => [Venue])
    async allVenues() {
        return this.venueService.findAll();
    }

    @Query(() => Venue, { nullable: true })
    async venue(@Args('id') id: string) {
        return this.venueService.findOne(id);
    }

    @Mutation(() => Venue)
    @UseGuards(JwtAuthGuard)
    async createVenue(
        @Args('type', { type: () => VenueType, defaultValue: VenueType.UNIT }) type: VenueType,
        @Args('name') name: string,
        @Args('address', { nullable: true }) address?: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('timezone', { nullable: true, defaultValue: 'UTC' }) timezone?: string,
        @Args('profileId', { nullable: true }) profileId?: string,
        @Args('parentId', { nullable: true }) parentId?: string,
        @Args('networkIds', { type: () => [String], nullable: true }) networkIds?: string[],
        @Args('openingHours', { type: () => OpeningHoursInput, nullable: true }) openingHours?: OpeningHoursInput,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
    ) {
        return this.venueService.create({
            name,
            address,
            description,
            timezone,
            type,
            profile: profileId ? { connect: { id: profileId } } : undefined,
            parent: parentId ? { connect: { id: parentId } } : undefined,
            networks: networkIds ? { connect: networkIds.map(id => ({ id })) } : undefined,
            openingHours: openingHours as any,
            amenities
        });
    }

    @Mutation(() => Space)
    @UseGuards(JwtAuthGuard)
    async createSpace(
        @Args('venueId') venueId: string,
        @Args('name') name: string,
        @Args('capacity', { type: () => Int, nullable: true }) capacity?: number,
        @Args('type', { nullable: true }) type?: string,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
    ) {
        return this.venueService.createSpace(venueId, {
            name,
            capacity,
            type,
            amenities
        });
    }

    @Mutation(() => Venue)
    @UseGuards(JwtAuthGuard)
    async updateVenue(
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('address', { nullable: true }) address?: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('timezone', { nullable: true }) timezone?: string,
        @Args('type', { type: () => VenueType, nullable: true }) type?: VenueType,
        @Args('profileId', { nullable: true }) profileId?: string,
        @Args('parentId', { nullable: true }) parentId?: string,
        @Args('networkIds', { type: () => [String], nullable: true }) networkIds?: string[],
        @Args('openingHours', { type: () => OpeningHoursInput, nullable: true }) openingHours?: OpeningHoursInput,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
    ) {
        return this.venueService.update(id, {
            name,
            address,
            description,
            timezone,
            type: type ?? undefined,
            profile: profileId ? { connect: { id: profileId } } : undefined,
            parent: parentId ? { connect: { id: parentId } } : undefined,
            networks: networkIds ? { set: networkIds.map(id => ({ id })) } : undefined,
            openingHours: openingHours as any,
            amenities
        });
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteVenue(@Args('id') id: string) {
        await this.venueService.remove(id);
        return true;
    }

    @Mutation(() => Space)
    @UseGuards(JwtAuthGuard)
    async updateSpace(
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('capacity', { type: () => Int, nullable: true }) capacity?: number,
        @Args('type', { nullable: true }) type?: string,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
    ) {
        return this.venueService.updateSpace(id, {
            name,
            capacity,
            type,
            amenities
        });
    }

    // Space Preset Mutations
    @Query(() => [SpacePreset])
    async allSpacePresets() {
        return this.venueService.findAllSpacePresets();
    }

    @Mutation(() => SpacePreset)
    @UseGuards(JwtAuthGuard)
    async createSpacePreset(
        @Args('name') name: string,
        @Args('type') type: string,
        @Args('capacity', { type: () => Int }) capacity: number,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
    ) {
        return this.venueService.createSpacePreset({
            name,
            type,
            capacity,
            amenities
        });
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteSpacePreset(@Args('id') id: string) {
        await this.venueService.removeSpacePreset(id);
        return true;
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteSpace(@Args('id') id: string) {
        await this.venueService.removeSpace(id);
        return true;
    }

    @ResolveField('spaces', () => [Space])
    async getSpaces(@Parent() venue: Venue) {
        return this.venueService.findSpaces(venue.id);
    }
}

@Resolver(() => Space)
export class SpaceResolver {
    constructor(private readonly venueService: VenueService) { }

    @ResolveField('venue', () => Venue)
    async getVenue(@Parent() space: Space & { venueId: string }) {
        return this.venueService.findOne(space.venueId);
    }
}
