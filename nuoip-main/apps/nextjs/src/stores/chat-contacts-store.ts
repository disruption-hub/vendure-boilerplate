'use client'

import { createWithEqualityFn } from 'zustand/traditional'
import { toast } from './toast-store'
import {
  loadContacts as loadContactsApi,
  createContact as createContactApi,
  createGroup as createGroupApi,
  updateContact as updateContactApi,
} from '@/modules/chatbot/client/chat-contacts-client'
import type { ChatContact } from '@/modules/chatbot/domain/contact'

interface ChatContactsState {
  contacts: ChatContact[]
  isLoading: boolean
  error: string | null
  initialized: boolean
  loadContacts: (options?: { tenantId?: string; sessionToken?: string | null }) => Promise<void>
  createContact: (input: { tenantId?: string; displayName: string; phone?: string | null }) => Promise<boolean>
  createGroup: (input: { tenantId?: string; displayName: string; description?: string | null }) => Promise<boolean>
  updateContact: (input: { contactId: string; tenantId?: string; displayName?: string; phone?: string | null; description?: string | null; email?: string | null }) => Promise<boolean>
  syncContact: (contactId: string, updater: (contact: ChatContact) => Partial<ChatContact>) => void
  reset: () => void
}

export const useChatContactsStore = createWithEqualityFn<ChatContactsState>(set => ({
  contacts: [],
  isLoading: false,
  error: null,
  initialized: false,

  reset: () => set({ contacts: [], error: null, initialized: false }),

  loadContacts: async (options?: { tenantId?: string; sessionToken?: string | null }) => {
    set({ isLoading: true, error: null })
    try {
      console.log('[ChatContactsStore] Loading contacts', {
        tenantId: options?.tenantId || 'not provided',
        sessionToken: options?.sessionToken ? 'present' : 'missing',
      })

      const contacts = await loadContactsApi(options?.tenantId, options?.sessionToken)

      console.log('[ChatContactsStore] Contacts loaded successfully', {
        count: contacts.length,
        contactIds: contacts.map(c => c.id).slice(0, 5),
      })

      // Ensure we always have at least FlowBot
      const hasFlowbot = contacts.some(c => c.isFlowbot)
      const finalContacts = hasFlowbot
        ? contacts
        : [
          ...contacts,
          {
            id: 'flowbot',
            tenantId: options?.tenantId || 'default',
            type: 'BOT' as const,
            displayName: 'FlowBot',
            phone: null,
            avatarUrl: null,
            description: 'Asistente virtual',
            isFlowbot: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: null,
          },
        ]

      set({ contacts: [...finalContacts].sort(sortContacts), isLoading: false, initialized: true })
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unable to load contacts'
      console.error('[ChatContactsStore] Failed to load contacts', {
        error: message,
        errorDetails: error,
        tenantId: options?.tenantId || 'not provided',
        sessionToken: options?.sessionToken ? 'present' : 'missing',
      })

      // Even on error, ensure FlowBot is available as fallback
      const fallbackFlowbot = {
        id: 'flowbot',
        tenantId: options?.tenantId || 'default',
        type: 'BOT' as const,
        displayName: 'FlowBot',
        phone: null,
        avatarUrl: null,
        description: 'Asistente virtual',
        isFlowbot: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: null,
      }

      set({
        contacts: [fallbackFlowbot],
        isLoading: false,
        error: message,
        initialized: true
      })

      // Only show toast error if we had a session token (unexpected error)
      // If no session token, it's expected that contacts won't load (user not logged in)
      if (options?.sessionToken) {
        toast.error('Contactos', message)
      }
    }
  },

  createContact: async ({ tenantId, displayName, phone }) => {
    try {
      const contact = await createContactApi({ tenantId, displayName, phone })
      set(state => ({ contacts: [...state.contacts.filter(c => c.id !== contact.id), contact].sort(sortContacts), error: null }))
      toast.success('Contacto creado', `${contact.displayName} se agregó correctamente.`)
      return true
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unable to create contact'
      set({ error: message })
      toast.error('Contacto', message)
      return false
    }
  },

  createGroup: async ({ tenantId, displayName, description }) => {
    try {
      const contact = await createGroupApi({ tenantId, displayName, description })
      set(state => ({ contacts: [...state.contacts.filter(c => c.id !== contact.id), contact].sort(sortContacts), error: null }))
      toast.success('Grupo creado', `${contact.displayName} está listo.`)
      return true
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unable to create group'
      set({ error: message })
      toast.error('Grupo', message)
      return false
    }
  },

  updateContact: async ({ contactId, tenantId, displayName, phone, description, email }) => {
    try {
      const contact = await updateContactApi(contactId, { tenantId, displayName, phone, description, email })
      set(state => ({
        contacts: [...state.contacts.filter(c => c.id !== contact.id), contact].sort(sortContacts),
        error: null,
      }))
      toast.success('Contacto actualizado', `${contact.displayName} se guardó correctamente.`)
      return true
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unable to update contact'
      set({ error: message })
      toast.error('Contacto', message)
      return false
    }
  },
  syncContact: (contactId, updater) => {
    set(state => ({
      contacts: state.contacts.map(c =>
        c.id === contactId ? { ...c, ...updater(c) } : c
      ).sort(sortContacts),
    }))
  },
}))

export type { ChatContact } from '@/modules/chatbot/domain/contact'

function sortContacts(a: ChatContact, b: ChatContact): number {
  if (a.isFlowbot && !b.isFlowbot) {
    return -1
  }
  if (!a.isFlowbot && b.isFlowbot) {
    return 1
  }
  if (a.type !== b.type) {
    return a.type.localeCompare(b.type)
  }
  return a.displayName.localeCompare(b.displayName)
}
