#!/usr/bin/env node
const path = require('path');

// Register ts-node with explicit CJS override
try {
    require('ts-node').register({
        project: path.resolve(__dirname, '../tsconfig.json'),
        transpileOnly: true,
        compilerOptions: {
            module: 'commonjs'
        }
    });
} catch (e) {
    // If ts-node is not found in root, try backend local (though we know it's in root)
    console.error('Failed to register ts-node:', e);
    process.exit(1);
}

// Load the require hook for path aliases
require('./require-hook.js');

// Run the worker
console.log('🚀 Launching Baileys Worker via run-worker.js...');
require('./baileys-worker-standalone.ts');
