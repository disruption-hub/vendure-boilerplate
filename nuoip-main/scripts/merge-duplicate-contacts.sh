#!/bin/bash
# Script: Merge duplicate WhatsAppContacts
# Run: railway run --environment production -- bash scripts/merge-duplicate-contacts.sh

set -e

echo "🔍 Checking for duplicate contacts..."

# Run the merge SQL script
psql "$DATABASE_URL" -f packages/prisma/migrations/merge_duplicate_contacts.sql

echo ""
echo "✅ Duplicate merge complete!"
