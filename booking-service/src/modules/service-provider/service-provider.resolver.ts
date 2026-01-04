import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceProviderService } from './service-provider.service';
import { ServiceProvider } from '../../graphql/types';
import { GqlUser } from '../../graphql/decorators';

@Resolver(() => ServiceProvider)
export class ServiceProviderResolver {
    constructor(private readonly serviceProviderService: ServiceProviderService) { }

    @Query(() => ServiceProvider, { nullable: true })
    @UseGuards(JwtAuthGuard)
    async myProviderProfile(@GqlUser() user: any) {
        // Find provider by user ID
        return this.serviceProviderService.findAll().then(all =>
            all.find(p => p.user?.id === user.sub || p.userId === user.sub)
        );
    }

    @Mutation(() => ServiceProvider)
    @UseGuards(JwtAuthGuard)
    async updateMyProviderProfile(
        @GqlUser() user: any,
        @Args('bio', { nullable: true }) bio?: string,
        @Args('specialties', { type: () => [String], nullable: true }) specialties?: string[],
    ) {
        const provider = await this.serviceProviderService.findAll().then(all =>
            all.find(p => p.user?.id === user.sub || p.userId === user.sub)
        );

        if (!provider) {
            throw new Error('Service Provider profile not found for this user');
        }

        const updateData: any = {};
        if (bio !== undefined) updateData.bio = bio;
        if (specialties !== undefined) updateData.specialties = specialties;

        return this.serviceProviderService.update(provider.id, updateData);
    }
}
