import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { BookingProfileService } from './booking-profile.service';
import { BookingProfile } from '../../graphql/types';
import GraphQLJSON from 'graphql-type-json';
import { Prisma } from '@prisma/booking-client';
import { GqlUser } from '../../graphql/decorators';

@Resolver(() => BookingProfile)
export class BookingProfileResolver {
    constructor(private readonly bookingProfileService: BookingProfileService) { }

    @Query(() => [BookingProfile])
    @UseGuards(JwtAuthGuard)
    async allBookingProfiles() {
        return this.bookingProfileService.findAll();
    }

    @Mutation(() => BookingProfile)
    @UseGuards(JwtAuthGuard)
    async createBookingProfile(
        @GqlUser() user: any,
        @Args('name') name: string,
        @Args('slug') slug: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('metrics', { type: () => GraphQLJSON, nullable: true }) metrics?: any,
        @Args('uiConfig', { type: () => GraphQLJSON, nullable: true }) uiConfig?: any,
    ) {
        if (!user.roles.includes('system-admin')) {
            throw new Error('Forbidden: System Admin only');
        }
        try {
            return await this.bookingProfileService.create({
                name,
                slug,
                description,
                metrics: metrics ?? Prisma.JsonNull,
                uiConfig: uiConfig ?? Prisma.JsonNull,
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error(`Conflict: A blueprint with slug "${slug}" already exists`);
            }
            throw new Error(`Failed to create blueprint: ${error.message}`);
        }
    }

    @Mutation(() => BookingProfile)
    @UseGuards(JwtAuthGuard)
    async updateBookingProfile(
        @GqlUser() user: any,
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('slug', { nullable: true }) slug?: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('metrics', { type: () => GraphQLJSON, nullable: true }) metrics?: any,
        @Args('uiConfig', { type: () => GraphQLJSON, nullable: true }) uiConfig?: any,
    ) {
        if (!user.roles.includes('system-admin')) {
            throw new Error('Forbidden: System Admin only');
        }
        return this.bookingProfileService.update(id, {
            name,
            slug,
            description,
            metrics: metrics ?? undefined,
            uiConfig: uiConfig ?? undefined,
        });
    }

    @Mutation(() => BookingProfile)
    @UseGuards(JwtAuthGuard)
    async deleteBookingProfile(
        @GqlUser() user: any,
        @Args('id') id: string,
    ) {
        if (!user.roles.includes('system-admin')) {
            throw new Error('Forbidden: System Admin only');
        }
        return this.bookingProfileService.remove(id);
    }
}
