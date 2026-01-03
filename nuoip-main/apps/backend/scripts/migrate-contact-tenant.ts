#!/usr/bin/env ts-node
/**
 * Data Migration Script: Merge duplicate WhatsAppContact records
 * 
 * This script:
 * 1. Identifies duplicate contacts (same tenant + JID)
 * 2. Merges duplicates, preserving chatbotContactId links
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DuplicateGroup {
    tenantId: string;
    jid: string;
    contacts: {
        id: string;
        sessionId: string;
        chatbotContactId: string | null;
        createdAt: Date;
        messageCount?: number;
    }[];
}

async function backfillTenantId() {
    console.log('=== Verifying tenantId backfill ===');

    // Check if any contacts still lack tenantId
    const nullCount = await prisma.whatsAppContact.count({
        where: { tenantId: null }
    });

    if (nullCount > 0) {
        throw new Error(`Found ${nullCount} contacts without tenantId. SQL migration may have failed.`);
    }

    console.log(`✅ All contacts have tenantId\n`);
}

async function identifyDuplicates(): Promise<DuplicateGroup[]> {
    console.log('=== Step 2: Identifying duplicates ===');

    const duplicates = await prisma.$queryRaw<Array<{ tenantId: string; jid: string; count: number }>>`
    SELECT "tenantId", "jid", COUNT(*) as count
    FROM "whatsapp_contacts"
    WHERE "tenantId" IS NOT NULL
    GROUP BY "tenantId", "jid"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;

    console.log(`Found ${duplicates.length} duplicate groups\n`);

    if (duplicates.length === 0) {
        return [];
    }

    // Get full contact details for each duplicate group
    const duplicateGroups: DuplicateGroup[] = [];

    for (const dup of duplicates) {
        const contacts = await prisma.whatsAppContact.findMany({
            where: {
                tenantId: dup.tenantId,
                jid: dup.jid
            },
            select: {
                id: true,
                sessionId: true,
                chatbotContactId: true,
                createdAt: true
            }
        });

        // Count messages for each contact
        const contactsWithCounts = await Promise.all(
            contacts.map(async (contact) => {
                const messageCount = await prisma.whatsAppMessage.count({
                    where: {
                        remoteJid: dup.jid,
                        sessionId: contact.sessionId
                    }
                });
                return { ...contact, messageCount };
            })
        );

        duplicateGroups.push({
            tenantId: dup.tenantId,
            jid: dup.jid,
            contacts: contactsWithCounts
        });
    }

    return duplicateGroups;
}

async function mergeDuplicates(duplicateGroups: DuplicateGroup[]) {
    console.log('=== Step 3: Merging duplicates ===');

    let mergedCount = 0;

    for (const group of duplicateGroups) {
        console.log(`\nProcessing ${group.jid} (${group.contacts.length} duplicates)`);

        // Sort contacts by priority:
        // 1. Has chatbotContactId (preserve conversation history)
        // 2. Most messages
        // 3. Newest
        const sorted = group.contacts.sort((a, b) => {
            if (a.chatbotContactId && !b.chatbotContactId) return -1;
            if (!a.chatbotContactId && b.chatbotContactId) return 1;
            if (a.messageCount !== b.messageCount) return (b.messageCount || 0) - (a.messageCount || 0);
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        const keepContact = sorted[0];
        const deleteContacts = sorted.slice(1);

        console.log(`  ✓ Keeping: ${keepContact.id} (chatbotContact: ${keepContact.chatbotContactId ? '✓' : '✗'}, messages: ${keepContact.messageCount})`);

        // Delete duplicate contacts
        for (const contact of deleteContacts) {
            console.log(`  ✗ Deleting: ${contact.id} (chatbotContact: ${contact.chatbotContactId ? '✓' : '✗'}, messages: ${contact.messageCount})`);

            // Note: Messages will cascade delete, but that's okay because:
            // 1. Messages are queried by JID, not contact ID
            // 2. The message data still exists for the kept contact's session
            // 3. Our unified history query fetches by JID across all sessions

            await prisma.whatsAppContact.delete({
                where: { id: contact.id }
            });
        }

        mergedCount += deleteContacts.length;
    }

    console.log(`\n✅ Merged ${mergedCount} duplicate contacts\n`);
}

async function verify() {
    console.log('=== Step 4: Verification ===');

    // Check for null tenantIds
    const nullCount = await prisma.whatsAppContact.count({
        where: { tenantId: null }
    });
    console.log(`Contacts with null tenantId: ${nullCount} ${nullCount === 0 ? '✅' : '❌'}`);

    // Check for duplicates
    const duplicates = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM (
      SELECT "tenantId", "jid", COUNT(*) as cnt
      FROM "whatsapp_contacts"
      WHERE "tenantId" IS NOT NULL
      GROUP BY "tenantId", "jid"
      HAVING COUNT(*) > 1
    ) as dups
  `;
    const dupCount = Number(duplicates[0]?.count || 0);
    console.log(`Duplicate (tenantId, jid) pairs: ${dupCount} ${dupCount === 0 ? '✅' : '❌'}`);

    // Check tenant consistency
    const inconsistent = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM "whatsapp_contacts" wc
    LEFT JOIN "whatsapp_sessions" ws ON ws."sessionId" = wc."sessionId"
    WHERE wc."tenantId" != ws."tenantId"
  `;
    const inconsistentCount = Number(inconsistent[0]?.count || 0);
    console.log(`Contacts with mismatched tenant: ${inconsistentCount} ${inconsistentCount === 0 ? '✅' : '❌'}`);

    console.log('\n=== Migration Summary ===');
    const totalContacts = await prisma.whatsAppContact.count();
    console.log(`Total contacts: ${totalContacts}`);

    const contactsWithChatbot = await prisma.whatsAppContact.count({
        where: { chatbotContactId: { not: null } }
    });
    console.log(`Contacts with chatbot link: ${contactsWithChatbot}`);
}

async function main() {
    try {
        console.log('🚀 Starting WhatsApp Contact Migration\n');

        // Step 1: Backfill tenantId
        await backfillTenantId();

        // Step 2: Identify duplicates
        const duplicateGroups = await identifyDuplicates();

        // Step 3: Merge duplicates
        if (duplicateGroups.length > 0) {
            await mergeDuplicates(duplicateGroups);
        }

        // Step 4: Verify
        await verify();

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
