#!/bin/bash
# Migration Script: Add tenantId to WhatsAppContact
# Run this via Railway CLI: railway run --environment production -- bash scripts/migrate-add-tenant-to-contacts.sh

set -e  # Exit on error

echo "🚀 Starting WhatsAppContact tenantId migration..."
echo ""

# Step 1: Apply SQL migration (skip if already applied)
echo "=== Step 1: Checking if tenantId column exists ===" 
COLUMN_EXISTS=$(psql $DATABASE_URL -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_contacts' AND column_name='tenantId');")

if [ "$COLUMN_EXISTS" = "f" ]; then
    echo "Column doesn't exist, applying SQL migration..."
    psql $DATABASE_URL -f packages/prisma/migrations/manual_add_tenant_to_contacts.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ SQL migration completed"
    else
        echo "❌ SQL migration failed"
        exit 1
    fi
else
    echo "✅ tenantId column already exists, skipping SQL migration"
fi

echo ""

# Step 2: Run TypeScript migration for duplicates
echo "=== Step 2: Merging duplicate contacts ==="
cd apps/backend && npx ts-node --require tsconfig-paths/register scripts/migrate-contact-tenant.ts

if [ $? -eq 0 ]; then
    echo "✅ Duplicate merge completed"
else
    echo "❌ Duplicate merge failed"
    exit 1
fi

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Make tenantId required in schema"
echo "2. Add unique constraint [tenantId, jid]"
echo "3. Remove [sessionId, jid] unique constraint"
echo "4. Deploy updated schema"
