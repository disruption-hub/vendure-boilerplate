#!/bin/bash
# Safe execution of WhatsApp contact cleanup
# This script shows what would be deleted before actually doing it

echo "========================================="
echo "WhatsApp Contact Cleanup - DRY RUN"
echo "========================================="
echo ""
echo "Step 1: Finding duplicate contacts..."
echo ""

# Get database URL from environment or .env file
if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found"
  echo "Please set DATABASE_URL environment variable or add it to .env file"
  exit 1
fi

# Dry run - show what would be affected
psql "$DATABASE_URL" << 'EOSQL'
\echo '=== Duplicate Contacts Found ==='
SELECT 
    phone,
    "tenantId",
    COUNT(*) as duplicate_count,
    array_agg(id) as contact_ids,
    array_agg("displayName") as names,
    array_agg("createdAt"::text) as created_dates
FROM chatbot_contacts
WHERE phone IS NOT NULL
  AND type = 'CONTACT'
GROUP BY phone, "tenantId"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

\echo ''
\echo '=== Summary ==='
SELECT 
    COUNT(DISTINCT phone) as unique_duplicate_phones,
    SUM(cnt - 1) as total_duplicates_to_remove
FROM (
    SELECT phone, COUNT(*) as cnt
    FROM chatbot_contacts
    WHERE phone IS NOT NULL AND type = 'CONTACT'
    GROUP BY phone, "tenantId"
    HAVING COUNT(*) > 1
) subq;
EOSQL

echo ""
echo "========================================="
echo "Dry run complete!"
echo "========================================="
echo ""
echo "If you want to proceed with cleanup, run:"
echo "  ./scripts/cleanup-duplicates-confirm.sh"
echo ""
