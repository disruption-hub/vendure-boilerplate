import { bootstrap, RoleService, Permission, RequestContextService } from '@vendure/core';
import path from 'path';
import { config } from './vendure-config';

async function cleanPermissions() {
    // Modify config to remove plugins that cause issues during remote cleanup
    const cleanupConfig = {
        ...config,
        plugins: (config.plugins || []).filter(p => {
            // Remove AssetServerPlugin and AdminUiPlugin to avoid path/port issues
            const name = (p as any).name || p.constructor.name;
            return name !== 'AssetServerPlugin' && name !== 'AdminUiPlugin';
        })
    };

    const app = await bootstrap(cleanupConfig);
    const roleService = app.get(RoleService);
    const requestContextService = app.get(RequestContextService);

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
