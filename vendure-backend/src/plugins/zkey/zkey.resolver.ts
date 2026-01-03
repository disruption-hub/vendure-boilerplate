import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    CustomerService,
    ExternalAuthenticationService,
    Permission,
    RequestContext,
    TransactionalConnection,
    Logger,
    Customer,
    User,
} from '@vendure/core';

@Resolver()
export class ZKeyResolver {
    constructor(
        private customerService: CustomerService,
        private externalAuthenticationService: ExternalAuthenticationService,
        private connection: TransactionalConnection,
    ) { }

    @Allow(Permission.UpdateCustomer, Permission.CreateCustomer)
    @Mutation()
    async syncZKeyUser(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: any },
    ) {
        const { input } = args;
        const { id, email, firstName, lastName, phoneNumber, walletAddress, vendureId, verified } = input;

        Logger.info(`[ZKeyPlugin] syncZKeyUser: ID=${id}, Email=${email}, Wallet=${walletAddress}, Verified=${verified}`, 'ZKeyPlugin');

        const repo = this.connection.getRepository(ctx, Customer);
        let customerId: any;
        let needsRestore = false;
        let linkedUserId: any = undefined;

        // 1. Identify Target Customer/User
        let existingById: Customer | null = null;
        let existingByZKey: Customer | null = null;
        let existingByEmail: Customer | null = null;

        // Priority 0: Vendure ID (Golden Key)
        if (vendureId) {
            existingById = await repo.findOne({ where: { id: vendureId }, withDeleted: true, relations: ['user'] });
            if (existingById) Logger.info(`[ZKeyPlugin] Identified by Vendure ID: ${existingById.id}`, 'ZKeyPlugin');
        }

        // Priority 1: ZKey ID (zkeyInternalId)
        if (!existingById) {
            existingByZKey = await repo.findOne({
                where: { customFields: { zkeyInternalId: id } as any },
                withDeleted: true,
                relations: ['user']
            });
            if (existingByZKey) Logger.info(`[ZKeyPlugin] Identified by ZKey ID: ${existingByZKey.id}`, 'ZKeyPlugin');
        }

        // Priority 2: Email
        if (!existingById && !existingByZKey && email) {
            existingByEmail = await repo.findOne({ where: { emailAddress: email }, withDeleted: true, relations: ['user'] });
            if (existingByEmail) Logger.info(`[ZKeyPlugin] Identified by Email: ${existingByEmail.id}`, 'ZKeyPlugin');
        }

        const targetCustomer = existingById || existingByZKey || existingByEmail;

        if (targetCustomer) {
            customerId = targetCustomer.id;
            needsRestore = !!targetCustomer.deletedAt;
            linkedUserId = targetCustomer.user?.id;
        } else {
            // --- Creation or Orphaned User Link ---
            const userRepo = this.connection.getRepository(ctx, User);
            let existingUser = await userRepo.findOne({
                where: { authenticationMethods: { externalIdentifier: id, strategy: 'zkey' } } as any,
                relations: ['authenticationMethods'],
                withDeleted: true
            });

            if (!existingUser && email) {
                existingUser = await userRepo.findOne({ where: { identifier: email }, withDeleted: true });
            }

            if (existingUser) {
                Logger.info(`[ZKeyPlugin] Linking orphaned User ${existingUser.id} to new Customer`, 'ZKeyPlugin');
                if (existingUser.deletedAt) await userRepo.update(existingUser.id, { deletedAt: null });
                const newCustomer = await repo.save(new Customer({
                    emailAddress: email || '',
                    firstName: firstName || email?.split('@')[0] || '',
                    lastName: lastName || '',
                    phoneNumber: phoneNumber,
                    user: existingUser,
                    customFields: { zkeyInternalId: id, walletAddress: walletAddress } as any,
                    channels: [ctx.channel]
                }));
                customerId = newCustomer.id;
                linkedUserId = existingUser.id;
            } else {
                Logger.info(`[ZKeyPlugin] Creating new Customer & User for ${email}`, 'ZKeyPlugin');
                const user: any = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
                    strategy: 'zkey', externalIdentifier: id, verified: verified ?? true, emailAddress: email,
                    firstName: firstName || email?.split('@')[0] || '', lastName: lastName || '',
                } as any);
                const customer = await this.customerService.findOneByUserId(ctx, user.id);
                if (!customer) throw new Error('Failed to create customer');
                customerId = customer.id;
                linkedUserId = user.id;
            }
        }

        // 2. Restore if Soft-Deleted
        if (needsRestore && customerId) {
            Logger.info(`[ZKeyPlugin] Restoring soft-deleted customer ${customerId}`, 'ZKeyPlugin');
            await repo.update(customerId, { deletedAt: null });
            if (linkedUserId) {
                const userRepo = this.connection.getRepository(ctx, User);
                await userRepo.update(linkedUserId, { deletedAt: null });
            }
        }

        // 3. Update User Verification Status
        if (verified !== undefined && linkedUserId) {
            const userRepo = this.connection.getRepository(ctx, User);
            await userRepo.update(linkedUserId, { verified });
            Logger.info(`[ZKeyPlugin] Updated verification status for User ${linkedUserId} to ${verified}`, 'ZKeyPlugin');
        }

        // 4. Update Profile
        const updateInput: any = {
            id: customerId,
            emailAddress: email,
            firstName: firstName === undefined ? undefined : firstName,
            lastName: lastName === undefined ? undefined : lastName,
            phoneNumber: phoneNumber === undefined ? undefined : phoneNumber,
            customFields: {
                walletAddress: walletAddress === undefined ? undefined : walletAddress,
                // Only update ZKey ID if provided and not empty
                ...((id && id.trim() !== '') ? { zkeyInternalId: id } : {}),
            },
        };

        return this.customerService.update(ctx, updateInput);
    }

    @Allow(Permission.DeleteCustomer, Permission.UpdateCustomer)
    @Mutation()
    async deleteZKeyUser(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: string; email?: string },
    ) {
        const { id, email } = args;
        const repo = this.connection.getRepository(ctx, Customer);

        // 1. Try to find by ZKey ID (zkeyInternalId) - include deleted
        let customer = await repo.findOne({
            where: { customFields: { zkeyInternalId: id } as any },
            withDeleted: true
        });

        // 2. If not found, try to find by email - include deleted
        if (!customer && email) {
            customer = await repo.findOne({
                where: { emailAddress: email },
                withDeleted: true
            });
            if (customer) {
                Logger.info(`[ZKeyPlugin] Found customer ${customer.id} by email for deletion (ZKey ID mismatch or missing)`, 'ZKeyPlugin');
            }
        }

        if (customer) {
            // Idempotency: If already deleted, just return true
            if (customer.deletedAt) {
                Logger.info(`[ZKeyPlugin] Customer ${customer.id} is already deleted. Skipping.`, 'ZKeyPlugin');
                return true;
            }

            try {
                // Vendure soft-delete does NOT remove orders/transactions.
                // To ensure a future "reactivation" starts with a clean order history,
                // we anonymize fields that we use to match (email/logtoUserId/walletAddress)
                // so a new customer can be created on re-sync.
                const anonymizedEmail = `deleted-${id}-${Date.now()}@softdelete.record`;
                await this.customerService.update(ctx, {
                    id: customer.id,
                    emailAddress: anonymizedEmail,
                    firstName: '',
                    lastName: '',
                    phoneNumber: '',
                    customFields: {
                        walletAddress: null,
                        zkeyInternalId: null,
                    },
                } as any);

                // CRITICAL: We must also release the externalIdentifier (ZKey ID) from the User entity
                // otherwise re-creating this user will fail with "Identifier already exists"
                const linkedUser = await this.connection.getRepository(ctx, User).findOne({
                    where: { id: customer.user?.id },
                    relations: ['authenticationMethods']
                });

                if (linkedUser) {
                    const authMethod = linkedUser.authenticationMethods.find((m: any) => m.strategy === 'zkey');
                    if (authMethod) {
                        Logger.info(`[ZKeyPlugin] Releasing externalIdentifier for user ${linkedUser.id}`, 'ZKeyPlugin');
                        (authMethod as any).externalIdentifier = `deleted-${(authMethod as any).externalIdentifier}-${Date.now()}`;
                        await this.connection.getRepository(ctx, User).save(linkedUser);
                    }
                }

                await this.customerService.softDelete(ctx, customer.id);
                return true;
            } catch (error) {
                Logger.error(`[ZKeyPlugin] Create/Update failed during deletion for customer ${customer.id}: ${error instanceof Error ? error.message : error}`, 'ZKeyPlugin');
                // Return false to indicate failure, or throw?
                // Throwing allows dashboard to see the error.
                throw error;
            }
        }

        // If not found, technically it's "deleted" (doesn't exist), so return true
        Logger.info(`[ZKeyPlugin] Customer with ID ${id} or email ${email} not found. Considering deleted.`, 'ZKeyPlugin');
        return true;
    }

    @Allow(Permission.DeleteCustomer, Permission.UpdateCustomer)
    @Mutation()
    async hardDeleteZKeyUser(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: string; email?: string },
    ) {
        const { id, email } = args;
        const repo = this.connection.getRepository(ctx, Customer);
        const userRepo = this.connection.getRepository(ctx, User);

        // 1. Try to find by ZKey ID (zkeyInternalId) - include deleted
        let customer = await repo.findOne({
            where: { customFields: { zkeyInternalId: id } as any },
            withDeleted: true,
            relations: ['user']
        });

        // 2. If not found, try to find by email - include deleted
        if (!customer && email) {
            customer = await repo.findOne({
                where: { emailAddress: email },
                withDeleted: true,
                relations: ['user']
            });
            if (customer) {
                Logger.info(`[ZKeyPlugin] Found customer ${customer.id} by email for hard deletion`, 'ZKeyPlugin');
            }
        }

        if (customer) {
            const userId = customer.user?.id;
            try {
                Logger.warn(`[ZKeyPlugin] HARD DELETING customer ${customer.id} (Email: ${customer.emailAddress})`, 'ZKeyPlugin');

                // Hard delete Customer first
                await repo.delete(customer.id);

                // Hard delete User if exists
                if (userId) {
                    Logger.warn(`[ZKeyPlugin] HARD DELETING linked user ${userId}`, 'ZKeyPlugin');
                    await userRepo.delete(userId);
                }

                return true;
            } catch (error) {
                Logger.error(`[ZKeyPlugin] Hard deletion failed for customer ${customer.id}: ${error instanceof Error ? error.message : error}`, 'ZKeyPlugin');
                throw error;
            }
        }

        Logger.info(`[ZKeyPlugin] Customer with ID ${id} or email ${email} not found for hard deletion.`, 'ZKeyPlugin');
        return true;
    }
}
