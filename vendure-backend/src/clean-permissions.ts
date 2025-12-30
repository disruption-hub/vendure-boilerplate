import { bootstrap, RoleService, Permission, RequestContextService } from '@vendure/core';
import { config } from './vendure-config';

async function cleanPermissions() {
    const app = await bootstrap(config);
    const roleService = app.get(RoleService);
    const requestContextService = app.get(RequestContextService);

    // Create a superadmin context to perform the operation
    const ctx = await requestContextService.create({
        apiType: 'admin',
    });

    console.log('Cleaning up stale permissions...');

    const roles = await roleService.findAll(ctx);
    for (const role of roles.items) {
        if (role.permissions.includes('AllowInvoicesPermission' as any)) {
            console.log(`Removing AllowInvoicesPermission from role: ${role.code}`);
            const newPermissions = role.permissions.filter(p => p !== ('AllowInvoicesPermission' as any));
            await roleService.update(ctx, {
                id: role.id,
                permissions: newPermissions as Permission[],
            });
        }
    }

    console.log('Done!');
    process.exit(0);
}

cleanPermissions().catch(err => {
    console.error(err);
    process.exit(1);
});
