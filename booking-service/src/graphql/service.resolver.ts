import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceService } from '../modules/service/service.service';
import { Service } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

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
        @Args('name') name: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('duration', { nullable: true }) duration?: number,
        @Args('price', { nullable: true }) price?: number,
    ) {
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
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('description', { nullable: true }) description?: string,
        @Args('duration', { nullable: true }) duration?: number,
        @Args('price', { nullable: true }) price?: number,
    ) {
        return this.serviceService.update(id, {
            name,
            description,
            durationMinutes: duration,
            defaultPrice: price,
        } as any);
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteService(@Args('id') id: string) {
        await this.serviceService.remove(id);
        return true;
    }
}
