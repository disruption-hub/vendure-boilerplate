
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module'; // Adjust import path
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import type { AuthenticationState, SignalDataTypeMap, AuthenticationCreds } from '@whiskeysockets/baileys';
import { randomUUID } from 'crypto';
import { PrismaService as GlobalPrismaService } from '../../../prisma/prisma.service'; // Use the global one for now to match imports

/**
 * PostgreSQL-backed auth state provider for Baileys
 * Uses WhatsAppSessionKey table for storing keys individually
 */
export class PostgreSQLAuthStateProvider {
    constructor(
        private readonly prisma: GlobalPrismaService,
        private readonly sessionId: string,
    ) { }

    async useAuthState(): Promise<{
        state: AuthenticationState
        saveCreds: () => Promise<void>
    }> {
        console.log(`[AuthStateProvider] Initializing auth state for session ${this.sessionId}`)

        const session = await this.prisma.whatsAppSession.findUnique({
            where: { sessionId: this.sessionId },
            select: { creds: true },
        })

        console.log(`[AuthStateProvider] Session found: ${!!session}, has creds: ${!!(session?.creds && typeof session.creds === 'object' && Object.keys(session.creds as any).length > 0)}`)

        let creds: AuthenticationCreds
        if (session?.creds && typeof session.creds === 'object' && Object.keys(session.creds as any).length > 0) {
            console.log(`[AuthStateProvider] Using existing credentials`)
            creds = JSON.parse(JSON.stringify(session.creds), BufferJSON.reviver)
        } else {
            console.log(`[AuthStateProvider] No existing credentials, initializing new ones`)
            creds = initAuthCreds()
        }

        console.log(`[AuthStateProvider] Creds initialized. Has signedIdentityKey: ${!!creds.signedIdentityKey}, Has signedPreKey: ${!!creds.signedPreKey}`)

        const saveCreds = async () => {
            try {
                const serializedCreds = JSON.parse(JSON.stringify(creds, BufferJSON.replacer))
                await this.prisma.whatsAppSession.update({
                    where: { sessionId: this.sessionId },
                    data: { creds: serializedCreds },
                })
                console.log(`[AuthStateProvider] Credentials saved for session ${this.sessionId}`)
            } catch (error) {
                console.error(`[AuthStateProvider] Error saving creds for session ${this.sessionId}:`, error)
            }
        }

        return {
            state: {
                creds,
                keys: {
                    get: async (type, ids) => {
                        console.log(`[AuthStateProvider] keys.get called: type=${type}, ids=${ids.join(',')}`)
                        const keys: { [id: string]: SignalDataTypeMap[typeof type] } = {}
                        try {
                            const storedKeys = await this.prisma.whatsAppSessionKey.findMany({
                                where: {
                                    sessionId: this.sessionId,
                                    type,
                                    keyId: { in: ids },
                                },
                            })

                            console.log(`[AuthStateProvider] Found ${storedKeys.length} stored keys for type=${type}`)

                            for (const key of storedKeys) {
                                if (key.data) {
                                    keys[key.keyId] = JSON.parse(JSON.stringify(key.data), BufferJSON.reviver)
                                }
                            }
                        } catch (error) {
                            console.error(`[AuthStateProvider] Error fetching keys for session ${this.sessionId}:`, error)
                        }
                        return keys
                    },
                    set: async (data) => {
                        const tasks: Promise<any>[] = []

                        for (const category in data) {
                            for (const id in data[category]) {
                                const value = data[category][id]
                                const keyId = id
                                const type = category

                                if (value) {
                                    const serializedData = JSON.parse(JSON.stringify(value, BufferJSON.replacer))
                                    tasks.push(
                                        this.prisma.whatsAppSessionKey.upsert({
                                            where: {
                                                sessionId_type_keyId: {
                                                    sessionId: this.sessionId,
                                                    type,
                                                    keyId,
                                                },
                                            },
                                            create: {
                                                id: randomUUID(),
                                                sessionId: this.sessionId,
                                                type,
                                                keyId,
                                                data: serializedData,
                                                updatedAt: new Date(),
                                            } as any,
                                            update: {
                                                data: serializedData,
                                            },
                                        })
                                    )
                                } else {
                                    tasks.push(
                                        this.prisma.whatsAppSessionKey.deleteMany({
                                            where: {
                                                sessionId: this.sessionId,
                                                type,
                                                keyId,
                                            },
                                        })
                                    )
                                }
                            }
                        }

                        try {
                            await Promise.all(tasks)
                        } catch (error) {
                            console.error(`[AuthStateProvider] Error saving keys for session ${this.sessionId}:`, error)
                        }
                    },
                },
            },
            saveCreds,
        }
    }
}
