import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PassService } from '../modules/pass/pass.service';
import { Pass } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Resolver(() => Pass)
export class PassResolver {
    constructor(private readonly passService: PassService) { }

    @Query(() => [Pass])
    @UseGuards(JwtAuthGuard)
    async myPasses(@Context() context) {
        const req = context.req;
        // We use zkeyId for identifying the user in our system
        return this.passService.findUserPasses(req.user.zkeyId);
    }
}
