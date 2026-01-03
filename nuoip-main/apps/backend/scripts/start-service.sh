#!/bin/bash

# Script wrapper para determinar qué servicio ejecutar
# Detecta si debe ejecutar NestJS Backend o Baileys Worker basado en variable de entorno

set -e

# Cambiar al directorio raíz del proyecto
cd ../.. || exit 1

# Verificar variable de entorno para determinar qué servicio ejecutar
if [ "$SERVICE_TYPE" = "worker" ] || [ "$RAILWAY_SERVICE_NAME" = "Baileys Worker" ] || [ "$RAILWAY_SERVICE_NAME" = "nuoip-worker" ]; then
  echo "✅ Starting Baileys Worker (standalone - no NestJS)"
  export TS_NODE_PROJECT=apps/backend/tsconfig.json
  export TS_NODE_FILES=true
  export TS_NODE_TRANSPILE_ONLY=true
  export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'
  export NODE_PATH=.:packages:apps/backend/node_modules
  exec node apps/backend/scripts/run-worker.js
elif [ "$SERVICE_TYPE" = "backend" ] || [ "$RAILWAY_SERVICE_NAME" = "Nest Backend" ] || [ "$RAILWAY_SERVICE_NAME" = "nuoip" ]; then
  echo "✅ Starting NestJS Backend API"
  echo "=== Running Database Migrations ==="
  (cd packages/prisma && npx prisma migrate deploy --schema ./schema.prisma)
  export TS_NODE_PROJECT=apps/backend/tsconfig.json
  export TS_NODE_FILES=true
  export TS_NODE_TRANSPILE_ONLY=true
  export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'
  export NODE_PATH=.:packages:apps/backend/node_modules
  exec node -r ./apps/backend/scripts/require-hook.js -r ts-node/register -r tsconfig-paths/register apps/backend/dist/main.js
else
  # Fallback: detect by checking if main.js exists (NestJS) or use worker
  if [ -f "apps/backend/dist/main.js" ]; then
    echo "⚠️  No SERVICE_TYPE set, but main.js exists - defaulting to NestJS Backend"
    echo "⚠️  To run Baileys Worker, set SERVICE_TYPE=worker"
    export TS_NODE_PROJECT=apps/backend/tsconfig.json
    export TS_NODE_FILES=true
    export TS_NODE_TRANSPILE_ONLY=true
    export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'
    export NODE_PATH=.:packages:apps/backend/node_modules
    exec node -r ./apps/backend/scripts/require-hook.js -r ts-node/register -r tsconfig-paths/register apps/backend/dist/main.js
  else
    echo "✅ No main.js found - starting Baileys Worker"
    export TS_NODE_PROJECT=apps/backend/tsconfig.json
    export TS_NODE_FILES=true
    export TS_NODE_TRANSPILE_ONLY=true
    export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'
    export NODE_PATH=.:packages:apps/backend/node_modules
    exec node apps/backend/scripts/run-worker.js
  fi
fi
