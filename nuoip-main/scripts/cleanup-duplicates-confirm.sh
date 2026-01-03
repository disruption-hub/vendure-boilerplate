#!/bin/bash
# ACTUAL cleanup - only run after reviewing dry-run results
# This will DELETE duplicate contacts!

echo "========================================="
echo "⚠️  WhatsApp Contact Cleanup - LIVE RUN ⚠️"  
echo "========================================="
echo ""
echo "This will DELETE duplicate contacts!"
echo ""
read -p "Have you reviewed the dry-run results? (yes/no): " confirm1

if [ "$confirm1" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

read -p "Do you have a database backup? (yes/no): " confirm2

if [ "$confirm2" != "yes" ]; then
  echo "Please backup your database first!"
  exit 0
fi

read -p "Type 'DELETE DUPLICATES' to confirm: " confirm3

if [ "$confirm3" != "DELETE DUPLICATES" ]; then
  echo "Cancelled."
  exit 0
fi

# Get database URL
if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found"
  exit 1
fi

echo ""
echo "Executing cleanup..."
echo ""

# Execute the cleanup
psql "$DATABASE_URL" << 'EOSQL'
DO $$
DECLARE
    duplicate_phone RECORD;
    keep_id TEXT;
    duplicate_ids TEXT[];
    removed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Starting Cleanup ===';
    
    -- Loop through all duplicate phone numbers
    FOR duplicate_phone IN 
        SELECT phone, "tenantId"
        FROM chatbot_contacts
        WHERE phone IS NOT NULL AND type = 'CONTACT'
        GROUP BY phone, "tenantId"
        HAVING COUNT(*) > 1
    LOOP
        -- Get the oldest contact ID to keep
        SELECT id INTO keep_id
        FROM chatbot_contacts
        WHERE phone = duplicate_phone.phone
          AND "tenantId" = duplicate_phone."tenantId"
          AND type = 'CONTACT'
        ORDER BY "createdAt" ASC
        LIMIT 1;
        
        -- Get all duplicate IDs  
        SELECT array_agg(id) INTO duplicate_ids
        FROM chatbot_contacts
        WHERE phone = duplicate_phone.phone
          AND "tenantId" = duplicate_phone."tenantId"
          AND type = 'CONTACT'
          AND id != keep_id;
        
        RAISE NOTICE 'Phone: % | Keeping: % | Removing: % duplicates', 
            duplicate_phone.phone, keep_id, array_length(duplicate_ids, 1);
        
        -- Update WhatsAppContact references
        UPDATE whatsapp_contacts
        SET "chatbotContactId" = keep_id
        WHERE "chatbotContactId" = ANY(duplicate_ids);
        
        -- Delete duplicates
        DELETE FROM chatbot_contacts
        WHERE id = ANY(duplicate_ids);
        
        removed_count := removed_count + array_length(duplicate_ids, 1);
    END LOOP;
    
    RAISE NOTICE '=== Cleanup Complete ===';
    RAISE NOTICE 'Total duplicates removed: %', removed_count;
END $$;
EOSQL

echo ""
echo "========================================="
echo "✅ Cleanup complete!"
echo "========================================="
echo ""
