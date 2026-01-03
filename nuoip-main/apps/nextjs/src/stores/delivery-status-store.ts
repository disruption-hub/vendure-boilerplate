import { createWithEqualityFn } from 'zustand/traditional'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface MessageDeliveryStatus {
    messageId: string
    contactId: string
    deliveryStatus?: 'scheduled' | 'sending' | 'sent' | 'delivered' | 'read'
    deliveredAt?: string | null
    readAt?: string | null
    updatedAt: string
}

interface DeliveryStatusStore {
    // Map of messageId -> delivery status
    deliveryStatuses: Record<string, MessageDeliveryStatus>

    // Update delivery status for a message
    updateDeliveryStatus: (
        messageId: string,
        contactId: string,
        updates: {
            deliveryStatus?: MessageDeliveryStatus['deliveryStatus']
            deliveredAt?: Date | string | null
            readAt?: Date | string | null
        }
    ) => void

    // Get delivery status for a message
    getDeliveryStatus: (messageId: string) => MessageDeliveryStatus | null

    // Get all delivery statuses for a contact
    getContactDeliveryStatuses: (contactId: string) => MessageDeliveryStatus[]

    // Clear old delivery statuses (older than X days)
    clearOldStatuses: (daysToKeep?: number) => void

    // Clear all delivery statuses
    clearAll: () => void
}

const DEFAULT_DAYS_TO_KEEP = 7

export const useDeliveryStatusStore = createWithEqualityFn<DeliveryStatusStore>()(
    persist(
        (set, get) => ({
            deliveryStatuses: {},

            updateDeliveryStatus: (messageId, contactId, updates) => {
                set((state) => {
                    const existing = state.deliveryStatuses[messageId]
                    const now = new Date().toISOString()

                    const updatedStatus: MessageDeliveryStatus = {
                        messageId,
                        contactId,
                        deliveryStatus: updates.deliveryStatus ?? existing?.deliveryStatus,
                        deliveredAt: updates.deliveredAt
                            ? typeof updates.deliveredAt === 'string'
                                ? updates.deliveredAt
                                : updates.deliveredAt.toISOString()
                            : existing?.deliveredAt,
                        readAt: updates.readAt
                            ? typeof updates.readAt === 'string'
                                ? updates.readAt
                                : updates.readAt.toISOString()
                            : existing?.readAt,
                        updatedAt: now,
                    }

                    return {
                        deliveryStatuses: {
                            ...state.deliveryStatuses,
                            [messageId]: updatedStatus,
                        },
                    }
                })
            },

            getDeliveryStatus: (messageId) => {
                return get().deliveryStatuses[messageId] ?? null
            },

            getContactDeliveryStatuses: (contactId) => {
                const statuses = get().deliveryStatuses
                return Object.values(statuses).filter((status) => status.contactId === contactId)
            },

            clearOldStatuses: (daysToKeep = DEFAULT_DAYS_TO_KEEP) => {
                const cutoffDate = new Date()
                cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
                const cutoffTime = cutoffDate.getTime()

                set((state) => {
                    const filtered: Record<string, MessageDeliveryStatus> = {}

                    Object.entries(state.deliveryStatuses).forEach(([messageId, status]) => {
                        const updatedTime = new Date(status.updatedAt).getTime()
                        if (updatedTime >= cutoffTime) {
                            filtered[messageId] = status
                        }
                    })

                    return { deliveryStatuses: filtered }
                })
            },

            clearAll: () => {
                set({ deliveryStatuses: {} })
            },
        }),
        {
            name: 'delivery-status-storage',
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : undefined!)),
            // Only persist the deliveryStatuses
            partialize: (state) => ({
                deliveryStatuses: state.deliveryStatuses,
            }),
            // Auto-cleanup old statuses on rehydration
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.clearOldStatuses()
                }
            },
        }
    )
)
