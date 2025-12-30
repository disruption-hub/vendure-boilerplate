import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import fs from 'fs';
import path from 'path';

const assetDir = (config.plugins?.find(p => (p as any).options?.assetUploadDir) as any)?.options?.assetUploadDir;
if (assetDir) {
    if (!fs.existsSync(assetDir)) {
        console.log(`[Server] Creating asset directory: ${assetDir}`);
        fs.mkdirSync(assetDir, { recursive: true });
    }
    console.log(`[Server] Assets directory: ${assetDir}`);
}

runMigrations(config)
    .then(() => bootstrap(config))
    .catch(err => {
        console.log(err);
    });
