import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, InputType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VenueService } from '../modules/venue/venue.service';
import { Venue, Space, SpacePreset, VenueType, BookingMode, SpaceSlot, SlotType } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { GraphQLJSONObject } from 'graphql-type-json';
import { GqlUser } from './decorators';

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
        @GqlUser() user: any,
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
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
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
        @GqlUser() user: any,
        @Args('venueId') venueId: string,
        @Args('name') name: string,
        @Args('capacity', { type: () => Int, nullable: true }) capacity?: number,
        @Args('type', { nullable: true }) type?: string,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
        @Args('activeBookingMode', { type: () => BookingMode, nullable: true }) activeBookingMode?: BookingMode,
        @Args('totalSlots', { type: () => Int, nullable: true }) totalSlots?: number,
        @Args('basePrice', { nullable: true }) basePrice?: number,
        @Args('slotPrice', { nullable: true }) slotPrice?: number,
        @Args('entireSpacePrice', { nullable: true }) entireSpacePrice?: number,
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        return this.venueService.createSpace(venueId, {
            name,
            capacity,
            type,
            amenities,
            activeBookingMode,
            totalSlots,
            basePrice,
            slotPrice,
            entireSpacePrice,
        });
    }

    @Mutation(() => SpaceSlot)
    @UseGuards(JwtAuthGuard)
    async createSpaceSlot(
        @GqlUser() user: any,
        @Args('spaceId') spaceId: string,
        @Args('slotIdentifier') slotIdentifier: string,
        @Args('slotType', { type: () => SlotType, defaultValue: SlotType.MAT }) slotType: SlotType,
        @Args('position', { type: () => Int, nullable: true }) position?: number,
        @Args('attributes', { type: () => GraphQLJSONObject, nullable: true }) attributes?: any,
        @Args('pricingModifier', { nullable: true, defaultValue: 1.0 }) pricingModifier?: number,
        @Args('isPremium', { nullable: true, defaultValue: false }) isPremium?: boolean,
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        return this.venueService.createSpaceSlot(spaceId, {
            slotIdentifier,
            slotType,
            position,
            attributes,
            pricingModifier,
            isPremium,
        });
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteSpaceSlot(
        @GqlUser() user: any,
        @Args('id') id: string
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        await this.venueService.removeSpaceSlot(id);
        return true;
    }

    @Mutation(() => Venue)
    @UseGuards(JwtAuthGuard)
    async updateVenue(
        @GqlUser() user: any,
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
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
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
    async deleteVenue(
        @GqlUser() user: any,
        @Args('id') id: string
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        await this.venueService.remove(id);
        return true;
    }

    @Mutation(() => Space)
    @UseGuards(JwtAuthGuard)
    async updateSpace(
        @GqlUser() user: any,
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('capacity', { type: () => Int, nullable: true }) capacity?: number,
        @Args('type', { nullable: true }) type?: string,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
        @Args('activeBookingMode', { type: () => BookingMode, nullable: true }) activeBookingMode?: BookingMode,
        @Args('totalSlots', { type: () => Int, nullable: true }) totalSlots?: number,
        @Args('basePrice', { nullable: true }) basePrice?: number,
        @Args('slotPrice', { nullable: true }) slotPrice?: number,
        @Args('entireSpacePrice', { nullable: true }) entireSpacePrice?: number,
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        return this.venueService.updateSpace(id, {
            name,
            capacity,
            type,
            amenities,
            activeBookingMode,
            totalSlots,
            basePrice,
            slotPrice,
            entireSpacePrice,
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
        @GqlUser() user: any,
        @Args('name') name: string,
        @Args('type') type: string,
        @Args('capacity', { type: () => Int }) capacity: number,
        @Args('amenities', { type: () => GraphQLJSONObject, nullable: true }) amenities?: any,
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        return this.venueService.createSpacePreset({
            name,
            type,
            capacity,
            amenities
        });
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteSpacePreset(
        @GqlUser() user: any,
        @Args('id') id: string
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        await this.venueService.removeSpacePreset(id);
        return true;
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteSpace(
        @GqlUser() user: any,
        @Args('id') id: string
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        await this.venueService.removeSpace(id);
        return true;
    }

    @ResolveField('spaces', () => [Space])
    async getSpaces(@Parent() venue: Venue) {
        return this.venueService.findSpaces(venue.id);
    }

    @ResolveField('slots', () => [SpaceSlot])
    async getSlots(@Parent() space: Space) {
        return this.venueService.findSpaceSlots(space.id);
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
