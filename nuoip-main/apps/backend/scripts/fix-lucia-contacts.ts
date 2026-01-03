import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { PrismaService } from '../src/prisma/prisma.service'

const prisma = new PrismaService()

async function fixLuciaContacts() {
    try {
        console.log('🔧 Fixing Lucia Meza contacts...')

        const userId = 'cmhiw2xo70005ji04092hf2nb' // Lucia Meza
        const matMaxId = 'cmigbet91001o01qazey1ydh3'
        const albertoId = 'cmip7o3dt001901qv0vxxcfj7'
        const jid = '51916172368@s.whatsapp.net'

        // 1. Link WhatsAppContact to User
        console.log(`Linking WhatsAppContact ${jid} to User ${userId}...`)
        const updateResult = await prisma.whatsAppContact.updateMany({
            where: { jid: jid },
            data: {
                userId: userId,
                chatbotContactId: null
            }
        })
        console.log(`Updated ${updateResult.count} WhatsAppContacts.`)

        // 2. Clear WhatsApp metadata from other contacts to prevent frontend duplicates
        console.log(`Clearing WhatsApp metadata from other contacts...`)

        // Helper to clear metadata
        const clearMetadata = async (id: string, name: string) => {
            const contact = await prisma.chatbotContact.findUnique({ where: { id } })
            if (contact?.metadata && typeof contact.metadata === 'object') {
                const newMeta = { ...contact.metadata as any }
                delete newMeta.whatsappJid
                delete newMeta.whatsappSessionId

                await prisma.chatbotContact.update({
                    where: { id },
                    data: { metadata: newMeta }
                })
                console.log(`Cleared metadata for ${name}`)
            }
        }

        await clearMetadata(matMaxId, 'MatMax')
        await clearMetadata(albertoId, 'Alberto Saco')

        console.log('✅ Fix complete!')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

fixLuciaContacts()
