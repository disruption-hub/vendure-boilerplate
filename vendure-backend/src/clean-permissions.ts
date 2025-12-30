import { bootstrap, RoleService, Permission, RequestContextService } from '@vendure/core';
import path from 'path';
import { config } from './vendure-config';

async function cleanPermissions() {
    // If DB_HOST is internal and fails, we might want to override it with a public one provided via env
    const dbOptions = config.dbConnectionOptions as any;
    const dbHost = process.env.CLEANUP_DB_HOST || dbOptions.host;

    // Modify config to remove plugins that cause issues during remote cleanup
    const cleanupConfig = {
        ...config,
        dbConnectionOptions: {
            ...dbOptions,
            host: dbHost,
            // Ensure we use the correct port for public access if needed
            port: process.env.CLEANUP_DB_PORT ? parseInt(process.env.CLEANUP_DB_PORT) : dbOptions.port,
        },
        plugins: (config.plugins || []).filter(p => {
            // Remove AssetServerPlugin and AdminUiPlugin to avoid path/port issues
            const name = (p as any).name || p.constructor.name;
            return name !== 'AssetServerPlugin' && name !== 'AdminUiPlugin';
        })
    };

    console.log(`Bostrapping with DB Host: ${dbHost}`);

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
