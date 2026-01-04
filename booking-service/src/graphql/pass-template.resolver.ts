import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PassService } from '../modules/pass/pass.service';
import { PassTemplate } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Resolver(() => PassTemplate)
export class PassTemplateResolver {
    constructor(private readonly passService: PassService) { }

    @Query(() => [PassTemplate])
    async allPassTemplates() {
        return this.passService.findAllTemplates();
    }

    @Query(() => PassTemplate, { nullable: true })
    async passTemplate(@Args('id') id: string) {
        return this.passService.findOneTemplate(id);
    }

    @Mutation(() => PassTemplate)
    @UseGuards(JwtAuthGuard)
    async createPassTemplate(
        @Args('name') name: string,
        @Args('type') type: string,
        @Args('creditsAmount', { type: () => Int, nullable: true }) creditsAmount?: number,
        @Args('unlimited', { type: () => Boolean, defaultValue: false }) unlimited: boolean = false,
        @Args('validDurationDays', { type: () => Int, nullable: true }) validDurationDays?: number,
    ) {
        return this.passService.createTemplate({
            name,
            type: type as any,
            creditsAmount,
            unlimited,
            validDurationDays,
        });
    }

    @Mutation(() => PassTemplate)
    @UseGuards(JwtAuthGuard)
    async updatePassTemplate(
        @Args('id') id: string,
        @Args('name', { nullable: true }) name?: string,
        @Args('type', { nullable: true }) type?: string,
        @Args('creditsAmount', { type: () => Int, nullable: true }) creditsAmount?: number,
        @Args('unlimited', { type: () => Boolean, nullable: true }) unlimited?: boolean,
        @Args('validDurationDays', { type: () => Int, nullable: true }) validDurationDays?: number,
    ) {
        return this.passService.updateTemplate(id, {
            name,
            type: type as any,
            creditsAmount,
            unlimited,
            validDurationDays,
        });
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deletePassTemplate(@Args('id') id: string) {
        await this.passService.removeTemplate(id);
        return true;
    }
}
