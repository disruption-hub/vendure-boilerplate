import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceService } from '../modules/service/service.service';
import { Service } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { GqlUser } from './decorators';

@Resolver(() => Service)
export class ServiceResolver {
    constructor(private readonly serviceService: ServiceService) { }

    @Query(() => [Service])
    async allServices() {
        return this.serviceService.findAll();
    }

    @Query(() => Service, { nullable: true })
    async service(@Args('id') id: string) {
        return this.serviceService.findOne(id);
    }

    @Mutation(() => Service)
    @UseGuards(JwtAuthGuard)
    async createService(
        @GqlUser() user: any,
        @Args('name') name: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('duration', { nullable: true }) duration?: number,
        @Args('price', { nullable: true }) price?: number,
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        return this.serviceService.create({
            name,
            description,
            durationMinutes: duration,
            defaultPrice: price,
        } as any);
    }

    @Mutation(() => Service)
    @UseGuards(JwtAuthGuard)
    async updateService(
        @GqlUser() user: any,
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('duration', { nullable: true }) duration?: number,
        @Args('price', { nullable: true }) price?: number,
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        return this.serviceService.update(id, {
            name,
            description,
            durationMinutes: duration,
            defaultPrice: price,
        } as any);
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteService(
        @GqlUser() user: any,
        @Args('id') id: string
    ) {
        if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
            throw new Error('Forbidden: Admin access required');
        }
        await this.serviceService.remove(id);
        return true;
    }
}
