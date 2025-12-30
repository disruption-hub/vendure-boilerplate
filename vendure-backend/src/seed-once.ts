import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { execSync } from 'child_process';
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';
import { dbSeeded } from './db-setup';
import { populate } from '@vendure/core/cli';

const seedDb = async () => {
  // Rebuild native modules like bcrypt that may have issues on different platforms
  console.log('Rebuilding native modules...');
  try {
    execSync('npm rebuild bcrypt', { stdio: 'inherit' });
    console.log('Native modules rebuilt successfully');
  } catch (error) {
    console.warn('Failed to rebuild native modules, continuing anyway:', (error as Error).message);
  }
  const dbAlreadySeeded = await dbSeeded(config.dbConnectionOptions);
  const assetDir = process.env.ASSET_VOLUME_PATH || path.resolve(process.cwd(), 'static/assets');
  const assetsExist = fs.existsSync(assetDir) && fs.readdirSync(assetDir).length > 0;

  if (dbAlreadySeeded && assetsExist) {
    console.log('Database already seeded and assets exist, skipping...');
    process.exit(0);
  }

  if (dbAlreadySeeded && !assetsExist) {
    console.log('Database seeded but assets are missing. We should ideally re-download them.');
    // In this case, we might not want to run populate again as it might duplicate data.
    // However, for a quick fix, we can allow it to fall through if we are careful, 
    // but populate() is destructive if synchronize is true.
    // Let's just log it for now and suggest a volume.
    console.log('Please consider using a Persistent Volume for "static/assets" on Railway.');
  }
  const updatedConfig = {
    ...config,
    dbConnectionOptions: {
      ...config.dbConnectionOptions,
      synchronize: !dbAlreadySeeded,
    },
  };

  try {
    console.log('Starting database population...');
    const initialDataPath = path.join(require.resolve('@vendure/create'), '../assets/initial-data.json');
    console.log('Initial data path:', initialDataPath);

    const initialData = require(initialDataPath);
    console.log('Initial data loaded, contains:', Object.keys(initialData));

    const app = await populate(() => bootstrap(updatedConfig), initialData);
    console.log('Population completed successfully');
    await app.close();
    console.log('Database seeding completed');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

const reportDeploy = async () => {
  const url = process.env.TEMPLATE_REPORTER_URL;
  if (!url) {
    return;
  }
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const templateId = 'vendure';
  const payload = { projectId, templateId };
  try {
    await axios.post(`${url}/api/projectDeployed`, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error(`An error occurred: ${(error as any).message}`);
  }
};

seedDb();
reportDeploy();
