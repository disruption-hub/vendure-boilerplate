"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { FileUpload } from '@/components/chat/FileUpload'
import { AttachmentsList } from '@/components/chat/AttachmentRenderer'
import type { KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Edit,
  File,
  Info,
  LogOut,
  Paperclip,
  Send,
  Settings,
  Trash2,
  CalendarClock,
  Users,
  Video,
  X,
  Forward,
} from 'lucide-react'
import { GlobalSessionManagerModal } from './dialogs/GlobalSessionManagerModal'
import { shallow } from 'zustand/shallow'



import NotificationToggle from '@/components/NotificationToggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Message, ChatQuickAction, SidebarEntry } from '@/components/chatbot/types'
import { renderMessageContent } from '@/lib/chatbot/utils/rich-message-renderer'
import { ClientMemoryService } from '@/lib/ai/memory/client-memory-service'
import type { FlowConfig, FlowQuickActionConfig } from '@/lib/chatbot/flow-config/types'
import type { SupportedLanguage } from '@/lib/chatbot/language-detector'
import { formatPaymentNotificationContent } from '@/hooks/usePaymentNotificationMessages'
import type Pusher from 'pusher-js'
import {
  buildUserThreadKey,
  buildPresenceThreadChannel,
  buildPresenceTenantChannel,
  type TenantUserThreadEvent,
  type TenantUserThreadReadEvent,
} from '@/lib/chatbot/user-thread-utils'
import { buildWhatsAppChannel } from '@/lib/whatsapp/integration/soketi-emitter'
import { mapWhatsAppDtoToMessage, updateMessageDeliveryState, type WhatsAppMessageStatus } from '@/lib/whatsapp/message-adapter'
import { CHAT_THEME_OPTIONS, DEFAULT_CHAT_THEME } from '@/lib/chatbot/chat-themes'
import { cn } from '@/lib/utils'
import { toast, useChatAuthStore, useDeliveryStatusStore, useAuthStore } from '@/stores'
import { useDomainStore } from '@/state/hooks'
import type { PaymentNotificationRecord } from '@/types/payment-notification'
import type { ChatbotCommandDefinition } from '@/modules/chatbot/domain/command'
import { PanelHost } from '@/panels/right-panel-shell/PanelHost'
import { getRightPanelPlugins } from '@/plugins/right-panel-registry'
import '@/plugins/register-defaults'
import type { CrmPanelTab } from '@/domains/crm/panels/CrmChatPanel'
import type { CommunicationsBroadcastSummary } from '@/domains/communications/panels/CommunicationsPanel'
import { createCrmFacade } from '@/domains/crm/facade'
import { createHttpCrmGateway } from '@/domains/crm/adapters/http-crm-gateway'
import type { CrmCustomerSummary } from '@/domains/crm/contracts'
import { FileValidator } from '@/lib/utils/file-validator'
import { ChatbotShellLayout } from './ChatbotShellLayout'
import { ChatbotDialogs } from './dialogs/ChatbotDialogs'
import { ChatbotSidebar } from './sidebar/ChatbotSidebar'
import { useCrmCustomers } from './hooks/useCrmCustomers'
import { useRightPanelContext, type RightPanelContext } from './hooks/useRightPanelContext'
import { useTypingEmitterCleanup } from './hooks/useTypingEmitterCleanup'
import MobileChatInterface from './MobileChatInterface'
import { ScheduleBottomSheet } from './schedule/ScheduleBottomSheet'

const ChatContactsPanel = dynamic(() => import('@/components/chatbot/contacts/ChatContactsPanel'), {
  ssr: false,
})

const ChatUserSettingsPanel = dynamic(() => import('@/components/chatbot/contacts/ChatUserSettingsPanel'), {
  ssr: false,
})

const FlowBotToggle = dynamic(() => import('@/components/chatbot/FlowBotToggle').then(mod => ({ default: mod.FlowBotToggle })), {
  ssr: false,
})

type ConversationContext = Record<string, unknown>


const DEFAULT_WELCOME: Record<SupportedLanguage, string> = {
  en: "Hi there! I'm FlowBot. I can help you schedule an appointment, look up trademarks, and answer questions. How can I help today?",
  es: '¡Hola! Soy FlowBot. Puedo ayudarte a consultar registros, reservar citas y responder dudas. ¿En qué puedo ayudarte?',
}

type ClientScheduledMessageStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED'

interface ScheduledMessageEntry {
  id: string
  contactId: string | null
  sessionId: string | null
  content: string
  scheduledAt: Date
  status: ClientScheduledMessageStatus
  targetType: 'FLOWBOT' | 'TENANT_USER'
  lastError?: string | null
}

const DEFAULT_QUICK_ACTIONS: Array<{
  id: string
  action: string
  labels: Record<SupportedLanguage, string>
}> = [
    {
      id: 'see-schedule',
      action: 'Muéstrame horarios',
      labels: {
        en: 'See available slots',
        es: 'Ver horarios disponibles',
      },
    },
    {
      id: 'see-products',
      action: 'show_products',
      labels: {
        en: 'Show available products',
        es: 'Ver productos disponibles',
      },
    },
    {
      id: 'search-trademark',
      action: 'Buscar marca',
      labels: {
        en: 'Search a trademark',
        es: 'Buscar una marca',
      },
    },
    {
      id: 'speak-agent',
      action: 'Hablar con un asesor',
      labels: {
        en: 'Talk to an advisor',
        es: 'Hablar con un asesor',
      },
    },
  ]

function resolveGreeting(config: FlowConfig | undefined, language: SupportedLanguage): string {
  const message = config?.messages?.greeting
  const value = message?.[language] ?? message?.en

  if (Array.isArray(value)) {
    return value[0] ?? DEFAULT_WELCOME[language]
  }

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  return DEFAULT_WELCOME[language]
}

function resolveQuickActions(
  config: FlowConfig | undefined,
  language: SupportedLanguage,
): Message['quickActions'] {
  const actions = Array.isArray(config?.quickActions) ? config!.quickActions : DEFAULT_QUICK_ACTIONS

  return actions
    .map(action => {
      const labels = (action as FlowQuickActionConfig).labels ?? (action as any).labels ?? {}
      const label = labels?.[language] ?? labels?.en ?? action.action
      if (!label || !label.trim()) {
        return null
      }
      return {
        id: (action as FlowQuickActionConfig).id,
        label: label.trim(),
        action: action.action,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

interface TypingEventPayload {
  userId: string
  threadKey: string
  isTyping: boolean
  timestamp?: string
}

function formatTimeLabel(date?: Date, locale: string = 'en'): string {
  if (!date) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch (error) {
    console.warn('FullScreenChatbot: failed to format time label', error)
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }
}

function formatDateTime(value?: Date, locale: string = 'en'): string {
  if (!value) {
    return 'Sin registro'
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(value)
  } catch (error) {
    console.warn('FullScreenChatbot: failed to format datetime label', error)
    return value.toLocaleString(locale)
  }
}

function safeDate(input?: string | Date | null): Date | undefined {
  if (!input) {
    return undefined
  }
  const candidate = input instanceof Date ? input : new Date(input)
  return Number.isNaN(candidate.getTime()) ? undefined : candidate
}

function normalizePreviewText(text: string, limit = 80): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return ''
  }
  return compact.length > limit ? `${compact.slice(0, limit)}…` : compact
}

// ============================================================================
// TYPE GUARDS AND VALIDATION UTILITIES
// ============================================================================

/**
 * Ensures a value is a valid string, returns empty string if not
 */
function safeString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

/**
 * Ensures a value is a valid non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Ensures a value is a valid array, returns empty array if not
 */
function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

/**
 * Safe string method chaining - prevents "is not a function" errors
 */
function safeStringOp(value: unknown): {
  trim: () => string
  toLowerCase: () => string
  toUpperCase: () => string
  startsWith: (search: string) => boolean
  endsWith: (search: string) => boolean
  includes: (search: string) => boolean
  replace: (search: string | RegExp, replacement: string) => string
  split: (separator: string | RegExp) => string[]
} {
  const str = safeString(value)
  return {
    trim: () => str.trim(),
    toLowerCase: () => str.toLowerCase(),
    toUpperCase: () => str.toUpperCase(),
    startsWith: (search: string) => str.startsWith(search),
    endsWith: (search: string) => str.endsWith(search),
    includes: (search: string) => str.includes(search),
    replace: (search: string | RegExp, replacement: string) => str.replace(search, replacement),
    split: (separator: string | RegExp) => str.split(separator),
  }
}

/**
 * Validates contact object has required properties
 */
function isValidContact(contact: any): boolean {
  return (
    contact &&
    typeof contact === 'object' &&
    'id' in contact &&
    isNonEmptyString(contact.id)
  )
}


/**
 * Safe map operation that filters out invalid results
 */
function safeMap<T, U>(
  array: unknown,
  mapper: (item: T, index: number) => U | null | undefined
): U[] {
  if (!Array.isArray(array)) {
    return []
  }
  return array
    .map(mapper)
    .filter((item): item is U => item !== null && item !== undefined)
}

/**
 * Safe filter operation
 */
function safeFilter<T>(
  array: unknown,
  predicate: (item: T, index: number) => boolean
): T[] {
  if (!Array.isArray(array)) {
    return []
  }
  return array.filter(predicate)
}

/**
 * Safe find operation
 */
function safeFind<T>(
  array: unknown,
  predicate: (item: T, index: number) => boolean
): T | undefined {
  if (!Array.isArray(array)) {
    return undefined
  }
  return array.find(predicate)
}

/**
 * Safely binds an event handler to a Pusher channel
 * Prevents "is not a function" errors by validating both channel and handler
 */
function safeChannelBind(
  channel: any,
  eventName: string,
  handler: any
): void {
  if (!channel || typeof channel !== 'object') {
    console.warn(`safeChannelBind: Invalid channel for event "${eventName}"`)
    return
  }
  if (typeof channel.bind !== 'function') {
    console.warn(`safeChannelBind: channel.bind is not a function for event "${eventName}"`)
    return
  }
  if (typeof handler !== 'function') {
    console.warn(`safeChannelBind: Invalid handler for event "${eventName}"`, typeof handler)
    return
  }
  try {
    channel.bind(eventName, handler)
  } catch (error) {
    console.error(`safeChannelBind: Error binding event "${eventName}"`, error)
  }
}

/**
 * Safely unbinds an event handler from a Pusher channel
 */
function safeChannelUnbind(
  channel: any,
  eventName: string,
  handler?: any
): void {
  if (!channel || typeof channel !== 'object') {
    return
  }
  if (typeof channel.unbind !== 'function') {
    return
  }
  try {
    if (handler && typeof handler === 'function') {
      channel.unbind(eventName, handler)
    } else {
      channel.unbind(eventName)
    }
  } catch (error) {
    console.error(`safeChannelUnbind: Error unbinding event "${eventName}"`, error)
  }
}

function FullScreenChatbot() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const composerContainerRef = useRef<HTMLDivElement>(null)

  // Create a ref for the form to forcefully override styles
  const formRef = useRef<HTMLFormElement>(null)

  // Forcefully remove any blue rings using direct DOM manipulation with !important
  useEffect(() => {
    // This aggressive approach ensures no browser default or Tailwind ring persists
    const enforceNoRing = () => {
      // Form: Keep the gray border but prevent it from changing color on focus
      if (formRef.current) {
        formRef.current.style.setProperty('outline', 'none', 'important')
        formRef.current.style.setProperty('box-shadow', 'none', 'important')
        // Force the border to be gray at all times, preventing blue focus color
        formRef.current.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.15)', 'important')
        formRef.current.style.setProperty('border-color', 'rgba(0, 0, 0, 0.15)', 'important')
      }

      // Textarea: No border, no outline, no shadow
      if (composerRef.current) {
        composerRef.current.style.setProperty('outline', 'none', 'important')
        composerRef.current.style.setProperty('box-shadow', 'none', 'important')
        composerRef.current.style.setProperty('border', 'none', 'important')
        composerRef.current.style.setProperty('background-color', '#ffffff', 'important')
        // Specifically for Safari/iOS
        composerRef.current.style.setProperty('-webkit-tap-highlight-color', 'transparent', 'important')
      }
    }

    // Run immediately
    enforceNoRing()

    // And on any focus/input events in the form
    const form = formRef.current
    if (form) {
      form.addEventListener('focus', enforceNoRing, true) // Capture phase
      form.addEventListener('focusin', enforceNoRing)
      form.addEventListener('input', enforceNoRing)
      form.addEventListener('click', enforceNoRing)
      // Also on blur to ensure it resets immediately
      form.addEventListener('blur', enforceNoRing, true)
    }

    return () => {
      if (form) {
        form.removeEventListener('focus', enforceNoRing, true)
        form.removeEventListener('focusin', enforceNoRing)
        form.removeEventListener('input', enforceNoRing)
        form.removeEventListener('click', enforceNoRing)
        form.removeEventListener('blur', enforceNoRing, true)
      }
    }
  }, [])

  // const { toast } = useToast() // Already accessed or not needed here for debugging

  // const { toast } = useToast() // Already accessed or not needed here for debugging
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [composerPlaceholder, setComposerPlaceholder] = useState('Escribe un mensaje...')
  const [welcomeInitialized, setWelcomeInitialized] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationContext, setConversationContext] = useState<ConversationContext>({})

  useEffect(() => {
    console.log('[FullScreenChatbot] Mounted')
  }, [])

  const [availableCommands, setAvailableCommands] = useState<ChatbotCommandDefinition[]>([])
  const [commandThreads, setCommandThreads] = useState<Record<string, Message[]>>({})
  const [userThreads, setUserThreads] = useState<Record<string, Message[]>>({})
  const userThreadLoadedRef = useRef<Record<string, boolean>>({})
  const whatsappThreadLoadedRef = useRef<Record<string, boolean>>({})
  const markedAsReadRef = useRef<Set<string>>(new Set()) // Track contacts already marked as read
  const missingWhatsAppContactsRef = useRef<Set<string>>(new Set())
  const [transientWhatsAppContacts, setTransientWhatsAppContacts] = useState<Record<string, any>>({})
  const [sessionSummaries, setSessionSummaries] = useState<Record<string, any[]>>({})
  const [sessionActivities, setSessionActivities] = useState<Record<string, any[]>>({})

  const {
    contacts,
    initialized: contactsInitialized,
    isLoading: contactsLoading,
    error: contactsError,
    loadContacts,
    updateContact: updateChatContact,
    syncContact,
  } = useDomainStore(
    'chatContacts',
    state => ({
      contacts: state.contacts,
      initialized: state.initialized,
      isLoading: state.isLoading,
      error: state.error,
      loadContacts: state.loadContacts,
      updateContact: state.updateContact,
      syncContact: state.syncContact,
    }),
    shallow,
  )

  const combinedContacts = useMemo(() => {
    const transientValues = Object.values(transientWhatsAppContacts)
    return [...safeArray(contacts), ...transientValues]
  }, [contacts, transientWhatsAppContacts])

  const knownContactIds = useMemo(() => {
    const set = new Set<string>()
    combinedContacts.forEach(contact => {
      if (isValidContact(contact)) {
        set.add(safeString(contact.id))
      }
    })
    return set
  }, [combinedContacts])

  const knownContactIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    knownContactIdsRef.current = knownContactIds
  }, [knownContactIds])

  useEffect(() => {
    if (!combinedContacts.length) {
      return
    }

    missingWhatsAppContactsRef.current.forEach(contactId => {
      if (knownContactIds.has(contactId)) {
        missingWhatsAppContactsRef.current.delete(contactId)
      }
    })
  }, [combinedContacts, knownContactIds])

  // Use ref to track previous contacts to avoid infinite loops
  const previousContactsRef = useRef<any[]>([])
  const contactsIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Create a stable set of contact IDs for comparison
    const currentContactIds = new Set<string>()
    safeArray(contacts).forEach((contact: any) => {
      if (isValidContact(contact)) {
        const id = safeString(contact.id)
        if (id) {
          currentContactIds.add(id)
        }
      }
    })

    // Only update if contacts actually changed (by ID comparison)
    const contactsChanged =
      previousContactsRef.current.length !== contacts.length ||
      currentContactIds.size !== contactsIdsRef.current.size ||
      Array.from(currentContactIds).some(id => !contactsIdsRef.current.has(id))

    if (!contactsChanged) {
      return
    }

    // Update refs
    previousContactsRef.current = contacts
    contactsIdsRef.current = currentContactIds

    // Only update transient contacts if there are any to clean up
    setTransientWhatsAppContacts(prev => {
      if (!Object.keys(prev).length) {
        return prev
      }

      const next = { ...prev }
      let changed = false

      currentContactIds.forEach(contactId => {
        if (next[contactId]) {
          delete next[contactId]
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [contacts])
  const applyToContactThread = useCallback(
    (contactId: string, updater: (current: Message[]) => Message[] | null | undefined) => {
      console.log('🔄 [applyToContactThread] Updating commandThreads', {
        contactId,
        timestamp: new Date().toISOString(),
      })

      setCommandThreads(prev => {
        const current = prev[contactId] ?? []
        console.log('📊 [applyToContactThread] Current thread state', {
          contactId,
          currentLength: current.length,
          currentMessageIds: current.map(m => m.id).slice(0, 5),
        })

        const next = updater(current)
        if (!next || next === current) {
          console.log('⏭️ [applyToContactThread] No changes, skipping update', { contactId })
          return prev
        }

        const sorted = [...next].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        if (sorted === current) {
          console.log('⏭️ [applyToContactThread] Sorted matches current, skipping update', { contactId })
          return prev
        }

        console.log('✅ [applyToContactThread] State updated', {
          contactId,
          newLength: sorted.length,
          addedCount: sorted.length - current.length,
          newMessageIds: sorted.map(m => m.id).slice(-3),
        })

        return {
          ...prev,
          [contactId]: sorted,
        }
      })
    },
    [],
  )

  const normalizeWhatsAppStatus = useCallback((value: unknown): WhatsAppMessageStatus => {
    if (typeof value === 'string') {
      const upper = value.toUpperCase()
      if (upper === 'READ' || upper === 'PLAYED') return 'READ'
      if (upper === 'DELIVERED') return 'DELIVERED'
      if (upper === 'SENT') return 'SENT'
      // Map PENDING/SENDING to SENT to show single check immediately (optimistic)
      if (upper === 'PENDING' || upper === 'SENDING') return 'SENT'
      if (upper === 'FAILED') return 'FAILED'
    }
    return 'SENT'
  }, [])

  const parseEventDate = useCallback((value: unknown): Date | null => {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value
    }
    if (typeof value === 'string') {
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    return null
  }, [])
  const [userChatSending, setUserChatSending] = useState(false)
  const [commandsLoaded, setCommandsLoaded] = useState(false)
  const [commandExecuting, setCommandExecuting] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0)
  const [composerHeight, setComposerHeight] = useState(0)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [showContactsPanel, setShowContactsPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showSessionManagerModal, setShowSessionManagerModal] = useState(false)
  const [closingContactId, setClosingContactId] = useState<string | null>(null)
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [crmActiveTab, setCrmActiveTab] = useState<CrmPanelTab>('summary')
  const [isForwarding, setIsForwarding] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const panelPlugins = useMemo(() => {
    const plugins = getRightPanelPlugins<RightPanelContext>()
    console.log('[FullScreenChatbot] Panel plugins loaded:', plugins.length, plugins.map(p => p.id))
    return plugins
  }, [])
  const [activePanelId, setActivePanelId] = useState(() => {
    const firstId = panelPlugins[0]?.id ?? ''
    console.log('[FullScreenChatbot] Initial activePanelId:', firstId)
    return firstId
  })
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia('(min-width: 1024px)').matches
  })
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [openDropdownMessageId, setOpenDropdownMessageId] = useState<string | null>(null)
  // Use ref to track openDropdownMessageId to avoid recreating callbacks
  const openDropdownMessageIdRef = useRef<string | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    openDropdownMessageIdRef.current = openDropdownMessageId
  }, [openDropdownMessageId])
  const [messageInfoDialog, setMessageInfoDialog] = useState<{ open: boolean; message: Message | null }>({
    open: false,
    message: null,
  })
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [scheduledMessages, setScheduledMessages] = useState<Record<string, ScheduledMessageEntry | null>>({})
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false)
  const [previewScheduledMessage, setPreviewScheduledMessage] = useState<ScheduledMessageEntry | null>(null)
  const [scheduledMessagesModalOpen, setScheduledMessagesModalOpen] = useState(false)

  const upsertScheduledMessage = useCallback((contactId: string, entry: ScheduledMessageEntry | null) => {
    setScheduledMessages(prev => {
      const next = { ...prev }
      if (!entry) {
        delete next[contactId]
      } else {
        next[contactId] = entry
      }
      return next
    })
  }, [])

  const clearScheduledMessage = useCallback((keys: Array<string | null | undefined>, scheduledMessageId?: string) => {
    setScheduledMessages(prev => {
      let changed = false
      const next = { ...prev }
      keys.forEach(key => {
        if (!key) {
          return
        }
        const entry = next[key]
        if (!entry) {
          return
        }
        if (!scheduledMessageId || entry.id === scheduledMessageId) {
          delete next[key]
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [])

  const scheduledEntries = useMemo(
    () =>
      Object.entries(scheduledMessages)
        .filter(([, entry]) => Boolean(entry))
        .map(([contactId, entry]) => [contactId, entry as ScheduledMessageEntry]) as Array<
          [string, ScheduledMessageEntry]
        >,
    [scheduledMessages],
  )

  useEffect(() => {
    if (!panelPlugins.length) {
      return
    }

    if (!activePanelId || !panelPlugins.some(plugin => plugin.id === activePanelId)) {
      setActivePanelId(panelPlugins[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelPlugins])

  // Memoized hover handlers to prevent unnecessary re-renders
  const handleMessageMouseEnter = useCallback((messageId: string) => {
    setHoveredMessageId(messageId)
  }, [])

  const handleMessageMouseLeave = useCallback(() => {
    // Don't hide if dropdown is open - use ref to avoid dependency on state
    if (!openDropdownMessageIdRef.current) {
      setHoveredMessageId(null)
    }
  }, [])

  const pusherRef = useRef<Pusher | null>(null)
  const subscribedChannelsRef = useRef<Map<string, any>>(new Map())
  const realtimeConfigSignatureRef = useRef<string | null>(null)
  const [realtimeReady, setRealtimeReady] = useState(false)
  const typingTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  const localTypingStateRef = useRef<Record<string, boolean>>({})
  const typingStateRef = useRef<Record<string, boolean>>({})
  const typingEmitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingTargetRef = useRef<{ peerUserId: string; tenantId: string } | null>(null)
  const pendingReadIdsRef = useRef<Set<string>>(new Set())
  // CRITICAL: Global deduplication set to prevent triple message display
  // Messages can arrive via: 1) Optimistic update, 2) Backend broadcast, 3) Baileys event
  const processedMessageIdsRef = useRef<Set<string>>(new Set())
  type SubscriptionRetryEntry = {
    attempts: number
    timer: ReturnType<typeof setTimeout> | null
    gaveUp: boolean
  }

  const subscriptionRetryRef = useRef<Map<string, SubscriptionRetryEntry>>(new Map())
  const [typingContacts, setTypingContacts] = useState<Record<string, boolean>>({})
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  // Create a stable string representation for dependency tracking to prevent infinite loops
  const onlineUserIdsKey = useMemo(() => Array.from(onlineUserIds).sort().join(','), [onlineUserIds])
  const keyboardOpenedRef = useRef(false)

  const [selectedContactId, setSelectedContactId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('chatbot-selected-contact-id')
    }
    return null
  })

  // Track if selectedContactId was loaded from localStorage
  const selectedContactIdFromStorageRef = useRef<string | null>(null)
  if (selectedContactIdFromStorageRef.current === null && selectedContactId) {
    selectedContactIdFromStorageRef.current = selectedContactId
  }

  // Persist selected contact to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedContactId) {
        window.localStorage.setItem('chatbot-selected-contact-id', selectedContactId)
      } else {
        window.localStorage.removeItem('chatbot-selected-contact-id')
      }
    }
  }, [selectedContactId])
  const [sidebarQuery, setSidebarQuery] = useState('')
  const lastContactsLoadToken = useRef<string | null | undefined>(undefined)

  const {
    sessionToken,
    sessionId,
    linkedUserId: chatAuthLinkedUserId,
    isHydrated,
    loadSession,
    logout,
    status: chatAuthStatus,
    tenantId: chatAuthTenantId,
    lastTenantId: chatAuthLastTenantId,
  } = useDomainStore(
    'chatAuth',
    state => ({
      sessionToken: state.sessionToken,
      sessionId: state.sessionId,
      linkedUserId: state.linkedUserId,
      isHydrated: state.isHydrated,
      loadSession: state.loadSession,
      logout: state.logout,
      status: state.status,
      tenantId: state.tenantId,
      lastTenantId: state.lastTenantId,
    }),
    shallow,
  )

  // Persistent delivery status store
  const { updateDeliveryStatus, getDeliveryStatus } = useDeliveryStatusStore(
    state => ({
      updateDeliveryStatus: state.updateDeliveryStatus,
      getDeliveryStatus: state.getDeliveryStatus,
    }),
    shallow,
  )

  const {
    login: authLogin,
    isLoading: authLoading,
    error: authError,
    clearError: clearAuthError,
    user: authUser,
  } = useDomainStore(
    'auth',
    state => ({
      login: state.login,
      isLoading: state.isLoading,
      error: state.error,
      clearError: state.clearError,
      user: state.user,
    }),
    shallow,
  )
  const authToken = useDomainStore('auth', (state: any) => state.token)
  const chatThemeId = useDomainStore('chatTheme', state => state.currentTheme)
  const { paymentNotifications, setChatbotOpen, resetUnreadPaymentNotifications, dashboardUser } = useDomainStore(
    'dashboard',
    state => ({
      paymentNotifications: state.paymentNotifications,
      setChatbotOpen: state.setChatbotOpen,
      resetUnreadPaymentNotifications: state.resetUnreadPaymentNotifications,
      dashboardUser: state.user,
    }),
    shallow,
  )

  const resolvedStoredTheme = useMemo(() => {
    return CHAT_THEME_OPTIONS.some(option => option.id === chatThemeId) ? chatThemeId : DEFAULT_CHAT_THEME
  }, [chatThemeId])

  const crmFacade = useMemo(
    () => createCrmFacade({ gateway: createHttpCrmGateway({ sessionToken }) }),
    [sessionToken],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const query = window.matchMedia('(min-width: 1024px)')

    console.log('Deployment Test: 2025-12-10T23:03:00-05:00 - Added bind_global debug')

    const update = () => {
      setIsDesktop(query.matches)
    }

    update()
    query.addEventListener('change', update)

    return () => {
      query.removeEventListener('change', update)
    }
  }, [])

  const activeThemeId = isDesktop ? resolvedStoredTheme : DEFAULT_CHAT_THEME

  // Note: Session loading is handled by page.tsx, no need to duplicate here
  // Removed duplicate loadSession call that was causing infinite re-render loop

  // Add fetch and XMLHttpRequest interceptors for auth endpoint debugging
  // Pusher-js might use either fetch or XHR depending on configuration
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Intercept fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      const urlString = typeof url === 'string' ? url : url.toString()

      if (urlString.includes('/api/chat/realtime/auth')) {
        console.log('🔍 [Auth Interceptor] Fetch request intercepted:', {
          url: urlString,
          method: options?.method || 'GET',
          headers: options?.headers,
          hasBody: !!options?.body,
          bodyType: options?.body?.constructor?.name,
        })

        try {
          const response = await originalFetch(...args)
          const clonedResponse = response.clone()

          // Try to read response body for logging
          const contentType = response.headers.get('content-type') || ''
          let responseBody: any = null

          if (contentType.includes('application/json')) {
            try {
              responseBody = await clonedResponse.json()
            } catch {
              responseBody = await clonedResponse.text().catch(() => 'Unable to read')
            }
          } else {
            responseBody = await clonedResponse.text().catch(() => 'Unable to read')
          }

          console.log('🔍 [Auth Interceptor] Fetch response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
            ok: response.ok,
          })

          return response
        } catch (error) {
          console.error('🔍 [Auth Interceptor] Fetch request failed:', error)
          throw error
        }
      }

      return originalFetch(...args)
    }

    // Intercept XMLHttpRequest (Pusher-js might use this)
    const originalXHROpen = XMLHttpRequest.prototype.open
    const originalXHRSend = XMLHttpRequest.prototype.send
    const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      const urlString = typeof url === 'string' ? url : url.toString()
      if (urlString.includes('/api/chat/realtime/auth')) {
        console.log('🔍 [Auth Interceptor] XHR open intercepted:', {
          method,
          url: urlString,
        })
          ; (this as any).__authUrl = urlString
          ; (this as any).__authMethod = method
      }
      return originalXHROpen.call(this, method, url, ...rest)
    }

    XMLHttpRequest.prototype.setRequestHeader = function (header: string, value: string) {
      if ((this as any).__authUrl) {
        console.log('🔍 [Auth Interceptor] XHR header set:', {
          header,
          value: header.toLowerCase().includes('authorization') ? value.substring(0, 20) + '...' : value,
        })
      }
      return originalXHRSetRequestHeader.call(this, header, value)
    }

    XMLHttpRequest.prototype.send = function (body?: any) {
      if ((this as any).__authUrl) {
        console.log('🔍 [Auth Interceptor] XHR send intercepted:', {
          url: (this as any).__authUrl,
          method: (this as any).__authMethod,
          hasBody: !!body,
          bodyType: body?.constructor?.name,
          bodyPreview: typeof body === 'string' ? body.substring(0, 200) : 'not string',
        })

        const originalOnReadyStateChange = this.onreadystatechange
        this.onreadystatechange = function () {
          if (this.readyState === 4) {
            console.log('🔍 [Auth Interceptor] XHR response received:', {
              status: this.status,
              statusText: this.statusText,
              responseText: this.responseText?.substring(0, 500),
              responseType: this.responseType,
            })
          }
          if (originalOnReadyStateChange) {
            return originalOnReadyStateChange.call(this)
          }
        }
      }
      return originalXHRSend.call(this, body)
    }

    return () => {
      window.fetch = originalFetch
      XMLHttpRequest.prototype.open = originalXHROpen
      XMLHttpRequest.prototype.send = originalXHRSend
      XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const hasIdentity = Boolean(sessionToken || authUser?.id || dashboardUser?.id)
    if (!hasIdentity) {
      setRealtimeReady(false)
      realtimeConfigSignatureRef.current = null
      if (pusherRef.current) {
        for (const [channelName, channel] of subscribedChannelsRef.current) {
          channel?.unbind_all?.()
          pusherRef.current.unsubscribe(channelName)
        }
        subscribedChannelsRef.current.clear()
        pusherRef.current.connection.unbind_all()
        pusherRef.current.disconnect()
        pusherRef.current = null
      }
      return
    }

    let cancelled = false

    const initializeRealtime = async () => {
      try {
        const headers: Record<string, string> = {}
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`
        }

        const response = await fetch('/api/chat/realtime/config', { headers })
        if (!response.ok) {
          console.warn('FullScreenChatbot: realtime config request failed', {
            status: response.status,
          })
          setRealtimeReady(false)
          return
        }

        const data = await response.json()
        if (!data?.success || !data.config) {
          setRealtimeReady(false)
          return
        }

        const signature = `${data.config.key}|${data.config.host}|${data.config.port}|${data.config.useTLS}|${data.config.cluster ?? ''}`
        if (signature === realtimeConfigSignatureRef.current && pusherRef.current) {
          setRealtimeReady(true)
          return
        }

        const { default: PusherClient } = await import('pusher-js')
        if (cancelled) {
          return
        }

        if (pusherRef.current) {
          for (const [channelName, channel] of subscribedChannelsRef.current) {
            channel?.unbind_all?.()
            pusherRef.current.unsubscribe(channelName)
          }
          subscribedChannelsRef.current.clear()
          pusherRef.current.connection.unbind_all()
          pusherRef.current.disconnect()
        }

        const useTLS = Boolean(data.config.useTLS)

        // Use absolute URL for auth endpoint to prevent path resolution issues
        const authEndpoint = data.authEndpoint ?? '/api/chat/realtime/auth'
        const absoluteAuthEndpoint = authEndpoint.startsWith('http')
          ? authEndpoint
          : typeof window !== 'undefined'
            ? `${window.location.origin}${authEndpoint}`
            : authEndpoint

        console.log('🔐 [FullScreenChatbot] Setting up channelAuthorization', {
          originalEndpoint: authEndpoint,
          absoluteEndpoint: absoluteAuthEndpoint,
          hasSessionToken: !!sessionToken,
          transport: 'ajax',
        })

        // Use Pusher's standard channelAuthorization for proper auth protocol support
        const client = new PusherClient(data.config.key, {
          cluster: data.config.cluster ?? 'mt1',
          wsHost: data.config.host,
          wsPort: data.config.port,
          wssPort: data.config.port,
          forceTLS: useTLS,
          disableStats: true,
          // Use standard channelAuthorization for better Soketi compatibility
          channelAuthorization: {
            endpoint: absoluteAuthEndpoint,
            transport: 'ajax',
            headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined,
          },
        })

        safeChannelBind(client.connection, 'state_change', ({ previous, current }: any) => {
          console.log('FullScreenChatbot: realtime state change', { previous, current })
        })

        safeChannelBind(client.connection, 'connected', () => {
          console.log('✅ FullScreenChatbot: realtime connected', {
            socketId: client.connection.socket_id,
            host: data.config.host,
            port: data.config.port,
            cluster: data.config.cluster ?? 'mt1',
          })
        })

        safeChannelBind(client.connection, 'authorized', (data: any) => {
          console.log('✅ FullScreenChatbot: channel authorized', {
            data,
            socketId: client.connection.socket_id,
          })
        })

        safeChannelBind(client.connection, 'authorization_error', (data: any) => {
          console.error('❌ FullScreenChatbot: authorization error', {
            error: data,
            errorType: data?.type,
            errorStatus: data?.status,
            errorMessage: data?.error || data?.message,
            socketId: client.connection.socket_id,
            fullError: JSON.stringify(data, null, 2),
          })
        })

        safeChannelBind(client.connection, 'error', (event: any) => {
          console.error('FullScreenChatbot: realtime connection error', {
            type: event?.type,
            error: event?.error,
            data: event?.data,
            fullEvent: event,
          })
        })

          // Store addChannelListeners function for use when subscribing
          ; (client as any).__addChannelListeners = (channelName: string, channel: any) => {
            safeChannelBind(channel, 'pusher:subscription_succeeded', () => {
              console.log('✅✅✅ FullScreenChatbot: subscription succeeded', {
                channelName,
                socketId: client.connection.socket_id,
              })
            })

            safeChannelBind(channel, 'pusher:subscription_error', (status: any) => {
              const normalizedStatus =
                status && typeof status === 'object'
                  ? { ...status }
                  : { status }

              // Log full error details
              console.error('❌ FullScreenChatbot: subscription error', {
                channelName,
                errorType: normalizedStatus?.type,
                errorStatus: normalizedStatus?.status,
                errorCode: normalizedStatus?.code,
                errorMessage: normalizedStatus?.error || normalizedStatus?.message,
                fullStatusObject: normalizedStatus,
                statusString: JSON.stringify(normalizedStatus, null, 2),
                socketId: client.connection.socket_id,
                authEndpoint: absoluteAuthEndpoint,
              })

              // Also log the raw status for debugging
              console.error('Raw status object:', status)
            })

            // Listen for authorization attempts
            safeChannelBind(channel, 'pusher:subscription_auth', (data: any) => {
              console.log('🔐 FullScreenChatbot: subscription auth attempt', {
                channelName,
                data,
                socketId: client.connection.socket_id,
              })
            })
          }

        pusherRef.current = client
        realtimeConfigSignatureRef.current = signature
        setRealtimeReady(true)
      } catch (error) {
        if (!cancelled) {
          console.error('FullScreenChatbot: failed to initialize realtime', error)
          setRealtimeReady(false)
        }
      }
    }

    void initializeRealtime()

    return () => {
      cancelled = true
    }
  }, [sessionToken, authUser?.id, dashboardUser?.id, chatAuthStatus])

  useEffect(() => {
    // Wait for chat auth store to be hydrated before loading contacts
    if (!isHydrated) {
      return
    }

    const lastToken = lastContactsLoadToken.current
    // Load contacts if:
    // 1. Not initialized yet, OR
    // 2. Session token changed (including null -> token or token -> null)
    const shouldLoad = !contactsInitialized || lastToken !== sessionToken

    if (shouldLoad) {
      lastContactsLoadToken.current = sessionToken ?? null

      // Get tenantId from chat auth store, auth user, or dashboard user (in priority order)
      const tenantId = chatAuthTenantId ?? authUser?.tenantId ?? dashboardUser?.tenantId ?? undefined

      console.log('[FullScreenChatbot] Loading contacts', {
        sessionToken: sessionToken ? 'present' : 'missing',
        tenantId: tenantId || 'not provided',
        contactsInitialized,
        lastToken: lastToken ? 'present' : 'missing',
        isHydrated,
      })

      // Load contacts even without sessionToken (for guest/public access)
      void loadContacts({ sessionToken: sessionToken ?? null, tenantId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, contactsInitialized, sessionToken, chatAuthTenantId, authUser?.tenantId, dashboardUser?.tenantId])

  useEffect(() => {
    setAvailableCommands([])
    setCommandsLoaded(false)
  }, [sessionToken])

  useEffect(() => {
    if (commandsLoaded) {
      return
    }

    let cancelled = false

    async function loadCommands() {
      try {
        const headers: HeadersInit | undefined = sessionToken
          ? { Authorization: `Bearer ${sessionToken}` }
          : undefined

        const response = await fetch('/api/chatbot/commands', { headers })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as {
          success?: boolean
          commands?: ChatbotCommandDefinition[]
        }

        if (!cancelled && data.success && Array.isArray(data.commands)) {
          setAvailableCommands(data.commands)
        }
      } catch (error) {
        if (!cancelled) {
          setAvailableCommands([])
        }
        console.warn('FullScreenChatbot: failed to load command catalog', error)
      } finally {
        if (!cancelled) {
          setCommandsLoaded(true)
        }
      }
    }

    void loadCommands()

    return () => {
      cancelled = true
    }
  }, [commandsLoaded, sessionToken])

  const memoryService = useMemo(() => {
    if (!sessionId) {
      return null
    }
    return new ClientMemoryService(sessionId)
  }, [sessionId])
  const currentUserId = chatAuthLinkedUserId ?? authUser?.id ?? dashboardUser?.id ?? null
  const currentTenantId = chatAuthTenantId ?? authUser?.tenantId ?? dashboardUser?.tenantId ?? contacts[0]?.tenantId ?? null
  const currentUserEmail = authUser?.email ?? dashboardUser?.email ?? null

  useEffect(() => {
    console.log('[FullScreenChatbot] Auth State Update:', {
      currentUserId,
      chatAuthLinkedUserId,
      authUser: !!authUser,
      dashboardUser: !!dashboardUser,
      sessionToken: !!sessionToken,
      isHydrated
    })
  }, [currentUserId, chatAuthLinkedUserId, authUser, dashboardUser, sessionToken, isHydrated])

  const syncPaymentNotifications = useCallback((records: PaymentNotificationRecord[]) => {
    if (!records.length) {
      return
    }

    setMessages(prev => {
      const existingIds = new Set((prev || []).map(message => message.id))
      const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
      const additions = (records || [])
        .filter(record => !existingIds.has(record.id))
        .map(record => ({
          id: record.id,
          role: 'assistant' as const,
          content: formatPaymentNotificationContent(record.payload, locale),
          timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
          type: 'text' as const,
        }))

      if (additions.length === 0) {
        return prev
      }

      const combined = [...prev, ...additions]
      combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      return combined
    })
  }, [setMessages])

  useEffect(() => {
    setChatbotOpen(true)
    resetUnreadPaymentNotifications()
    return () => {
      setChatbotOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    syncPaymentNotifications(paymentNotifications)
  }, [paymentNotifications, syncPaymentNotifications])

  useEffect(() => {
    // Only clear loaded threads when session actually ends (sessionToken becomes null)
    // Preserve message history when switching contacts or when currentUserId updates
    if (!sessionToken) {
      setUserThreads({})
      setCommandThreads({})
      userThreadLoadedRef.current = {}
    }
  }, [sessionToken])


  const commandLookup = useMemo(() => {
    const map = new Map<string, ChatbotCommandDefinition>()
    safeArray(availableCommands).forEach((command: any) => {
      if (command && typeof command === 'object' && isNonEmptyString(command.code)) {
        const key = safeStringOp(command.code).trim().toLowerCase()
        if (key) {
          map.set(key, command as ChatbotCommandDefinition)
        }
      }
    })
    return map
  }, [availableCommands])

  const latestMessage = useMemo(() => {
    return messages.length ? messages[messages.length - 1] : undefined
  }, [messages])

  // Stable fallback date to prevent infinite re-renders (only create once)
  const stableFallbackDate = useMemo(() => new Date(), [])

  const flowbotFallbackEntry = useMemo<SidebarEntry>(() => {
    return {
      id: 'flowbot',
      name: 'FlowBot',
      subtitle: 'Tu asistente virtual',
      lastMessage: normalizePreviewText(latestMessage?.content ?? 'Inicia la conversación con FlowBot.'),
      lastActivity: latestMessage?.timestamp ?? stableFallbackDate,
      isFlowbot: true,
      avatarUrl: null,
      unreadCount: 0,
    }
  }, [latestMessage, stableFallbackDate])

  const sidebarEntries = useMemo<SidebarEntry[]>(() => {
    const contactsArray = combinedContacts

    if (contactsArray.length === 0) {
      return [flowbotFallbackEntry]
    }

    const mapped = safeMap(contactsArray, (contact: any) => {
      if (!isValidContact(contact)) {
        console.warn('[FullScreenChatbot] Invalid contact skipped', contact)
        return null
      }

      const contactId = safeString(contact.id)
      const metadata = contact?.metadata && typeof contact.metadata === 'object' ? (contact.metadata as Record<string, unknown>) : null
      const whatsappSessionId = metadata && typeof metadata['whatsappSessionId'] === 'string' ? metadata['whatsappSessionId'].trim() : ''
      const whatsappJid = metadata && typeof metadata['whatsappJid'] === 'string' ? metadata['whatsappJid'].trim() : ''
      const isTenantUser = !contact.isFlowbot && (
        safeStringOp(contactId).startsWith('user:') ||
        contact.type === 'TENANT_USER'
      )
      const isWhatsAppContactEntry = Boolean(whatsappSessionId && whatsappJid)

      const userThreadMessages = safeArray<Message>(userThreads[contactId])
      const commandThreadMessages = safeArray<Message>(commandThreads[contactId])
      const threadMessages = contact.isFlowbot
        ? []
        : isTenantUser
          ? [...userThreadMessages, ...commandThreadMessages].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return timeA - timeB
          })
          : commandThreadMessages.length > 0
            ? commandThreadMessages
            : userThreadMessages

      const latestThreadMessage = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : null

      const peerUserId = isTenantUser ? safeStringOp(contactId).replace(/^user:/, '') : null
      const isOnline = peerUserId ? onlineUserIds.has(peerUserId) : false

      // Use API provided unreadCount if available, otherwise calculate from loaded messages
      const unreadCount = contact.isFlowbot
        ? 0
        : (typeof contact.unreadCount === 'number' ? contact.unreadCount : safeFilter(threadMessages, (msg: any) => msg?.role === 'assistant' && !msg?.readAt).length)

      const baseMessage = normalizePreviewText(
        contact.isFlowbot
          ? safeString(latestMessage?.content || 'Inicia la conversación con FlowBot.')
          : safeString(latestThreadMessage?.content || contact.description || 'Sin mensajes todavía')
      )

      const base: SidebarEntry = {
        id: contactId,
        name: safeString(contact.displayName || contact.name || 'Sin nombre'),
        subtitle: isTenantUser
          ? (isOnline ? 'En línea' : 'Desconectado')
          : isWhatsAppContactEntry
            ? whatsappJid || safeString(contact.description)
            : safeString(contact.description),
        lastMessage: baseMessage || 'Sin mensajes todavía',
        lastActivity: contact.isFlowbot
          ? (latestMessage?.timestamp ?? safeDate(contact.updatedAt) ?? undefined)
          : (latestThreadMessage?.timestamp ?? safeDate(contact.updatedAt) ?? undefined),
        isFlowbot: Boolean(contact.isFlowbot),
        avatarUrl: contact.isFlowbot ? (contact.avatarUrl || null) : (contact.avatarUrl || undefined),
        isOnline,
        unreadCount,
        type: contact.type,
        assignee: contact.assignee ?? null,
        sessionStatus: (metadata && typeof metadata['sessionStatus'] === 'string' && (metadata['sessionStatus'].toLowerCase() === 'open' || metadata['sessionStatus'].toLowerCase() === 'closed')) ? (metadata['sessionStatus'].toLowerCase() as 'open' | 'closed') : undefined,
        sessionStartTime: (metadata && (typeof metadata['sessionStartTime'] === 'string' || typeof metadata['sessionStartTime'] === 'number')) ? new Date(metadata['sessionStartTime']) : undefined,
      }

      if (contact.isFlowbot) {
        return {
          ...base,
          lastMessage: normalizePreviewText(safeString(latestMessage?.content)) || base.lastMessage,
          lastActivity: latestMessage?.timestamp ?? base.lastActivity ?? stableFallbackDate,
          unreadCount: 0, // FlowBot messages are not tracked as unread
        }
      }

      if (isWhatsAppContactEntry) {
        return base
      }

      return base
    })

    // Separate FlowBot from other contacts
    const flowbotEntry = mapped.find(entry => entry.isFlowbot)
    const nonFlowbotEntries = mapped.filter(entry => !entry.isFlowbot)

    // Sort only non-FlowBot entries by lastActivity descending
    const sortedNonFlowbot = nonFlowbotEntries.sort((a, b) => {
      const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
      const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
      return timeB - timeA
    })

    // FlowBot always at the top (index 0), followed by sorted contacts
    const finalEntries = flowbotEntry ? [flowbotEntry, ...sortedNonFlowbot] : [flowbotFallbackEntry, ...sortedNonFlowbot]

    // Deduplicate contacts with the same WhatsApp JID
    // Priority: User > ChatbotContact (if same JID, keep User, remove ChatbotContact)
    const jidToEntryMap = new Map<string, SidebarEntry>()
    const entriesToKeep: SidebarEntry[] = []

    finalEntries.forEach(entry => {
      const contact = combinedContacts.find((c: any) => c.id === entry.id)
      if (!contact) {
        entriesToKeep.push(entry)
        return
      }

      const metadata = contact?.metadata && typeof contact.metadata === 'object' ? (contact.metadata as Record<string, unknown>) : null
      const jid = metadata && typeof metadata['whatsappJid'] === 'string' ? metadata['whatsappJid'].trim() : null

      if (!jid) {
        // No JID, keep as-is
        entriesToKeep.push(entry)
        return
      }

      const existingEntry = jidToEntryMap.get(jid)
      if (!existingEntry) {
        // First contact with this JID, keep it
        jidToEntryMap.set(jid, entry)
        entriesToKeep.push(entry)
      } else {
        // Duplicate JID found - merge threads and prioritize User over ChatbotContact
        const existingContact = combinedContacts.find((c: any) => c.id === existingEntry.id)
        const isExistingUser = existingContact && (
          safeStringOp(existingEntry.id).startsWith('user:') ||
          existingContact.type === 'TENANT_USER'
        )
        const isCurrentUser = safeStringOp(entry.id).startsWith('user:') || contact.type === 'TENANT_USER'

        // CRITICAL: Merge threads from both contacts to get the true latest message
        const existingThreads = commandThreads[existingEntry.id] || []
        const currentThreads = commandThreads[entry.id] || []
        const allThreads = [...existingThreads, ...currentThreads]

        // Sort by timestamp and get the latest message
        const sortedThreads = allThreads.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timeA - timeB
        })
        const latestMessage = sortedThreads.length > 0 ? sortedThreads[sortedThreads.length - 1] : null

        if (isCurrentUser && !isExistingUser) {
          // Current is User, existing is not - replace with merged info
          const existingIndex = entriesToKeep.findIndex(e => e.id === existingEntry.id)
          if (existingIndex >= 0) {
            entriesToKeep[existingIndex] = {
              ...entry,
              lastMessage: latestMessage ? normalizePreviewText(latestMessage.content) : entry.lastMessage,
              lastActivity: latestMessage?.timestamp ?? entry.lastActivity,
            }
            jidToEntryMap.set(jid, entry)
          }
        } else {
          // Keep existing, but update with merged message info
          const existingIndex = entriesToKeep.findIndex(e => e.id === existingEntry.id)
          if (existingIndex >= 0) {
            entriesToKeep[existingIndex] = {
              ...existingEntry,
              lastMessage: latestMessage ? normalizePreviewText(latestMessage.content) : existingEntry.lastMessage,
              lastActivity: latestMessage?.timestamp ?? existingEntry.lastActivity,
            }
          }
        }
        // Discard current entry (it's been merged)
      }
    })

    // Enhanced logging to diagnose WhatsApp contact display
    const whatsappEntries = entriesToKeep.filter(entry => {
      const contact = combinedContacts.find((c: any) => c.id === entry.id)
      if (!contact) return false
      const metadata = contact?.metadata && typeof contact.metadata === 'object' ? (contact.metadata as Record<string, unknown>) : null
      const hasSessionId = metadata && typeof metadata['whatsappSessionId'] === 'string' && metadata['whatsappSessionId'].trim().length > 0
      const hasJid = metadata && typeof metadata['whatsappJid'] === 'string' && metadata['whatsappJid'].trim().length > 0
      return hasSessionId && hasJid
    })

    // Check for duplicate WhatsApp contacts (same JID or name)
    const jidToContacts = new Map<string, string[]>()
    whatsappEntries.forEach(entry => {
      const contact = combinedContacts.find((c: any) => c.id === entry.id)
      if (contact?.metadata && typeof contact.metadata === 'object') {
        const jid = (contact.metadata as Record<string, unknown>)['whatsappJid']
        if (typeof jid === 'string') {
          const existing = jidToContacts.get(jid) || []
          jidToContacts.set(jid, [...existing, entry.id])
        }
      }
    })

    const duplicateJids = Array.from(jidToContacts.entries()).filter(([_, ids]) => ids.length > 1)

    console.log('📋 [Sidebar Entries] WhatsApp contacts summary', {
      totalEntriesBeforeDedup: finalEntries.length,
      totalEntriesAfterDedup: entriesToKeep.length,
      removedDuplicates: finalEntries.length - entriesToKeep.length,
      whatsappEntriesCount: whatsappEntries.length,
      whatsappEntryIds: whatsappEntries.map(e => e.id),
      whatsappEntryNames: whatsappEntries.map(e => e.name),
      allEntryTypes: entriesToKeep.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        isFlowbot: e.isFlowbot,
      })),
      duplicateJids: duplicateJids.length > 0 ? duplicateJids.map(([jid, ids]) => ({
        jid,
        contactIds: ids,
        contactNames: ids.map(id => {
          const entry = whatsappEntries.find(e => e.id === id)
          return entry?.name || 'Unknown'
        }),
      })) : 'No duplicates',
      whatsappEntryDetails: whatsappEntries.map(e => {
        const contact = combinedContacts.find((c: any) => c.id === e.id)
        const metadata = contact?.metadata && typeof contact.metadata === 'object' ? (contact.metadata as Record<string, unknown>) : null
        return {
          id: e.id,
          name: e.name,
          jid: metadata?.['whatsappJid'] || 'N/A',
          sessionId: metadata?.['whatsappSessionId'] || 'N/A',
          type: contact?.type || 'N/A',
        }
      }),
    })

    // Final sort to ensure order is correct after merging/deduplication
    return entriesToKeep.sort((a, b) => {
      // 1. FlowBot always first
      if (a.isFlowbot) return -1
      if (b.isFlowbot) return 1

      // 2. Active open session takes priority over others (placing it just below Flowbot)
      const isAActiveOpen = a.id === selectedContactId && a.sessionStatus === 'open'
      const isBActiveOpen = b.id === selectedContactId && b.sessionStatus === 'open'
      if (isAActiveOpen && !isBActiveOpen) return -1
      if (!isAActiveOpen && isBActiveOpen) return 1

      // 3. Other open sessions follow
      const isAOpen = a.sessionStatus === 'open'
      const isBOpen = b.sessionStatus === 'open'
      if (isAOpen && !isBOpen) return -1
      if (!isAOpen && isBOpen) return 1

      // 4. Group members (open or closed) sorted by last activity
      const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
      const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0

      // Sort by last activity descending
      return timeB - timeA
    })
  }, [combinedContacts, flowbotFallbackEntry, latestMessage, onlineUserIdsKey, userThreads, commandThreads, stableFallbackDate, selectedContactId])

  const openSessions = useMemo(() =>
    sidebarEntries.filter(entry => entry.sessionStatus === 'open'),
    [sidebarEntries]
  )

  const openSessionsCount = openSessions.length

  const filteredSidebarEntries = useMemo(() => {
    const query = safeStringOp(sidebarQuery).trim().toLowerCase()
    if (!query) {
      return sidebarEntries
    }
    return safeFilter(sidebarEntries, (entry: any) => {
      if (!entry) return false
      const nameMatch = safeStringOp(entry.name).toLowerCase().includes(query)
      const subtitleMatch = safeStringOp(entry.subtitle).toLowerCase().includes(query)
      const lastMessageMatch = safeStringOp(entry.lastMessage).toLowerCase().includes(query)
      return nameMatch || subtitleMatch || lastMessageMatch
    })
  }, [sidebarEntries, sidebarQuery])

  // Create a stable key from sidebar entry IDs to prevent unnecessary effect runs
  const sidebarEntriesIdsKey = useMemo(() => {
    return sidebarEntries.map(e => e?.id || '').join(',')
  }, [sidebarEntries])

  // Use a ref to track the last set ID to prevent redundant state updates
  const lastSetContactIdRef = useRef<string | null>(null)
  const lastSidebarIdsKey = useRef<string>('')

  useEffect(() => {
    // Skip if contacts aren't initialized yet to prevent overwriting saved selection
    if (!contactsInitialized) {
      return
    }

    // Skip if sidebar IDs haven't actually changed
    if (lastSidebarIdsKey.current === sidebarEntriesIdsKey && selectedContactId) {
      return
    }
    lastSidebarIdsKey.current = sidebarEntriesIdsKey

    if (!sidebarEntries.length) {
      return
    }

    const firstEntryId = sidebarEntries[0]?.id
    if (!firstEntryId) {
      return
    }

    // Only update if selectedContactId is invalid or missing
    if (!selectedContactId) {
      // Prevent redundant setState calls with the same value
      if (lastSetContactIdRef.current !== firstEntryId) {
        setSelectedContactId(firstEntryId)
        lastSetContactIdRef.current = firstEntryId
      }
      return
    }

    // Check if current selection still exists
    const stillExists = sidebarEntries.some(entry => entry.id === selectedContactId)
    if (!stillExists) {
      // If this contact was loaded from localStorage, don't reset it yet
      // It might be a WhatsApp contact that will be added as a placeholder
      if (selectedContactId === selectedContactIdFromStorageRef.current) {
        console.log('⏭️ [Contact Selection] Preserving localStorage selection, waiting for contact to be added', {
          selectedContactId,
          sidebarContactIds: sidebarEntries.map(e => e.id),
        })
        return
      }

      // Only update if the ID is actually different
      if (selectedContactId !== firstEntryId && lastSetContactIdRef.current !== firstEntryId) {
        console.log('🔄 [Contact Selection] Resetting to first entry (contact no longer exists)', {
          previousContactId: selectedContactId,
          newContactId: firstEntryId,
        })
        setSelectedContactId(firstEntryId)
        lastSetContactIdRef.current = firstEntryId
      }
    } else {
      // Update ref to track current valid selection
      lastSetContactIdRef.current = selectedContactId
      // Clear the storage ref once the contact exists
      if (selectedContactId === selectedContactIdFromStorageRef.current) {
        selectedContactIdFromStorageRef.current = null
      }
    }
  }, [selectedContactId, sidebarEntries, contactsInitialized])

  const activeSidebarContact = useMemo<SidebarEntry>(() => {
    if (!(sidebarEntries || []).length) {
      return flowbotFallbackEntry
    }
    if (!selectedContactId) {
      return (sidebarEntries || [])[0]
    }
    return (sidebarEntries || []).find(entry => entry.id === selectedContactId) ?? (sidebarEntries || [])[0]
  }, [flowbotFallbackEntry, selectedContactId, sidebarEntries])

  const isFlowbotConversation = activeSidebarContact?.isFlowbot ?? false
  const activeContactRecord = useMemo(() => {
    if (!activeSidebarContact?.id) return undefined
    return safeFind(combinedContacts, (contact: any) => isValidContact(contact) && contact.id === activeSidebarContact.id)
  }, [combinedContacts, activeSidebarContact?.id])

  const tenantUserContacts = useMemo(
    () =>
      safeFilter(contacts, (contact: any) =>
        isValidContact(contact) && (
          safeStringOp(contact.id).startsWith('user:') ||
          contact.type === 'TENANT_USER'
        ),
      ),
    [contacts],
  )

  const crmAssignees = useMemo(() => {
    return safeMap<any, { id: string; name: string; email?: string | null }>(tenantUserContacts, (contact, index) => {
      if (!isValidContact(contact)) {
        return null
      }

      const rawId = safeString(contact.id)
      const cleanedId = rawId.replace(/^user:/, '') || rawId || `assignee-${index}`
      const candidateName = safeString(
        (contact as Record<string, unknown>).name ??
        (contact as Record<string, unknown>).displayName ??
        (contact as Record<string, unknown>).fullName ??
        '',
      ).trim()
      const name = candidateName || 'Operador'
      const emailValue = (contact as Record<string, unknown>).email
      const email = typeof emailValue === 'string' && emailValue.trim() ? emailValue.trim() : null

      return { id: cleanedId, name, email }
    })
  }, [tenantUserContacts])

  const crmTenantId = useMemo(() => {
    const normalizeTenant = (value: unknown): string | null => {
      if (typeof value !== 'string') {
        return null
      }
      const trimmed = value.trim()
      return trimmed || null
    }

    // Priority order: chatAuthTenantId > authUser > dashboardUser > activeContactRecord
    if (chatAuthTenantId) {
      return chatAuthTenantId
    }

    const tenantFromAuth = normalizeTenant(authUser?.tenantId)
    if (tenantFromAuth) {
      return tenantFromAuth
    }

    const tenantFromDashboard = normalizeTenant(dashboardUser?.tenantId)
    if (tenantFromDashboard) {
      return tenantFromDashboard
    }

    if (activeContactRecord && typeof activeContactRecord === 'object') {
      const candidate = normalizeTenant((activeContactRecord as Record<string, unknown>).tenantId)
      if (candidate) {
        return candidate
      }
    }

    return ''
  }, [chatAuthTenantId, authUser?.tenantId, dashboardUser?.tenantId, activeContactRecord])

  const crmCurrentUserId = useMemo(() => {
    const candidate = authUser?.id || dashboardUser?.id || sessionId
    return candidate ? safeString(candidate) || 'operator' : 'operator'
  }, [authUser?.id, dashboardUser?.id, sessionId])

  const crmCurrentUserName = useMemo(() => {
    const candidate = authUser?.name || dashboardUser?.name
    const normalized = candidate ? safeString(candidate).trim() : ''
    return normalized || 'Operador'
  }, [authUser?.name, dashboardUser?.name])

  const activeContactMetadata = useMemo(() => {
    const meta = activeContactRecord?.metadata
    if (meta && typeof meta === 'object') {
      return meta as Record<string, unknown>
    }
    return null
  }, [activeContactRecord?.metadata])

  const metadataUserId = useMemo(() => {
    if (!activeContactMetadata) {
      return null
    }
    const value = activeContactMetadata['userId']
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) {
        console.log('FullScreenChatbot: Extracted userId from metadata', {
          contactId: activeContactRecord?.id,
          userId: trimmed,
        })
        return trimmed
      }
    }
    return null
  }, [activeContactMetadata, activeContactRecord?.id])

  const metadataEmail = useMemo(() => {
    if (!activeContactMetadata) {
      return null
    }
    const value = activeContactMetadata['email']
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) {
        return trimmed
      }
    }
    return null
  }, [activeContactMetadata])

  const fallbackEmail = useMemo(() => {
    if (metadataEmail) {
      return metadataEmail
    }
    const description = activeContactRecord?.description
    if (description && typeof description === 'string' && description.includes('@')) {
      const trimmed = description.trim()
      if (trimmed) {
        return trimmed
      }
    }
    return null
  }, [metadataEmail, activeContactRecord?.description])

  const isTenantUserContact = !isFlowbotConversation && Boolean(
    metadataUserId ||
    (isValidContact(activeContactRecord) && (
      safeStringOp(activeContactRecord.id).startsWith('user:') ||
      (activeContactRecord as any).type === 'TENANT_USER'
    ))
  )
  const activePeerUserId = isTenantUserContact
    ? metadataUserId ?? (
      isValidContact(activeContactRecord)
        ? safeStringOp(activeContactRecord.id).replace(/^user:/, '')
        : null
    )
    : null

  const whatsappContactMap = useMemo(() => {
    const map = new Map<string, { sessionId: string; jid: string }>()
    combinedContacts.forEach((contact: any) => {
      if (!isValidContact(contact)) {
        return
      }
      const metadata = contact?.metadata

      // Log each contact's metadata for debugging
      if (metadata && typeof metadata === 'object') {
        const sessionId = (metadata as Record<string, unknown>)['whatsappSessionId']
        const jid = (metadata as Record<string, unknown>)['whatsappJid']

        const metadataObj = metadata as Record<string, unknown>
        const metadataKeys = Object.keys(metadataObj)
        const metadataValues = Object.keys(metadataObj).reduce((acc, key) => {
          acc[key] = typeof metadataObj[key] === 'string'
            ? (metadataObj[key] as string).substring(0, 100)
            : metadataObj[key]
          return acc
        }, {} as Record<string, unknown>)

        // Always log the actual metadata content clearly
        console.log('📱 [WhatsApp Contact Map] Checking contact', {
          contactId: contact.id,
          displayName: contact.displayName,
          hasMetadata: !!metadata,
          metadataType: typeof metadata,
          metadataKeys,
          metadataValues,
          hasWhatsappSessionId: !!sessionId,
          whatsappSessionId: sessionId,
          hasWhatsappJid: !!jid,
          whatsappJid: jid,
        })

        // Also log the full metadata as a separate log for detailed inspection
        console.log('📱 [WhatsApp Contact Map] Full metadata for contact', {
          contactId: contact.id,
          displayName: contact.displayName,
          fullMetadata: JSON.stringify(metadata, null, 2),
        })

        if (typeof sessionId === 'string' && sessionId.trim() && typeof jid === 'string' && jid.trim()) {
          map.set(contact.id, { sessionId: sessionId.trim(), jid: jid.trim() })
          console.log('✅ [WhatsApp Contact Map] Added contact to map', {
            contactId: contact.id,
            sessionId: sessionId.trim(),
            jid: jid.trim(),
          })
        } else {
          // Debug log: Not all contacts have WhatsApp info - this is normal
          console.log('📱 [WhatsApp Contact Map] Contact without WhatsApp info (normal if no linked WhatsApp account)', {
            contactId: contact.id,
            displayName: contact.displayName,
            phone: contact.phone,
            sessionIdType: typeof sessionId,
            sessionIdValue: sessionId,
            jidType: typeof jid,
            jidValue: jid,
          })
        }
      } else {
        // Skip warning for FlowBot - it doesn't need WhatsApp info
        const isFlowbot = contact.id === 'flowbot' || contact.isFlowbot || contact.type === 'FLOWBOT'
        if (!isFlowbot) {
          // Debug log: Some contacts may not have metadata - this is normal
          console.log('📱 [WhatsApp Contact Map] Contact has no metadata (normal for some contact types)', {
            contactId: contact.id,
            displayName: contact.displayName,
            hasMetadata: !!metadata,
            metadataType: typeof metadata,
            isFlowbot: false,
          })
        }
      }
    })
    // Enhanced logging to diagnose WhatsApp contact loading
    const whatsappContactDetails = Array.from(map.entries()).map(([id, data]) => {
      const contact = combinedContacts.find((c: any) => c.id === id)
      return {
        contactId: id,
        displayName: contact?.displayName || 'Unknown',
        sessionId: data.sessionId,
        jid: data.jid,
        hasMetadata: !!contact?.metadata,
      }
    })

    console.log('📱 [WhatsApp Contact Map] Updated', {
      totalContacts: combinedContacts.length,
      whatsappContacts: map.size,
      contactIds: Array.from(map.keys()),
      sessionIds: Array.from(map.values()).map(v => v.sessionId),
      whatsappContactDetails,
      allContactIds: combinedContacts.map((c: any) => c.id),
      contactsWithMetadata: combinedContacts.filter((c: any) => c.metadata).length,
      contactsWithoutMetadata: combinedContacts.filter((c: any) => !c.metadata).length,
    })
    return map
  }, [combinedContacts])

  const whatsappContactMapRef = useRef(whatsappContactMap)
  useEffect(() => {
    whatsappContactMapRef.current = whatsappContactMap
  }, [whatsappContactMap])

  const isWhatsAppContact = useMemo(() => {
    if (isFlowbotConversation) {
      return false
    }
    // Allow Users to also be WhatsApp contacts (for message merging)
    // Previously: if (isFlowbotConversation || isTenantUserContact) return false
    // Now: Only exclude FlowBot, allow Users to have WhatsApp

    // Primary check: metadata fields
    if (activeContactMetadata) {
      const sessionValue = activeContactMetadata['whatsappSessionId']
      const jidValue = activeContactMetadata['whatsappJid']
      const hasMetadata = (typeof sessionValue === 'string' && sessionValue.trim().length > 0) && (
        typeof jidValue === 'string' && jidValue.trim().length > 0
      )

      if (hasMetadata) {
        console.log('[FullScreenChatbot] WhatsApp contact detected via metadata', {
          contactId: activeSidebarContact.id,
          sessionId: sessionValue,
          jid: jidValue,
          isTenantUser: isTenantUserContact,
        })
        return true
      }
    }

    // Fallback check: whatsappContactMap
    if (activeSidebarContact.id && whatsappContactMap.has(activeSidebarContact.id)) {
      const mapData = whatsappContactMap.get(activeSidebarContact.id)
      console.log('[FullScreenChatbot] WhatsApp contact detected via whatsappContactMap', {
        contactId: activeSidebarContact.id,
        sessionId: mapData?.sessionId,
        jid: mapData?.jid,
        isTenantUser: isTenantUserContact,
      })
      return true
    }

    // Debug: log why detection failed (only for non-FlowBot contacts)
    if (!isFlowbotConversation) {
      console.log('[FullScreenChatbot] WhatsApp contact NOT detected', {
        contactId: activeSidebarContact.id,
        hasMetadata: !!activeContactMetadata,
        metadata: activeContactMetadata,
        isInMap: whatsappContactMap.has(activeSidebarContact.id),
        isTenantUser: isTenantUserContact,
      })
    }

    return false
  }, [activeContactMetadata, isFlowbotConversation, isTenantUserContact, activeSidebarContact.id, whatsappContactMap])

  const activePeerOnline = useMemo(() => {
    if (!activePeerUserId) {
      return false
    }
    return onlineUserIds.has(activePeerUserId)
  }, [activePeerUserId, onlineUserIdsKey])

  // Debug logging for peer user identification
  useEffect(() => {
    if (isTenantUserContact) {
      console.log('FullScreenChatbot: Tenant user contact identified', {
        contactId: activeContactRecord?.id,
        metadataUserId,
        activePeerUserId,
        fallbackEmail,
        metadata: activeContactMetadata,
      })
    }
  }, [isTenantUserContact, activeContactRecord?.id, metadataUserId, activePeerUserId, fallbackEmail, activeContactMetadata])

  // hasCrmTools: true if not FlowBot and not tenant user contact
  // Also allow CRM tools if user is authenticated (has tenantId) even without active contact
  // This enables loading contacts in right panel when authenticated
  const hasCrmTools = (!activeSidebarContact.isFlowbot && !isTenantUserContact) ||
    (!!chatAuthTenantId && !activeSidebarContact.isFlowbot)

  const whatsappJidToContactId = useMemo(() => {
    const map = new Map<string, string>()
    whatsappContactMap.forEach((value, key) => {
      map.set(value.jid, key)
    })

    console.log('🔍 [FullScreenChatbot] whatsappJidToContactId map built', {
      mapSize: map.size,
      contactsCount: contacts?.length,
      whatsappContactMapSize: whatsappContactMap.size,
      luciaEntry: Array.from(map.entries()).find(([jid, id]) => jid.includes('51916172368')),
      contactsWithJid: contacts?.filter((c: any) => {
        const meta = c.metadata as any
        return meta?.whatsappJid?.includes('51916172368')
      }).map((c: any) => ({ id: c.id, name: c.displayName, jid: c.metadata?.whatsappJid }))
    })

    return map
  }, [whatsappContactMap, contacts])

  // Build activeContactSnapshot similar to original implementation
  // In original: activeContact was activeContactRecord directly
  // We need to create a snapshot with tenantId and phone from activeContactRecord
  // But also include tenantId from authenticated user if no contact is selected
  const activeContactSnapshot = useMemo(() => {
    // Get fresh tenantId from store to avoid stale closure
    const currentAuthState = useChatAuthStore.getState()
    const storeTenantId = currentAuthState?.tenantId

    // Use chatAuthTenantId as primary source, then store value, then fallback to crmTenantId
    const effectiveTenantId = chatAuthTenantId || storeTenantId || crmTenantId || null

    // If we have activeContactRecord, use its tenantId and phone (matching original behavior)
    if (activeContactRecord) {
      const recordTenantId = typeof activeContactRecord.tenantId === 'string'
        ? activeContactRecord.tenantId.trim()
        : effectiveTenantId

      const phoneValue = typeof activeContactRecord.phone === 'string'
        ? activeContactRecord.phone.trim()
        : typeof activeContactMetadata?.phone === 'string'
          ? activeContactMetadata.phone.trim()
          : null

      const snapshot = {
        tenantId: recordTenantId || effectiveTenantId,
        phone: phoneValue || null,
      }

      console.log('[FullScreenChatbot] activeContactSnapshot from activeContactRecord', {
        recordTenantId,
        effectiveTenantId,
        phoneValue,
        snapshot,
      })

      return snapshot
    }

    // If no activeContactRecord but we have tenantId from authenticated user, create snapshot
    // This allows loading all customers for the tenant when user is authenticated
    if (effectiveTenantId) {
      const snapshot = {
        tenantId: effectiveTenantId,
        phone: null,
      }

      console.log('[FullScreenChatbot] activeContactSnapshot from authenticated user', {
        effectiveTenantId,
        chatAuthTenantId,
        storeTenantId,
        crmTenantId,
        snapshot,
      })

      return snapshot
    }

    console.log('[FullScreenChatbot] activeContactSnapshot: no tenantId available', {
      chatAuthTenantId,
      storeTenantId,
      crmTenantId,
      hasActiveContactRecord: !!activeContactRecord,
      chatAuthStatus,
    })

    return null
  }, [activeContactRecord, activeContactMetadata, crmTenantId, chatAuthTenantId, chatAuthStatus])

  // Get fresh sessionId from store to avoid stale closure
  const currentState = useChatAuthStore.getState()
  const effectiveSessionId = currentState?.sessionId || sessionId

  const {
    customers: crmCustomers,
    loading: loadingCustomers,
    selectedCustomerId,
    handleSelectCustomer,
    refreshCustomers: refreshCrmCustomers,
    upsertCustomer: upsertCrmCustomer,
  } = useCrmCustomers({
    crmFacade,
    crmActiveTab,
    hasCrmTools,
    activeContact: activeContactSnapshot,
    sessionId: effectiveSessionId,
    onCustomerSelected: customer => {
      toast.success('Cliente seleccionado', `Se utilizará ${customer.name} para generar enlaces de pago.`)
    },
  })

  const redirectToCrmHub = useCallback(() => {
    const params = new URLSearchParams()
    if (activeSidebarContact.id) {
      params.set('contactId', activeSidebarContact.id)
    }

    const email = activeContactRecord?.email || metadataEmail || fallbackEmail
    if (email) {
      params.set('email', email)
    }

    const redirectUrl = `/admin/crm?tickets=true${params.toString() ? '&' + params.toString() : ''}`
    console.log('Redirecting to CRM Hub for ticket creation:', redirectUrl)
    router.push(redirectUrl)
  }, [activeSidebarContact.id, activeContactRecord?.email, metadataEmail, fallbackEmail, router])

  const activeCommandThread = useMemo(() => {
    const thread = commandThreads[activeSidebarContact.id] ?? []
    console.log('🔄 [activeCommandThread] Recomputed', {
      contactId: activeSidebarContact.id,
      threadLength: thread.length,
      messageIds: thread.map(m => m.id).slice(-3),
    })
    return thread
  }, [activeSidebarContact.id, commandThreads])

  const activeUserThread = useMemo(() => {
    return userThreads[activeSidebarContact.id] ?? []
  }, [activeSidebarContact.id, userThreads])

  const conversationMessages = useMemo(() => {
    if (isFlowbotConversation) {
      return messages
    }
    const threadKey = activeSidebarContact.id

    // If contact is both a Tenant User AND has WhatsApp, merge both message threads
    const hasWhatsAppMessages = activeCommandThread.length > 0
    const hasUserMessages = activeUserThread.length > 0
    const isUserWithWhatsApp = isTenantUserContact && isWhatsAppContact && (hasWhatsAppMessages || hasUserMessages)

    let baseMessages: Message[] = []

    if (isUserWithWhatsApp) {
      // Merge WhatsApp and internal user messages, sorted by timestamp
      const merged = [...activeUserThread, ...activeCommandThread]
      baseMessages = merged.sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
        return timeA - timeB
      })

      console.log('🔄 [Conversation Messages] Merged WhatsApp and User messages', {
        contactId: threadKey,
        whatsappCount: activeCommandThread.length,
        userCount: activeUserThread.length,
        mergedCount: baseMessages.length,
      })
    } else if (isTenantUserContact) {
      // Tenant user only (no WhatsApp)
      baseMessages = activeUserThread
    } else {
      // WhatsApp contact only (not a tenant user)
      baseMessages = activeCommandThread
    }

    // Add scheduled message for this contact if it exists
    const scheduledForContact = scheduledMessages[threadKey]
    if (scheduledForContact && scheduledForContact.status !== 'SENT' && scheduledForContact.status !== 'CANCELLED') {
      const scheduledMessage: Message = {
        id: `scheduled-${scheduledForContact.id}`,
        role: 'user',
        content: scheduledForContact.content,
        timestamp: new Date(),
        type: 'text',
        scheduledFor: scheduledForContact.scheduledAt,
        deliveryStatus: 'scheduled',
      }
      return [...baseMessages, scheduledMessage]
    }

    console.log('📊 [conversationMessages] Recomputed', {
      contactId: threadKey,
      count: baseMessages.length,
      lastMessageId: baseMessages[baseMessages.length - 1]?.id,
    })

    return baseMessages
  }, [isFlowbotConversation, messages, isTenantUserContact, isWhatsAppContact, activeUserThread, activeCommandThread, activeSidebarContact.id, scheduledMessages])

  // Create a unified timeline of messages and session events
  const timelineItems = useMemo(() => {
    const contactId = activeSidebarContact?.id
    if (!contactId) return []

    // Ensure dates are parsed
    const msgs = conversationMessages.map(m => ({
      type: 'message' as const,
      data: m,
      date: new Date(m.timestamp)
    }))

    const summaries = (sessionSummaries[contactId] || []).map(s => ({
      type: 'session_end' as const,
      data: s,
      date: new Date(s.date) // End time
    }))

    const activities = (sessionActivities[contactId] || [])
      .filter(a => a.type === 'note') // Only care about notes for now
      .map(a => ({
        type: a.metadata?.type === 'session_start' ? 'session_start' as const
          : a.metadata?.type === 'transfer' ? 'transfer' as const
            : 'activity' as const, // Generic activity
        data: a,
        date: new Date(a.createdAt)
      }))

    return [...msgs, ...summaries, ...activities].sort((a, b) => {
      const timeDiff = a.date.getTime() - b.date.getTime()
      if (timeDiff !== 0) return timeDiff

      // If timestamps match, prioritize session_start before messages
      if (a.type === 'session_start') return -1
      if (b.type === 'session_start') return 1

      return 0
    })
  }, [conversationMessages, sessionSummaries, sessionActivities, activeSidebarContact?.id])

  const crmConversationMessages = useMemo(() => {
    return conversationMessages
      .slice(-20)
      .map(message => {
        const content = typeof message.content === 'string' ? message.content : ''
        const isWhatsApp = message.metadata?.source === 'whatsapp'

        // For WhatsApp messages, roles are inverted in the Message type:
        // - fromMe: true (operator message) was mapped to 'user'
        // - fromMe: false (customer message) was mapped to 'assistant'
        // For CRM/AI context, we need the opposite:
        // - customer messages should be 'user'
        // - operator messages should be 'assistant'
        const correctedRole = isWhatsApp
          ? (message.role === 'user' ? 'assistant' : 'user')
          : message.role

        return {
          role: correctedRole as 'user' | 'assistant',
          content,
          timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : undefined,
        }
      })
      .filter(item => Boolean(item.content && item.content.trim()))
  }, [conversationMessages])

  const refreshScheduledMessageForContact = useCallback(
    async (contactId: string | null | undefined) => {
      if (!contactId) {
        return
      }

      try {
        const headers: HeadersInit = {}
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`
        }

        const response = await fetch(`/api/chatbot/scheduled?contactId=${encodeURIComponent(contactId)}`, {
          headers,
        })

        if (!response.ok) {
          console.warn('FullScreenChatbot: failed to fetch scheduled messages', {
            contactId,
            status: response.status,
          })
          upsertScheduledMessage(contactId, null)
          return
        }

        const data = await response.json().catch(() => null)
        const records: Array<{
          id: string
          contactId?: string | null
          contactKey?: string | null
          sessionId?: string | null
          content: string
          scheduledAt: string
          status: ClientScheduledMessageStatus
          targetType?: 'FLOWBOT' | 'TENANT_USER'
          lastError?: string | null
        }> = Array.isArray(data?.messages) ? data.messages : []

        if (!records.length) {
          clearScheduledMessage([contactId])
          return
        }

        const sorted = [...records].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        )
        const first = sorted[0]
        const effectiveContactKey = first.contactKey ?? first.contactId ?? contactId
        upsertScheduledMessage(effectiveContactKey, {
          id: first.id,
          contactId: effectiveContactKey,
          sessionId: first.sessionId ?? null,
          content: first.content,
          scheduledAt: new Date(first.scheduledAt),
          status: first.status,
          targetType: first.targetType ?? 'FLOWBOT',
          lastError: first.lastError ?? null,
        })
      } catch (error) {
        console.error('FullScreenChatbot: error refreshing scheduled messages', error)
        clearScheduledMessage([contactId])
      }
    },
    [clearScheduledMessage, sessionToken, upsertScheduledMessage],
  )

  const cancelScheduledMessageById = useCallback(
    async (scheduledMessageId: string, contactId: string | null) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`
      }

      const response = await fetch('/api/chatbot/scheduled', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: scheduledMessageId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'No se pudo cancelar el mensaje programado')
      }

      clearScheduledMessage([contactId], scheduledMessageId)
    },
    [clearScheduledMessage, sessionToken],
  )

  const handleScheduleSelection = useCallback(
    async (date: Date | null) => {
      const contactId = activeSidebarContact.id
      if (!contactId) {
        return
      }

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`
      }

      if (!date) {
        const existing = scheduledMessages[contactId]
        if (!existing) {
          return
        }
        try {
          await cancelScheduledMessageById(existing.id, existing.contactId ?? contactId)
          toast.success('Programación cancelada')
        } catch (error) {
          console.error('FullScreenChatbot: failed to cancel scheduled message', error)
          toast.error(
            'No se pudo cancelar el mensaje programado',
            error instanceof Error ? error.message : 'Intenta nuevamente.',
          )
        }
        return
      }

      const trimmedContent = inputValue.trim()
      if (!trimmedContent) {
        toast.error('Escribe un mensaje para programar.')
        return
      }

      const targetType: 'FLOWBOT' | 'TENANT_USER' = isFlowbotConversation ? 'FLOWBOT' : 'TENANT_USER'
      if (targetType === 'FLOWBOT' && !sessionId) {
        toast.error('La sesión del chat no está lista todavía. Refresca la página e inténtalo de nuevo.')
        return
      }
      if (targetType === 'TENANT_USER' && !activePeerUserId) {
        toast.error('No se puede programar este mensaje', 'Selecciona un contacto válido e inténtalo nuevamente.')
        return
      }

      try {
        const response = await fetch('/api/chatbot/scheduled', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contactId,
            recipientId: targetType === 'TENANT_USER' ? activePeerUserId : null,
            sessionId: targetType === 'FLOWBOT' ? sessionId : null,
            content: trimmedContent,
            scheduledAt: date.toISOString(),
            targetType,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || 'No se pudo programar el mensaje')
        }

        const data = await response.json().catch(() => null)
        const message = data?.message
        if (message && typeof message === 'object') {
          const resolvedContactKey =
            (typeof message.contactKey === 'string' && message.contactKey) ||
            (typeof message.contactId === 'string' && message.contactId) ||
            contactId
          upsertScheduledMessage(resolvedContactKey, {
            id: message.id,
            contactId: resolvedContactKey,
            sessionId: message.sessionId ?? (targetType === 'FLOWBOT' ? sessionId ?? null : null),
            content: message.content ?? trimmedContent,
            scheduledAt: new Date(message.scheduledAt ?? date.toISOString()),
            status: message.status ?? 'PENDING',
            targetType: message.targetType ?? targetType,
            lastError: message.lastError ?? null,
          })
        } else {
          await refreshScheduledMessageForContact(contactId)
        }

        toast.success(
          'Mensaje programado',
          `Se enviará el ${date.toLocaleString('es-PE', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        )
        setScheduleSheetOpen(false)
      } catch (error) {
        console.error('FullScreenChatbot: failed to schedule message', error)
        toast.error('No se pudo programar el mensaje', error instanceof Error ? error.message : 'Intenta nuevamente.')
      }
    },
    [
      activePeerUserId,
      activeSidebarContact.id,
      inputValue,
      isFlowbotConversation,
      cancelScheduledMessageById,
      refreshScheduledMessageForContact,
      scheduledMessages,
      sessionId,
      sessionToken,
      upsertScheduledMessage,
    ],
  )

  useEffect(() => {
    if (scheduledEntries.length === 0) {
      return
    }

    let cancelled = false
    const dispatchToken = process.env.NEXT_PUBLIC_SCHEDULE_DISPATCH_TOKEN

    const triggerDispatch = async () => {
      try {
        const headers: HeadersInit = {}
        if (dispatchToken) {
          headers.Authorization = `Bearer ${dispatchToken}`
        }
        const response = await fetch('/api/chatbot/scheduled/dispatch', {
          method: 'POST',
          headers,
        })
        if (!response.ok) {
          console.warn('FullScreenChatbot: scheduled dispatch failed', { status: response.status })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('FullScreenChatbot: scheduled dispatch error', error)
        }
      }
    }

    void triggerDispatch()
    const interval = setInterval(triggerDispatch, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [scheduledEntries.length])

  const crmContactProfile = useMemo(() => {
    const type: 'flowbot' | 'tenant_user' | 'chat_contact' = activeSidebarContact.isFlowbot
      ? 'flowbot'
      : isTenantUserContact
        ? 'tenant_user'
        : 'chat_contact'

    const rawName = isValidContact(activeContactRecord)
      ? safeString((activeContactRecord as Record<string, unknown>).displayName ?? activeSidebarContact.name)
      : safeString(activeSidebarContact.name)
    const name = rawName.trim() || activeSidebarContact.name

    const recordEmail = typeof (activeContactRecord as any)?.email === 'string' ? (activeContactRecord as any).email.trim() : null
    const metadataEmailValue = typeof activeContactMetadata?.email === 'string' ? activeContactMetadata.email.trim() : null
    const descriptionEmail = typeof activeContactRecord?.description === 'string' && activeContactRecord.description.includes('@')
      ? activeContactRecord.description.trim()
      : null
    const email = recordEmail || metadataEmailValue || metadataEmail || fallbackEmail || descriptionEmail || null

    const metadataPhoneValue = typeof activeContactMetadata?.phone === 'string' ? activeContactMetadata.phone.trim() : null
    const recordPhoneValue = typeof activeContactRecord?.phone === 'string' ? activeContactRecord.phone.trim() : ''
    const phone = recordPhoneValue || metadataPhoneValue || null

    const id = type === 'chat_contact' && typeof activeContactRecord?.id === 'string'
      ? activeContactRecord.id
      : type === 'chat_contact'
        ? activeSidebarContact.id
        : null

    const tenantIdValue = typeof (activeContactRecord as Record<string, unknown> | null)?.tenantId === 'string'
      ? safeString((activeContactRecord as Record<string, unknown>).tenantId)
      : crmTenantId
    const tenantId = tenantIdValue?.trim() || null

    const isRegistered = Boolean(selectedCustomerId)
    const hasIdentifiers = Boolean(email) || Boolean(phone)
    const canRegister = type === 'chat_contact' && hasCrmTools && !isRegistered && hasIdentifiers
    const canEdit = type === 'chat_contact' && Boolean(id)

    return {
      id,
      name,
      email,
      phone,
      type,
      isRegistered,
      canRegister,
      canEdit,
      tenantId,
      metadata: activeContactMetadata ?? null,
    }
  }, [
    activeSidebarContact,
    activeContactRecord,
    activeContactMetadata,
    metadataEmail,
    fallbackEmail,
    selectedCustomerId,
    hasCrmTools,
    isTenantUserContact,
    crmTenantId,
  ])

  const handleAssignTicket = useCallback(() => {
    if (!hasCrmTools) {
      toast.info('Selecciona un contacto', 'Elige un cliente para asignar tickets.')
      return
    }
    toast.success('Ticket asignado', `${activeSidebarContact.name} ahora cuenta con seguimiento de soporte.`)
  }, [hasCrmTools, activeSidebarContact.name])

  const handleScheduleFollowUp = useCallback(() => {
    // Check if there's message content or files before opening scheduler
    const hasContent = inputValue.trim().length > 0 || selectedFiles.length > 0
    if (!hasContent) {
      toast.error('Mensaje vacío', 'Escribe un mensaje o adjunta archivos antes de programar el envío.')
      return
    }
    setScheduleSheetOpen(true)
  }, [inputValue, selectedFiles])

  const handleConvertToCustomer = useCallback(() => {
    if (!hasCrmTools) {
      toast.info('Selecciona un contacto', 'Escoge un cliente antes de actualizar su estado.')
      return
    }
    toast.success('Estado CRM actualizado', `${activeSidebarContact.name} pasó a la etapa de cliente activo.`)
  }, [hasCrmTools, activeSidebarContact.name])


  const handleLogNote = useCallback(() => {
    if (!hasCrmTools) {
      toast.info('Sin contacto seleccionado', 'Selecciona un cliente para agregar notas CRM.')
      return
    }
    toast.success('Nota registrada', `Se añadió una nota al perfil de ${activeSidebarContact.name}.`)
  }, [hasCrmTools, activeSidebarContact.name])

  const handleCreateCustomer = useCallback(
    async (input: { name: string; email: string; phone: string }): Promise<CrmCustomerSummary | null> => {
      if (!hasCrmTools) {
        toast.info('Selecciona un contacto', 'Elige un cliente del chat antes de registrar un contacto nuevo.')
        return null
      }

      if (!crmTenantId) {
        toast.error('No se pudo crear el cliente', 'Falta el identificador del tenant para registrar el contacto.')
        return null
      }

      const name = input.name.trim() || 'Cliente sin nombre'
      const email = input.email.trim()
      const phone = input.phone.trim()

      try {
        const customer = await crmFacade.createCustomer({
          tenantId: crmTenantId,
          name,
          email,
          phone,
          sessionId,
        })

        await upsertCrmCustomer(customer)
        refreshCrmCustomers()
        handleSelectCustomer(customer.id)
        toast.success('Cliente creado', `${customer.name} fue registrado en el CRM.`)
        return customer
      } catch (error) {
        console.error('FullScreenChatbot: failed to create CRM customer', error)
        toast.error('No se pudo registrar al cliente', 'Intenta nuevamente en unos segundos.')
        return null
      }
    },
    [
      hasCrmTools,
      crmTenantId,
      crmFacade,
      sessionId,
      upsertCrmCustomer,
      refreshCrmCustomers,
      handleSelectCustomer,
    ],
  )

  const handleRegisterContact = useCallback(async (): Promise<CrmCustomerSummary | null> => {
    if (!crmContactProfile.canRegister) {
      toast.info('Registro no disponible', 'Este contacto ya está registrado o no tiene información suficiente.')
      return null
    }

    return handleCreateCustomer({
      name: crmContactProfile.name || 'Cliente sin nombre',
      email: crmContactProfile.email ?? '',
      phone: crmContactProfile.phone ?? '',
    })
  }, [crmContactProfile, handleCreateCustomer, toast])

  const handleUpdateContact = useCallback(
    async ({ name, email, phone }: { name: string; email: string | null; phone: string | null }) => {
      if (!crmContactProfile.canEdit || !crmContactProfile.id) {
        toast.info('No editable', 'Selecciona un contacto del CRM para actualizar sus datos.')
        return false
      }

      const resolvedTenantId = (crmContactProfile.tenantId ?? crmTenantId) || undefined

      const success = await updateChatContact({
        contactId: crmContactProfile.id,
        tenantId: resolvedTenantId,
        displayName: name,
        phone,
        email,
      })

      if (success) {
        void loadContacts({ sessionToken, tenantId: resolvedTenantId })
      }

      return success
    },
    [crmContactProfile, updateChatContact, crmTenantId, sessionToken, loadContacts, toast],
  )

  const handleInsertTicketMessage = useCallback(
    (message: string) => {
      const normalized = message.trim()
      if (!normalized) {
        return
      }

      setInputValue(prev => {
        if (!prev) {
          return normalized
        }
        const needsSeparator = !prev.endsWith('\n')
        return `${prev}${needsSeparator ? '\n' : ''}${normalized}`
      })

      requestAnimationFrame(() => {
        composerRef.current?.focus()
      })
    },
    [],
  )

  useEffect(() => {
    if (crmActiveTab === 'create-tickets') {
      redirectToCrmHub()
    }
  }, [crmActiveTab, redirectToCrmHub])

  const preferredLanguage = useMemo<SupportedLanguage>(() => {
    if (typeof navigator === 'undefined') {
      return 'en'
    }
    return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
  }, [])

  useEffect(() => {
    if (welcomeInitialized) {
      return
    }

    let cancelled = false

    async function loadWelcome() {
      let config: FlowConfig | undefined

      try {
        const response = await fetch('/api/chatbot/config', { cache: 'no-store' })
        if (response.ok) {
          const data = (await response.json()) as { config?: FlowConfig }
          config = data.config
        }
      } catch (error) {
        console.warn('FullScreenChatbot: failed to fetch flow config for greeting', error)
      }

      if (cancelled) {
        return
      }

      const greeting = resolveGreeting(config, preferredLanguage)
      const quickActions = resolveQuickActions(config, preferredLanguage)

      const welcome: Message = {
        id: `${Date.now()}`,
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        type: 'text',
        quickActions,
      }

      setMessages([welcome])
      setWelcomeInitialized(true)
    }

    void loadWelcome()

    return () => {
      cancelled = true
    }
  }, [preferredLanguage, welcomeInitialized])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!composerContainerRef.current || typeof ResizeObserver === 'undefined') return

    const updateHeight = () => {
      const height = composerContainerRef.current?.offsetHeight ?? 0
      setComposerHeight(height)
    }

    updateHeight()
    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(composerContainerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (composerHeight) {
      scrollToBottom()
    }
  }, [composerHeight, scrollToBottom])

  // Remove blue focus indicators from composer shell
  useEffect(() => {
    const container = composerContainerRef.current
    if (!container) return

    const setWhiteFocusStyles = () => {
      container.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
      container.style.outlineColor = 'rgba(255, 255, 255, 0.8)'
      container.style.outlineOffset = '2px'
      container.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
      container.style.borderTopColor = 'rgba(0, 0, 0, 0.1)'
    }

    const handleFocusIn = (e: FocusEvent) => {
      setWhiteFocusStyles()
      requestAnimationFrame(() => {
        setWhiteFocusStyles()
      })
    }

    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focus', () => setWhiteFocusStyles())

    return () => {
      container.removeEventListener('focusin', handleFocusIn)
      container.removeEventListener('focus', () => setWhiteFocusStyles())
    }
  }, [])

  // Continuously apply white focus styles when textarea is focused and active
  useEffect(() => {
    const textarea = composerRef.current
    if (!textarea) return

    const applyWhiteFocusStyles = () => {
      if (document.activeElement === textarea) {
        textarea.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
        textarea.style.outlineOffset = '2px'
        textarea.style.outlineColor = 'rgba(255, 255, 255, 0.8)'
        textarea.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
        textarea.style.border = 'none'
        textarea.style.borderColor = 'transparent'
      }
    }

    // Apply on focus
    const handleFocus = () => {
      applyWhiteFocusStyles()
      requestAnimationFrame(() => {
        applyWhiteFocusStyles()
      })
    }

    // Apply on input (while typing)
    const handleInput = () => {
      applyWhiteFocusStyles()
    }

    // Monitor focus state periodically
    const interval = setInterval(() => {
      if (document.activeElement === textarea) {
        applyWhiteFocusStyles()
      }
    }, 100)

    textarea.addEventListener('focus', handleFocus)
    textarea.addEventListener('input', handleInput)

    return () => {
      textarea.removeEventListener('focus', handleFocus)
      textarea.removeEventListener('input', handleInput)
      clearInterval(interval)
    }
  }, [inputValue])



  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const viewport = window.visualViewport ?? null

    const applyRootMetrics = (height: number, keyboardHeight: number, keyboardOpen: boolean) => {
      if (typeof document === 'undefined') {
        return
      }
      const rootStyle = document.documentElement.style
      rootStyle.setProperty('--chat-app-height', `${Math.round(height)}px`)
      rootStyle.setProperty('--keyboard-height', `${Math.max(0, Math.round(keyboardHeight))}px`)
      rootStyle.setProperty('--keyboard-open', keyboardOpen ? '1' : '0')
      if (keyboardOpen) {
        document.body.classList.add('keyboard-open')
      } else {
        document.body.classList.remove('keyboard-open')
      }
    }

    const resetRootMetrics = () => {
      if (typeof document === 'undefined') {
        return
      }
      const rootStyle = document.documentElement.style
      rootStyle.setProperty('--chat-app-height', '100dvh')
      rootStyle.setProperty('--keyboard-height', '0px')
      rootStyle.setProperty('--keyboard-open', '0')
      document.body.classList.remove('keyboard-open')
    }

    const updateViewport = () => {
      if (!viewport) {
        const height = window.innerHeight
        setViewportHeight(height)
        setViewportOffsetTop(0)
        setKeyboardInset(0)
        applyRootMetrics(height, 0, false)
        return
      }

      const height = viewport.height
      const offsetTop = Math.max(0, viewport.offsetTop ?? 0)
      const layoutHeight = window.innerHeight || height + offsetTop
      const bottomInset = Math.max(0, layoutHeight - (height + offsetTop))
      const keyboardOpen = bottomInset > 0 || offsetTop > 0

      setViewportHeight(height)
      setViewportOffsetTop(offsetTop)
      setKeyboardInset(bottomInset)

      applyRootMetrics(height, bottomInset, keyboardOpen)
    }

    updateViewport()

    if (viewport) {
      viewport.addEventListener('resize', updateViewport)
      viewport.addEventListener('scroll', updateViewport, { passive: true })
      return () => {
        viewport.removeEventListener('resize', updateViewport)
        viewport.removeEventListener('scroll', updateViewport)
        resetRootMetrics()
      }
    }

    return () => {
      resetRootMetrics()
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const { style: htmlStyle } = document.documentElement
    const { style: bodyStyle } = document.body
    const previousHtmlOverflow = htmlStyle.overflow
    const previousBodyOverflow = bodyStyle.overflow
    const previousHtmlTouchAction = htmlStyle.touchAction
    const previousBodyTouchAction = bodyStyle.touchAction

    htmlStyle.overflow = 'hidden'
    bodyStyle.overflow = 'hidden'
    htmlStyle.touchAction = 'manipulation'
    bodyStyle.touchAction = 'manipulation'

    return () => {
      htmlStyle.overflow = previousHtmlOverflow
      bodyStyle.overflow = previousBodyOverflow
      htmlStyle.touchAction = previousHtmlTouchAction
      bodyStyle.touchAction = previousBodyTouchAction
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const metaViewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    if (!metaViewport) return

    const previousContent = metaViewport.getAttribute('content')
    const newContent = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

    metaViewport.setAttribute('content', newContent)

    return () => {
      if (previousContent !== null) {
        metaViewport.setAttribute('content', previousContent)
      } else {
        metaViewport.removeAttribute('content')
      }
    }
  }, [])

  const updateAssistantMessage = useCallback((id: string, content: string, quickActions?: Message['quickActions']) => {
    setMessages(prev =>
      (prev || []).map(msg =>
        msg.id === id
          ? {
            ...msg,
            content,
            quickActions: quickActions ?? msg.quickActions,
          }
          : msg,
      ),
    )
  }, [])

  const resolveCommandFromInput = useCallback(
    (rawInput: string): ChatbotCommandDefinition | null => {
      if (!isNonEmptyString(rawInput)) {
        return null
      }
      const trimmed = safeStringOp(rawInput).trim()
      if (!safeStringOp(trimmed).startsWith('@')) {
        return null
      }
      const parts = safeStringOp(trimmed).split(/\s+/)
      const token = parts.length > 0 ? safeStringOp(parts[0]).toLowerCase() : ''
      if (!token) {
        return null
      }
      return commandLookup?.get(token) ?? null
    },
    [commandLookup],
  )

  const executeCommandForThread = useCallback(
    async (command: ChatbotCommandDefinition, args: string) => {
      if (!sessionToken || !activeSidebarContact.id) {
        return
      }

      const contactId = activeSidebarContact.id
      setCommandExecuting(true)

      try {
        // Optimistic update
        const userMessage: Message = {
          id: `${Date.now()}-user`,
          role: 'user',
          content: args || command.code,
          timestamp: new Date(),
          type: 'text',
        }

        setCommandThreads(prev => {
          const existing = prev[contactId] ?? []
          return {
            ...prev,
            [contactId]: [...existing, userMessage],
          }
        })

        const response = await fetch('/api/chatbot/commands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            code: command.code,
            contactId,
          }),
        })

        if (!response.ok) {
          throw new Error('Command execution failed')
        }

        const payload = await response.json()

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: payload.message.content,
          timestamp: payload.message.renderedAt ? new Date(payload.message.renderedAt) : new Date(),
          type: 'text',
        }

        setCommandThreads(prev => {
          const existing = prev[contactId] ?? []
          return {
            ...prev,
            [contactId]: [...existing, assistantMessage],
          }
        })
      } catch (error) {
        console.error('FullScreenChatbot: command execution failed', error)
        toast.error('No pudimos ejecutar el comando', 'Intenta nuevamente o revisa la configuración de FlowBot.')

        const fallbackMessage: Message = {
          id: `${Date.now()}-command-error`,
          role: 'assistant',
          content: 'Lo siento, no pude obtener la información solicitada. Inténtalo de nuevo más tarde.',
          timestamp: new Date(),
          type: 'text',
        }

        setCommandThreads(prev => {
          const existing = prev[contactId] ?? []
          return {
            ...prev,
            [contactId]: [...existing, fallbackMessage],
          }
        })
      } finally {
        setCommandExecuting(false)
        scrollToBottom()
      }
    },
    [activeSidebarContact.id, currentTenantId, scrollToBottom, sessionToken],
  )

  const mapUserThreadMessage = useCallback(
    (record: {
      id: string
      senderId: string
      content: string
      createdAt: string | Date
      readAt?: string | Date | null
      deliveredAt?: string | Date | null
      editedAt?: string | Date | null
      isDeleted?: boolean
      deletedAt?: string | Date | null
      attachments?: any[]
    }): Message => {
      const isMe = record.senderId === currentUserId

      const baseMessage: Message = {
        id: record.id,
        role: (isMe ? 'user' : 'assistant') as 'user' | 'assistant',
        content: record.content,
        timestamp: new Date(record.createdAt),
        type: 'text' as const,
        readAt: record.readAt ? new Date(record.readAt) : null,
        deliveredAt: record.deliveredAt ? new Date(record.deliveredAt) : null,
        editedAt: record.editedAt ? new Date(record.editedAt) : null,
        isDeleted: record.isDeleted || false,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        attachments: safeMap(record.attachments, (att: any) => {
          if (!att || !att.id) return null
          return {
            id: safeString(att.id),
            filename: safeString(att.filename),
            originalName: safeString(att.originalName),
            mimeType: safeString(att.mimeType),
            size: att.size || 0,
            url: safeString(att.url),
            createdAt: safeDate(att.createdAt) || new Date(),
          }
        }),
        deliveryStatus:
          isMe
            ? (record.readAt
              ? 'read'
              : record.deliveredAt
                ? 'delivered'
                : 'sent') as 'read' | 'delivered' | 'sent'
            : undefined,
        metadata: {
          ...((record as any).metadata || {}),
          source: 'flowcast',
        },
      }

      // Merge persisted delivery status if available
      const persistedStatus = getDeliveryStatus(record.id)
      if (persistedStatus) {
        return {
          ...baseMessage,
          deliveryStatus: persistedStatus.deliveryStatus ?? baseMessage.deliveryStatus,
          deliveredAt: persistedStatus.deliveredAt ? new Date(persistedStatus.deliveredAt) : baseMessage.deliveredAt,
          readAt: persistedStatus.readAt ? new Date(persistedStatus.readAt) : baseMessage.readAt,
        }
      }

      return baseMessage
    },
    [currentUserId, getDeliveryStatus],
  )

  const handleRealtimeTenantMessage = useCallback(
    async (event: TenantUserThreadEvent) => {
      if (!currentUserId) {
        return
      }

      if (event.senderId !== currentUserId && event.recipientId !== currentUserId) {
        return
      }

      const peerUserId = event.senderId === currentUserId ? event.recipientId : event.senderId
      const contactKey = `user:${peerUserId}`
      const isIncomingMessage = event.senderId !== currentUserId

      setUserThreads(prev => {
        const existing = prev[contactKey] ?? []
        if (existing.some(message => message.id === event.id)) {
          return prev
        }

        const mapped = mapUserThreadMessage({
          id: event.id,
          senderId: event.senderId,
          content: event.content,
          createdAt: event.createdAt,
          attachments: event.attachments,
        })

        return {
          ...prev,
          [contactKey]: [...existing, mapped],
        }
      })

      userThreadLoadedRef.current[contactKey] = true

      if (event.senderId !== currentUserId && isTenantUserContact && activePeerUserId === peerUserId) {
        scrollToBottom()
      }

      // Send delivery receipt for incoming messages
      if (isIncomingMessage && sessionToken && currentTenantId) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (sessionToken) {
            headers.Authorization = `Bearer ${sessionToken}`
          }

          await fetch('/api/chat/user-threads/delivered', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              peerId: event.senderId,
              messageIds: [event.id],
            }),
          })
        } catch (error) {
          console.error('FullScreenChatbot: failed to send delivery receipt', error)
        }
      }
    },
    [currentUserId, mapUserThreadMessage, isTenantUserContact, activePeerUserId, scrollToBottom, sessionToken, currentTenantId],
  )

  // Use refs for auth state and contacts to avoid stale closures in event handlers
  const sessionTokenRef = useRef(sessionToken)
  const currentTenantIdRef = useRef(currentTenantId)
  const contactsRef = useRef(contacts)

  useEffect(() => {
    sessionTokenRef.current = sessionToken
    currentTenantIdRef.current = currentTenantId
    contactsRef.current = contacts
  }, [sessionToken, currentTenantId, contacts])

  const handleRealtimeContactUpdate = useCallback(
    (payload: any) => {
      const token = sessionTokenRef.current
      const tenantId = currentTenantIdRef.current
      const currentContacts = contactsRef.current

      console.log('🔄 [WhatsApp Event] Contact updated - reloading contacts', {
        contactId: payload.contactId,
        chatbotContactId: payload.chatbotContactId,
        jid: payload.jid,
        unreadCount: payload.unreadCount,
        lastMessageAt: payload.lastMessageAt,
        sessionToken: token ? 'present' : 'missing',
        currentTenantId: tenantId,
      })

      // If we have the contact locally, just update it
      // This avoids reloading the entire list which causes flickering/disappearing
      if (payload.contactId && payload.unreadCount !== undefined) {
        const { contactId, unreadCount, lastMessageAt, lastMessagePreview } = payload

        // Check if contact exists in store using the ref to avoid stale closure
        const contactExists = currentContacts.some(c => c.id === contactId)

        if (contactExists) {
          console.log('🔄 [WhatsApp Event] Updating contact locally', { contactId, unreadCount })
          syncContact(contactId, (contact) => ({
            ...contact,
            unreadCount,
            lastMessageAt: lastMessageAt || contact.lastMessageAt,
            lastMessagePreview: lastMessagePreview || contact.lastMessagePreview
          }))
          return
        }
      }

      // Fallback: Reload contacts if it's a new contact or we don't have it
      if (token && tenantId) {
        console.log('🔄 [WhatsApp Event] Calling loadContacts (fallback)', { sessionToken: 'present', tenantId })
        void loadContacts({ sessionToken: token, tenantId })
      } else {
        console.warn('🔄 [WhatsApp Event] Skipping loadContacts - missing token or tenant', { sessionToken: !!token, currentTenantId: tenantId })
      }
    },
    [loadContacts, syncContact],
  )


  // Keep track of selected contact for logging without affecting dependencies
  const selectedContactIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedContactIdRef.current = selectedContactId
  }, [selectedContactId])

  const handleRealtimeWhatsAppMessage = useCallback(
    (event: any) => {
      console.log('📨📨📨 [WhatsApp Event] Received message.received event 📨📨📨', {
        event,
        hasMessageId: !!event?.messageId,
        hasRemoteJid: !!event?.remoteJid,
        hasContactId: !!event?.contactId,
        hasContent: !!event?.content,
        hasSessionId: !!event?.sessionId,
        fullEvent: JSON.stringify(event, null, 2),
      })

      const messageId = typeof event?.messageId === 'string' ? event.messageId : null

      // CRITICAL: Global deduplication - check BEFORE any processing
      // This prevents triple display from: optimistic update + backend broadcast + Baileys event
      const eventId = event?.id || messageId

      console.log('🔍 [WhatsApp Event] Checking duplicate', {
        eventId,
        messageId,
        alreadyProcessed: eventId ? processedMessageIdsRef.current.has(eventId) : false,
        processedSetSize: processedMessageIdsRef.current.size,
        fromMe: event?.fromMe
      })

      if (eventId && processedMessageIdsRef.current.has(eventId)) {
        console.log('🔁 [WhatsApp Event] GLOBAL DEDUP: Message already processed, skipping', { eventId, messageId })
        return
      }
      // Mark as processed immediately
      if (eventId) {
        processedMessageIdsRef.current.add(eventId)
        // Cleanup old entries after 60 seconds to prevent memory leak
        setTimeout(() => {
          processedMessageIdsRef.current.delete(eventId)
        }, 60000)
      }

      // NOTE: We no longer skip fromMe messages here early.
      // Messages sent from the PHONE (not web app) are also fromMe=true but should be displayed.
      // The deduplication logic inside applyToContactThread (lines ~3687-3708) handles:
      // 1. Web-sent messages: Already exist with optimistic flag, so duplicates are filtered
      // 2. Phone-sent messages: Not in thread yet, so they get added
      // EXCEPTION: FlowBot messages (source='flowbot') follow the same path
      console.log('📱 [WhatsApp Event] Processing message (fromMe check removed)', {
        eventId,
        messageId,
        fromMe: event?.fromMe,
        source: event?.source,
      })

      const remoteJid = typeof event?.remoteJid === 'string' ? event.remoteJid : null
      const contactIdFromEvent = typeof event?.contactId === 'string' ? event.contactId : null

      // CRITICAL FIX: Resolve contact ID with preference for the currently active contact
      // If the incoming message's JID matches the active contact's JID, use the active contact ID.
      // This handles cases where multiple contacts (e.g. Admin User vs WhatsApp Contact) share the same JID.
      // We force this override even if contactIdFromEvent is present, because the backend might send the "wrong" ID (e.g. the WhatsApp contact ID instead of the Admin User ID).
      let contactId = contactIdFromEvent

      if (remoteJid) {
        const activeContactId = selectedContactIdRef.current
        const activeContactJid = activeContactId ? whatsappContactMapRef.current.get(activeContactId)?.jid : null

        if (activeContactId && activeContactJid === remoteJid) {
          console.log('🎯 [WhatsApp Event] JID matches active contact, forcing active contact ID', {
            remoteJid,
            activeContactId,
            originalContactId: contactIdFromEvent,
            mapResolvedId: whatsappJidToContactId.get(remoteJid)
          })
          contactId = activeContactId
        } else {
          // Check if we have a known contact for this JID
          const knownMatchId = whatsappJidToContactId.get(remoteJid)

          // If we have a known match, and the event's contactId is either missing OR unknown (not in our list),
          // use the known match. This prevents creating transient duplicates for deleted contacts.
          if (knownMatchId && (!contactId || !knownContactIdsRef.current.has(contactId))) {
            console.log('🎯 [WhatsApp Event] Found known contact for JID, overriding unknown/missing event ID', {
              remoteJid,
              knownMatchId,
              originalContactId: contactIdFromEvent
            })
            contactId = knownMatchId
          } else if (!contactId) {
            // Fallback if no contactId and no known match
            contactId = knownMatchId ?? null
          }
        }
      }

      const sessionId = typeof event?.sessionId === 'string' ? event.sessionId : null
      const contactName = typeof event?.contactName === 'string' ? event.contactName : null

      console.log('🔍 [WhatsApp Event] ContactId resolution', {
        contactIdFromEvent,
        remoteJid,
        resolvedContactId: contactId,
        currentActiveContactId: selectedContactIdRef.current,
        isMatch: contactId === selectedContactIdRef.current,
        isInWhatsappJidMap: remoteJid ? whatsappJidToContactId.has(remoteJid) : false,
        isKnownContact: contactId ? knownContactIdsRef.current.has(contactId) : false,
        isInWhatsappContactMap: contactId ? whatsappContactMap.has(contactId) : false,
      })

      if (!contactId) {
        console.error('❌ [WhatsApp Event] No contactId found, aborting message processing', {
          contactIdFromEvent,
          remoteJid,
          messageId,
        })
        return
      }

      if (!knownContactIdsRef.current.has(contactId)) {
        setTransientWhatsAppContacts(prev => {
          if (prev[contactId]) {
            return prev
          }

          const resolvedName = (typeof contactName === 'string' && contactName.trim())
            ? contactName.trim()
            : remoteJid ?? 'Contacto de WhatsApp'
          const nowIso = new Date().toISOString()

          return {
            ...prev,
            [contactId]: {
              id: contactId,
              tenantId: currentTenantId ?? 'default',
              type: 'CONTACT',
              displayName: resolvedName,
              phone: null,
              avatarUrl: null,
              description: remoteJid ?? null,
              isFlowbot: false,
              createdAt: nowIso,
              updatedAt: nowIso,
              metadata: {
                whatsappSessionId: sessionId ?? null,
                whatsappJid: remoteJid ?? null,
                contactName: resolvedName,
                placeholder: true,
              },
            },
          }
        })
      }

      if (!whatsappContactMapRef.current.has(contactId)) {
        if (!missingWhatsAppContactsRef.current.has(contactId)) {
          missingWhatsAppContactsRef.current.add(contactId)
          void loadContacts({
            sessionToken: sessionToken ?? null,
            tenantId: currentTenantId ?? undefined,
          })
        }
      }

      const metadataBase: Record<string, unknown> = {}
      if (event?.metadata && typeof event.metadata === 'object') {
        Object.assign(metadataBase, event.metadata as Record<string, unknown>)
      }
      if (sessionId && !metadataBase['whatsappSessionId']) {
        metadataBase.whatsappSessionId = sessionId
      }
      if (contactIdFromEvent && !metadataBase['contactId']) {
        metadataBase.contactId = contactIdFromEvent
      }
      if (contactName && !metadataBase['contactName']) {
        metadataBase.contactName = contactName
      }
      if (remoteJid && !metadataBase['remoteJid']) {
        metadataBase.remoteJid = remoteJid
      }

      const dto = {
        id: typeof event?.id === 'string' ? event.id : messageId ?? `wa-${Date.now()}`,
        messageId: messageId ?? (typeof event?.id === 'string' ? event.id : `wa-${Date.now()}`),
        fromMe: Boolean(event?.fromMe),
        content: typeof event?.content === 'string' ? event.content : null,
        timestamp: event?.timestamp ?? new Date().toISOString(),
        status: normalizeWhatsAppStatus(event?.status ?? (event?.fromMe ? 'SENT' : 'DELIVERED')),
        remoteJid,
        metadata: Object.keys(metadataBase).length ? metadataBase : null,
      }

      console.log('[WhatsApp] Received message event', {
        contactId,
        messageId,
        fromMe: dto.fromMe,
        hasContent: !!dto.content,
        contentLength: dto.content?.length ?? 0,
        contentPreview: dto.content ? dto.content.substring(0, 50) : null,
        event,
      })


      // Skip messages we sent ourselves (fromMe=true) ONLY if they are already in the thread
      // This allows messages sent from the phone to appear, while preventing double display of optimistically sent messages
      // NOTE: We check for duplicates inside applyToContactThread using functional state updates
      // to avoid stale closure issues with commandThreads in the dependency array

      const mapped = mapWhatsAppDtoToMessage(dto)

      console.log('[WhatsApp] Mapped message', {
        id: mapped.id,
        role: mapped.role,
        hasContent: !!mapped.content,
        contentLength: mapped.content?.length ?? 0,
        contentPreview: mapped.content ? mapped.content.substring(0, 50) : null,
      })

      // Merge persisted delivery status if available
      const persistedStatus = getDeliveryStatus(mapped.id)
      const finalMessage = persistedStatus
        ? {
          ...mapped,
          deliveryStatus: persistedStatus.deliveryStatus ?? mapped.deliveryStatus,
          deliveredAt: persistedStatus.deliveredAt ? new Date(persistedStatus.deliveredAt) : mapped.deliveredAt,
          readAt: persistedStatus.readAt ? new Date(persistedStatus.readAt) : mapped.readAt,
        }
        : mapped

      console.log('💾 [WhatsApp Event] Adding message to commandThreads', {
        contactId,
        messageId: finalMessage.id,
        role: finalMessage.role,
        contentPreview: finalMessage.content?.substring(0, 50),
      })

      applyToContactThread(contactId, current => {
        const incomingMessageId = typeof finalMessage.metadata?.messageId === 'string' ? finalMessage.metadata.messageId : finalMessage.id

        // Check if this exact message ID already exists (using FRESH state from React)
        const isDuplicate = current.some(existing => {
          const existingMessageId = typeof existing.metadata?.messageId === 'string' ? existing.metadata.messageId : existing.id
          if (existingMessageId === incomingMessageId) return true

          // FALLBACK: Content-based deduplication for essentially identical messages (sent within 2 seconds of each other)
          // This catches cases where the backend might send slightly different IDs for the same event
          // or if optimistic updates have different IDs but same content
          if (
            existing.content === finalMessage.content &&
            existing.role === finalMessage.role &&
            Math.abs(new Date(existing.timestamp).getTime() - new Date(finalMessage.timestamp).getTime()) < 2000
          ) {
            console.log('👯 [WhatsApp Event] Content-based duplicate detected', {
              contactId,
              content: finalMessage.content,
              timeDiff: Math.abs(new Date(existing.timestamp).getTime() - new Date(finalMessage.timestamp).getTime())
            })
            return true
          }

          return false
        })

        if (isDuplicate) {
          console.log('⏭️ [WhatsApp Event] Duplicate message detected, skipping', {
            contactId,
            messageId: incomingMessageId,
            fromMe: dto.fromMe,
          })
          return current
        }

        // For outgoing messages (fromMe=true), check if already in thread to avoid duplicates
        if (dto.fromMe) {
          // Check if this message ID is already in the thread (optimistic or otherwise)
          const alreadyExists = current.some(m => {
            const existingMessageId = typeof m.metadata?.messageId === 'string' ? m.metadata.messageId : m.id
            return existingMessageId === incomingMessageId || m.id === finalMessage.id
          })

          if (alreadyExists) {
            console.log('⏭️ [WhatsApp Frontend] Skipping duplicate fromMe message (already exists)', {
              contactId,
              messageId: incomingMessageId,
              id: finalMessage.id,
            })
            return current
          }

          console.log('📥 [WhatsApp Frontend] Processing fromMe message (not found in thread - likely sent from phone)', {
            contactId,
            messageId: incomingMessageId,
          })
        }

        // For outgoing messages, remove any optimistic placeholders
        let filtered = current
        if (dto.fromMe) {
          filtered = current.filter(existing => !existing.metadata?.optimistic)
        }

        const updated = [...filtered, finalMessage]
        console.log('✅ [WhatsApp Event] Message added to thread', {
          contactId,
          messageId: incomingMessageId,
          fromMe: dto.fromMe,
          threadLength: updated.length,
          previousLength: current.length,
        })
        return updated
      })

      // CRITICAL: Update ALL other contacts that share the same JID
      // This ensures sidebar entries update even when viewing a different contact
      if (remoteJid) {
        const allContactsWithJid: string[] = []
        whatsappContactMapRef.current.forEach((info, cid) => {
          if (info.jid === remoteJid && cid !== contactId) {
            allContactsWithJid.push(cid)
          }
        })

        if (allContactsWithJid.length > 0) {
          console.log('🔄 [WhatsApp Event] Syncing message to other contacts with same JID', {
            remoteJid,
            primaryContactId: contactId,
            otherContactIds: allContactsWithJid,
            messageId: finalMessage.id,
          })

          allContactsWithJid.forEach(otherContactId => {
            applyToContactThread(otherContactId, current => {
              const incomingMessageId = typeof finalMessage.metadata?.messageId === 'string'
                ? finalMessage.metadata.messageId
                : finalMessage.id

              // Skip if already exists
              const isDuplicate = current.some(existing => {
                const existingMessageId = typeof existing.metadata?.messageId === 'string'
                  ? existing.metadata.messageId
                  : existing.id
                return existingMessageId === incomingMessageId
              })

              if (isDuplicate) {
                return current
              }

              return [...current, finalMessage]
            })
          })
        }
      }
    },
    [
      whatsappJidToContactId,
      // REMOVED: whatsappContactMap - using ref to stabilize handler
      currentTenantId,
      loadContacts,
      sessionToken,
      // ❌ REMOVED: commandThreads - causes stale closure
      applyToContactThread,
      getDeliveryStatus,
      normalizeWhatsAppStatus,
      mapWhatsAppDtoToMessage,
    ],
  )

  const handleFlowbotSent = useCallback((event: any) => {
    console.log('🤖 [FlowBot Event] Received flowbot.sent event', event)

    // Map flowbot event to whatsapp message event structure
    const mappedEvent = {
      ...event,
      remoteJid: event.jid,
      content: event.text,
      fromMe: true,
      status: 'SENT',
      // Ensure we have a messageId
      messageId: event.messageId || `flowbot-${Date.now()}`,
    }

    handleRealtimeWhatsAppMessage(mappedEvent)
  }, [handleRealtimeWhatsAppMessage])

  const handleRealtimeWhatsAppStatus = useCallback(
    (event: any) => {
      const messageId = typeof event?.messageId === 'string' ? event.messageId : null
      if (!messageId) {
        return
      }

      const remoteJid = typeof event?.remoteJid === 'string' ? event.remoteJid : null
      const contactIdFromEvent = typeof event?.contactId === 'string' ? event.contactId : null

      // CRITICAL FIX: Resolve contact ID with preference for the currently active contact
      // Same logic as handleRealtimeWhatsAppMessage
      let contactId = contactIdFromEvent

      if (remoteJid) {
        const activeContactId = selectedContactIdRef.current
        const activeContactJid = activeContactId ? whatsappContactMap.get(activeContactId)?.jid : null

        if (activeContactId && activeContactJid === remoteJid) {
          console.log('🎯 [WhatsApp Status] JID matches active contact, forcing active contact ID', {
            remoteJid,
            activeContactId,
            originalContactId: contactIdFromEvent,
            status: event?.status
          })
          contactId = activeContactId
        } else if (!contactId) {
          contactId = whatsappJidToContactId.get(remoteJid) ?? null
        }
      }

      if (!contactId) {
        return
      }

      const status = normalizeWhatsAppStatus(event?.status)
      const deliveredAt = parseEventDate(event?.deliveredAt)
      const readAt = parseEventDate(event?.readAt)

      applyToContactThread(contactId, current => {
        let changed = false
        const next = current.map(existing => {
          const existingKey = typeof existing.metadata?.messageId === 'string' ? existing.metadata.messageId : existing.id
          if (existingKey === messageId) {
            changed = true
            const updated = updateMessageDeliveryState(existing, status, deliveredAt ?? undefined, readAt ?? undefined)

            // Persist WhatsApp delivery status
            const deliveryStatus = status === 'READ' ? 'read' : status === 'DELIVERED' ? 'delivered' : 'sent'
            updateDeliveryStatus(existing.id, contactId, {
              deliveryStatus,
              deliveredAt: deliveredAt ?? undefined,
              readAt: readAt ?? undefined,
            })

            return updated
          }
          return existing
        })

        return changed ? next : current
      })
    },
    [applyToContactThread, normalizeWhatsAppStatus, parseEventDate, whatsappJidToContactId, updateDeliveryStatus],
  )

  const handleRealtimeDeliveryReceipt = useCallback(
    (event: { tenantId: string; threadKey: string; recipientId: string; messageIds: string[]; deliveredAt: string }) => {
      if (!currentUserId) {
        return
      }

      // threadKey now uses '--' separator instead of ':'
      const participants = safeStringOp(event.threadKey).split('--').filter(p => isNonEmptyString(p))
      if (!participants.includes(currentUserId)) {
        return
      }

      const peerUserId = (participants || []).find(id => id !== currentUserId) ?? currentUserId
      const contactKey = `user:${peerUserId}`
      const deliveredAtDate = new Date(event.deliveredAt)

      setUserThreads(prev => {
        const existing = prev[contactKey]
        if (!existing || !Array.isArray(existing) || existing.length === 0) {
          return prev
        }

        let changed = false
        const updated = (existing || []).map(message => {
          if (event.messageIds?.includes(message.id)) {
            // Only update if message is from current user (sender) and not yet delivered
            if (message.role === 'user' && (!message.deliveredAt || message.deliveredAt.getTime() !== deliveredAtDate.getTime())) {
              changed = true

              // Persist delivery status
              updateDeliveryStatus(message.id, contactKey, {
                deliveryStatus: message.readAt ? 'read' : 'delivered',
                deliveredAt: deliveredAtDate,
              })

              return {
                ...message,
                deliveredAt: deliveredAtDate,
                deliveryStatus: (message.readAt ? 'read' : 'delivered') as 'read' | 'delivered',
              }
            }
          }
          return message
        })

        if (!changed) {
          return prev
        }

        return {
          ...prev,
          [contactKey]: updated,
        }
      })
    },
    [currentUserId, updateDeliveryStatus],
  )

  const handleRealtimeReadReceipt = useCallback(
    (event: TenantUserThreadReadEvent) => {
      if (!currentUserId) {
        return
      }

      // threadKey now uses '--' separator instead of ':'
      const participants = safeStringOp(event.threadKey).split('--').filter(p => isNonEmptyString(p))
      if (!participants.includes(currentUserId)) {
        return
      }

      const peerUserId = (participants || []).find(id => id !== currentUserId) ?? currentUserId
      const contactKey = `user:${peerUserId}`
      const readAtDate = new Date(event.readAt)

      setUserThreads(prev => {
        const existing = prev[contactKey]
        if (!existing || !Array.isArray(existing) || existing.length === 0) {
          return prev
        }

        let changed = false
        const updated = (existing || []).map(message => {
          if (event.messageIds?.includes(message.id)) {
            if (!message.readAt || message.readAt.getTime() !== readAtDate.getTime()) {
              changed = true

              // Persist read status
              updateDeliveryStatus(message.id, contactKey, {
                deliveryStatus: message.role === 'user' ? 'read' : message.deliveryStatus,
                readAt: readAtDate,
              })

              return {
                ...message,
                readAt: readAtDate,
                deliveryStatus: message.role === 'user' ? 'read' : message.deliveryStatus,
              }
            }
          }
          return message
        })

        if (!changed) {
          return prev
        }

        return {
          ...prev,
          [contactKey]: updated,
        }
      })
    },
    [currentUserId, updateDeliveryStatus],
  )

  const handleScheduledRealtimeUpdate = useCallback(
    (event: any) => {
      if (!event) {
        return
      }

      const payload = typeof event === 'object' && event ? event : {}
      const contactIdRaw =
        typeof payload.contactId === 'string' && payload.contactId
          ? payload.contactId
          : typeof payload.payload?.contactId === 'string'
            ? payload.payload.contactId
            : null
      const contactKey =
        typeof payload.contactKey === 'string' && payload.contactKey
          ? payload.contactKey
          : typeof payload.payload?.contactKey === 'string'
            ? payload.payload.contactKey
            : contactIdRaw
      const status = (payload.status || payload.payload?.status) as ClientScheduledMessageStatus | undefined
      const scheduledAtValue =
        typeof payload.scheduledAt === 'string'
          ? payload.scheduledAt
          : typeof payload.payload?.scheduledAt === 'string'
            ? payload.payload.scheduledAt
            : null
      const scheduledMessageId =
        typeof payload.scheduledMessageId === 'string'
          ? payload.scheduledMessageId
          : typeof payload.id === 'string'
            ? payload.id
            : ''

      if (!scheduledMessageId) {
        return
      }

      if (status === 'SENT' || status === 'CANCELLED') {
        const keysToClear: Array<string | null | undefined> = [
          contactKey,
          contactIdRaw,
          !contactKey && !contactIdRaw ? activeSidebarContact?.id : null,
        ]
        clearScheduledMessage(keysToClear, scheduledMessageId)
        if (status === 'SENT') {
          const activeKey = activeSidebarContact?.id ?? null
          if (
            (contactKey && activeKey === contactKey) ||
            (!contactKey && contactIdRaw && activeKey === contactIdRaw) ||
            (!contactKey && !contactIdRaw && scheduledEntries.length <= 1)
          ) {
            setInputValue('')
            setSelectedFiles([])
          }
        }
        return
      }

      if (!contactKey) {
        return
      }

      if (!scheduledAtValue) {
        void refreshScheduledMessageForContact(contactKey)
        return
      }

      const content =
        typeof payload.content === 'string'
          ? payload.content
          : typeof payload.payload?.content === 'string'
            ? payload.payload.content
            : ''
      const lastError =
        typeof payload.lastError === 'string'
          ? payload.lastError
          : typeof payload.payload?.lastError === 'string'
            ? payload.payload.lastError
            : null
      const targetType =
        (payload.targetType ?? payload.payload?.targetType ?? 'FLOWBOT') as 'FLOWBOT' | 'TENANT_USER'

      upsertScheduledMessage(contactKey, {
        id: scheduledMessageId,
        contactId: contactKey,
        sessionId: null,
        content,
        scheduledAt: new Date(scheduledAtValue),
        status: status ?? 'PENDING',
        targetType,
        lastError,
      })
    },
    [
      activeSidebarContact?.id,
      clearScheduledMessage,
      refreshScheduledMessageForContact,
      scheduledEntries.length,
      setInputValue,
      setSelectedFiles,
      upsertScheduledMessage,
    ],
  )

  const handleRealtimeTyping = useCallback(
    (event: TypingEventPayload) => {
      if (!currentUserId || !event) {
        return
      }

      if (event.userId === currentUserId) {
        return
      }

      const participants = safeStringOp(event.threadKey).split(':').filter(p => isNonEmptyString(p))
      if (!participants.includes(currentUserId)) {
        return
      }

      const peerUserId = (participants || []).find(id => id !== currentUserId)
      if (!peerUserId) {
        return
      }

      const contactKey = `user:${peerUserId}`

      if (event.isTyping) {
        typingStateRef.current[contactKey] = true
        setTypingContacts(prev => {
          if (prev[contactKey]) {
            return prev
          }
          return { ...prev, [contactKey]: true }
        })

        if (typingTimersRef.current[contactKey]) {
          clearTimeout(typingTimersRef.current[contactKey])
        }
        typingTimersRef.current[contactKey] = setTimeout(() => {
          typingStateRef.current[contactKey] = false
          setTypingContacts(prev => {
            if (!prev[contactKey]) {
              return prev
            }
            const next = { ...prev }
            delete next[contactKey]
            return next
          })
        }, 3500)
      } else {
        typingStateRef.current[contactKey] = false
        if (typingTimersRef.current[contactKey]) {
          clearTimeout(typingTimersRef.current[contactKey])
          delete typingTimersRef.current[contactKey]
        }
        setTypingContacts(prev => {
          if (!prev[contactKey]) {
            return prev
          }
          const next = { ...prev }
          delete next[contactKey]
          return next
        })
      }
    },
    [currentUserId],
  )

  const emitTypingState = useCallback(
    (isTyping: boolean, target?: { peerUserId: string; tenantId: string }) => {
      const peerUserId = target?.peerUserId ?? activePeerUserId
      const tenantId = target?.tenantId ?? currentTenantId

      if (!peerUserId || !currentUserId || !tenantId || !realtimeReady) {
        return
      }

      if (!target && !isTenantUserContact) {
        return
      }

      const threadKey = buildUserThreadKey(currentUserId, peerUserId)
      const channelName = buildPresenceThreadChannel(tenantId, threadKey)
      const channel = subscribedChannelsRef.current.get(channelName)
      if (!channel || typeof (channel as any).trigger !== 'function') {
        return
      }

      const stateKey = `${channelName}:self`
      if (!target && localTypingStateRef.current[stateKey] === isTyping) {
        return
      }

      localTypingStateRef.current[stateKey] = isTyping
      lastTypingTargetRef.current = isTyping ? { peerUserId, tenantId } : null

      // Client-to-client typing events disabled (requires Soketi enableClientMessages: true)
      // Uncomment when Soketi server configuration is updated
      /*
      try {
        ;(channel as any).trigger('client-typing', {
          threadKey,
          userId: currentUserId,
          isTyping,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.warn('FullScreenChatbot: failed to emit typing event', error)
      }
      */
    },
    [
      activePeerUserId,
      currentTenantId,
      currentUserId,
      isTenantUserContact,
      realtimeReady,
    ],
  )

  const handleComposerChange = useCallback(
    (value: string) => {
      setInputValue(value)

      if (!isTenantUserContact || !activePeerUserId) {
        return
      }

      const typingTarget = currentTenantId
        ? {
          peerUserId: activePeerUserId,
          tenantId: currentTenantId,
        }
        : null

      if (value.length > 0) {
        if (typingTarget) {
          emitTypingState(true, typingTarget)
        } else {
          emitTypingState(true)
        }
        if (typingEmitTimeoutRef.current) {
          clearTimeout(typingEmitTimeoutRef.current)
        }
        typingEmitTimeoutRef.current = setTimeout(() => {
          if (typingTarget) {
            emitTypingState(false, typingTarget)
          } else {
            emitTypingState(false)
          }
          typingEmitTimeoutRef.current = null
        }, 1600)
      } else {
        if (typingEmitTimeoutRef.current) {
          clearTimeout(typingEmitTimeoutRef.current)
          typingEmitTimeoutRef.current = null
        }
        if (typingTarget) {
          emitTypingState(false, typingTarget)
        } else {
          emitTypingState(false)
        }
      }
    },
    [activePeerUserId, currentTenantId, emitTypingState, isTenantUserContact],
  )

  const markMessagesAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!activePeerUserId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return
      }

      const newIds = (messageIds || []).filter(id => !pendingReadIdsRef.current.has(id))
      if (newIds.length === 0) {
        return
      }

      newIds.forEach(id => pendingReadIdsRef.current.add(id))

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`
        }

        await fetch('/api/chat/user-threads/read', {
          method: 'POST',
          headers,
          body: JSON.stringify({ peerId: activePeerUserId, messageIds: newIds }),
        })

        const readAt = new Date()
        setUserThreads(prev => {
          const currentThread = prev[activeSidebarContact.id]
          if (!currentThread || !Array.isArray(currentThread) || currentThread.length === 0) {
            return prev
          }

          let changed = false
          const updated = (currentThread || []).map(message => {
            if (newIds?.includes(message.id)) {
              if (!message.readAt || message.readAt.getTime() !== readAt.getTime()) {
                changed = true
                return {
                  ...message,
                  readAt,
                  deliveryStatus: message.role === 'user' ? 'read' : message.deliveryStatus,
                }
              }
            }
            return message
          })

          if (!changed) {
            return prev
          }

          return {
            ...prev,
            [activeSidebarContact.id]: updated,
          }
        })
      } catch (error) {
        console.error('FullScreenChatbot: failed to mark messages as read', error)
      } finally {
        newIds.forEach(id => pendingReadIdsRef.current.delete(id))
      }
    },
    [activePeerUserId, activeSidebarContact.id, sessionToken, setUserThreads],
  )

  // Use refs to track if we've already cleared the state to avoid infinite loops
  const hasClearedStateRef = useRef(false)
  // Debug: Track component instance
  const instanceId = useRef(Math.random().toString(36).substring(7))

  useEffect(() => {
    console.log(`[FullScreenChatbot:${instanceId.current}] 🔄 Effect triggered`, {
      realtimeReady,
      currentUserId,
      currentTenantId,
      contactCount: whatsappContactMap.size
    })

    if (!pusherRef.current || !realtimeReady || !currentUserId || !currentTenantId) {
      if (pusherRef.current && subscribedChannelsRef.current.size > 0) {
        for (const [channelName, channel] of subscribedChannelsRef.current.entries()) {
          safeChannelUnbind(channel, 'tenant-user-message', handleRealtimeTenantMessage)
          safeChannelUnbind(channel, 'tenant-user-message-delivered', handleRealtimeDeliveryReceipt)
          safeChannelUnbind(channel, 'tenant-user-message-read', handleRealtimeReadReceipt)
          safeChannelUnbind(channel, 'client-typing', handleRealtimeTyping)
          safeChannelUnbind(channel, 'pusher:subscription_succeeded')
          safeChannelUnbind(channel, 'pusher:member_added')
          safeChannelUnbind(channel, 'pusher:member_removed')
          if (channel && typeof channel.unbind_all === 'function') {
            channel.unbind_all()
          }
          pusherRef.current.unsubscribe(channelName)
          const retryEntry = subscriptionRetryRef.current.get(channelName)
          if (retryEntry?.timer) {
            clearTimeout(retryEntry.timer)
          }
          subscriptionRetryRef.current.delete(channelName)
        }
        subscribedChannelsRef.current.clear()
        if (subscriptionRetryRef.current.size > 0) {
          subscriptionRetryRef.current.forEach(entry => {
            if (entry.timer) {
              clearTimeout(entry.timer)
            }
          })
          subscriptionRetryRef.current.clear()
        }
      }
      // Only clear state if we haven't already cleared it to prevent infinite loops
      if (!hasClearedStateRef.current) {
        setOnlineUserIds(prev => {
          if (prev.size === 0) return prev
          return new Set()
        })
        setTypingContacts(prev => {
          if (Object.keys(prev).length === 0) return prev
          return {}
        })
        hasClearedStateRef.current = true
      }
      return
    }

    // Reset the flag when conditions are met
    hasClearedStateRef.current = false

    const client = pusherRef.current
    const desiredChannels = new Set<string>()

    const clearSubscriptionRetry = (channelName: string) => {
      const entry = subscriptionRetryRef.current.get(channelName)
      if (entry?.timer) {
        clearTimeout(entry.timer)
      }
      subscriptionRetryRef.current.delete(channelName)
    }

    const MAX_SUBSCRIPTION_RETRY_ATTEMPTS = 5

    const scheduleSubscriptionRetry = (channelName: string, status: unknown) => {
      const existing =
        subscriptionRetryRef.current.get(channelName) ?? {
          attempts: 0,
          timer: null as ReturnType<typeof setTimeout> | null,
          gaveUp: false,
        }

      if (existing.gaveUp) {
        return
      }

      if (existing.timer) {
        return
      }

      const attempts = existing.attempts + 1

      if (attempts > MAX_SUBSCRIPTION_RETRY_ATTEMPTS) {
        if (!existing.gaveUp) {
          console.warn('FullScreenChatbot: subscription retry limit reached', { channelName, status })
        }
        subscriptionRetryRef.current.set(channelName, {
          attempts,
          timer: null,
          gaveUp: true,
        })
        return
      }

      const retryDelay = Math.min(attempts * 1000, 10000)
      const timer = setTimeout(() => {
        const stored = subscriptionRetryRef.current.get(channelName)
        if (stored?.timer) {
          clearTimeout(stored.timer)
        }
        subscriptionRetryRef.current.set(channelName, { attempts, timer: null, gaveUp: false })

        if (client && typeof client.unsubscribe === 'function') {
          try {
            client.unsubscribe(channelName)
          } catch (unsubscribeError) {
            console.warn('FullScreenChatbot: unsubscribe before retry failed', { channelName, unsubscribeError })
          }
        }
      }, retryDelay)

      subscriptionRetryRef.current.set(channelName, { attempts, timer, gaveUp: false })
    }

    // We track bound channel names for this effect cycle to avoid duplicate work
    const stableContactKeys = Array.from(whatsappContactMap.keys()).sort().join(',')
    const boundChannelsInThisEffect = new Set<string>()

    const ensureChannel = (channelName: string) => {
      if (!channelName || typeof channelName !== 'string') {
        console.error('ensureChannel: Invalid channel name', channelName)
        return null
      }

      // Check if we've already set up this channel in this very effect run
      if (boundChannelsInThisEffect.has(channelName)) {
        return subscribedChannelsRef.current.get(channelName)
      }

      const retryEntry = subscriptionRetryRef.current.get(channelName)
      if (retryEntry?.gaveUp) {
        return null
      }

      let channel = subscribedChannelsRef.current.get(channelName)
      if (!channel) {
        try {
          const isWhatsAppChannel = channelName.startsWith('whatsapp.')
          console.log(`FullScreenChatbot: subscribing to channel${isWhatsAppChannel ? ' (WhatsApp)' : ''}`, {
            channelName,
          })
          channel = client.subscribe(channelName)

            // Reset tracking flag on new subscription
            ; (channel as any).__custom_listeners_bound = false

          subscribedChannelsRef.current.set(channelName, channel)
        } catch (error) {
          console.error('ensureChannel: Error subscribing to channel', channelName, error)
          return null
        }
      }

      // Bind subscription success/error handlers only once per channel object
      if (channel && !(channel as any).__custom_listeners_bound) {
        const isWhatsAppChannel = channelName.startsWith('whatsapp.')
        if (isWhatsAppChannel) {
          safeChannelBind(channel, 'pusher:subscription_succeeded', () => {
            console.log('✅✅✅ [WhatsApp Channel] Successfully subscribed', {
              channelName,
              socketId: client.connection?.socket_id,
            })
            clearSubscriptionRetry(channelName)
          })
        } else {
          safeChannelBind(channel, 'pusher:subscription_succeeded', () => {
            console.log('FullScreenChatbot: subscription succeeded', { channelName })
            clearSubscriptionRetry(channelName)
          })
        }

        // Add comprehensive listeners if available
        if ((client as any).__addChannelListeners) {
          (client as any).__addChannelListeners(channelName, channel)
        }

        safeChannelBind(channel, 'pusher:subscription_error', (status: any) => {
          const normalizedStatus =
            status && typeof status === 'object'
              ? { ...status }
              : { status }

          console.error('❌ FullScreenChatbot: subscription error', {
            channelName,
            status: normalizedStatus
          })

          scheduleSubscriptionRetry(channelName, normalizedStatus)
        })
          ; (channel as any).__custom_listeners_bound = true
      }

      if (channel) {
        boundChannelsInThisEffect.add(channelName)
      }
      return channel
    }

    if (typeof buildPresenceTenantChannel !== 'function') {
      console.error('buildPresenceTenantChannel is not a function')
      return
    }

    const presenceChannelName = buildPresenceTenantChannel(currentTenantId)
    if (presenceChannelName) {
      desiredChannels.add(presenceChannelName)
      const presenceChannel = ensureChannel(presenceChannelName)

      if (presenceChannel) {
        const refreshPresence = () => {
          if (!presenceChannel?.members) return
          const next = new Set<string>()
          if (typeof presenceChannel.members.each === 'function') {
            presenceChannel.members.each((member: any) => {
              if (member && typeof member.id === 'string') {
                next.add(member.id)
              }
            })
          } else if (presenceChannel.members.members) {
            Object.keys(presenceChannel.members.members).forEach(memberId => next.add(memberId))
          }

          setOnlineUserIds(prev => {
            if (prev.size !== next.size) return next
            for (const id of next) {
              if (!prev.has(id)) return next
            }
            return prev
          })
        }

        safeChannelUnbind(presenceChannel, 'pusher:subscription_succeeded')
        safeChannelUnbind(presenceChannel, 'pusher:member_added')
        safeChannelUnbind(presenceChannel, 'pusher:member_removed')
        safeChannelBind(presenceChannel, 'pusher:subscription_succeeded', refreshPresence)
        safeChannelBind(presenceChannel, 'pusher:member_added', refreshPresence)
        safeChannelBind(presenceChannel, 'pusher:member_removed', refreshPresence)
      }
    }

    if (currentTenantId && currentUserId) {
      const scheduledChannelName = `private-scheduled.${currentTenantId}.${currentUserId}`
      desiredChannels.add(scheduledChannelName)
      const scheduledChannel = ensureChannel(scheduledChannelName)
      if (scheduledChannel) {
        safeChannelUnbind(scheduledChannel, 'scheduled-message-update')
        safeChannelBind(scheduledChannel, 'scheduled-message-update', handleScheduledRealtimeUpdate)
      }
    }

    safeArray(tenantUserContacts).forEach((contact: any) => {
      if (!isValidContact(contact)) return
      const peerUserId = safeStringOp(contact.id).replace(/^user:/, '').trim()
      if (!peerUserId || peerUserId === currentUserId) return

      try {
        const channelName = buildUserThreadKey(currentUserId, peerUserId)
        if (channelName) {
          desiredChannels.add(channelName)
          const channel = ensureChannel(channelName)
          if (channel) {
            safeChannelUnbind(channel, 'message.sent')
            safeChannelUnbind(channel, 'message.received')
            safeChannelUnbind(channel, 'message.status')
            safeChannelUnbind(channel, 'contact.typing')
            safeChannelUnbind(channel, 'message.read')

            safeChannelBind(channel, 'message.sent', handleRealtimeTenantMessage)
            safeChannelBind(channel, 'message.received', handleRealtimeTenantMessage)
            safeChannelBind(channel, 'message.status', handleRealtimeDeliveryReceipt)
            safeChannelBind(channel, 'contact.typing', handleRealtimeTyping)
            safeChannelBind(channel, 'message.read', handleRealtimeReadReceipt)
          }
        }
      } catch (err) {
        console.error('FullScreenChatbot: Error constructing channel for contact', contact, err)
      }
    })

    // Setup WhatsApp channels
    // CRITICAL FIX: Subscribe to ALL active tenant sessions, not just contact metadata
    // Contact metadata may have stale sessionIds from old sessions
    console.log('📱 [WhatsApp Subscription] Starting subscription process', {
      contactCount: whatsappContactMap.size,
      contactKeys: stableContactKeys
    })

    // Collect unique session IDs from contact metadata
    const contactSessionIds = new Set<string>()
    whatsappContactMap.forEach((whatsappInfo) => {
      if (whatsappInfo?.sessionId) {
        contactSessionIds.add(whatsappInfo.sessionId)
      }
    })

    // Helper to subscribe to a WhatsApp session channel
    const subscribeToWhatsAppSession = (sessionId: string) => {
      const channelName = buildWhatsAppChannel(sessionId)
      if (!channelName) return

      // Skip if already subscribed
      if (desiredChannels.has(channelName)) return

      console.log('🔔 [WhatsApp Channel] Subscribing to session channel', {
        sessionId,
        channelName,
      })

      desiredChannels.add(channelName)
      const channel = ensureChannel(channelName)

      if (channel) {
        // ALWAYS unbind first to prevent stacking
        safeChannelUnbind(channel, 'message.received')
        safeChannelUnbind(channel, 'message.queued')
        safeChannelUnbind(channel, 'message.sent')
        safeChannelUnbind(channel, 'message.status')
        safeChannelUnbind(channel, 'contact.updated')

        // DEBUG: Add global event handler to catch ALL events on this channel
        // This helps us verify if Soketi is delivering events to the frontend at all
        if (typeof channel.bind_global === 'function') {
          channel.bind_global((eventName: string, data: any) => {
            console.log('🌐🌐🌐 [WhatsApp Channel] GLOBAL EVENT RECEIVED 🌐🌐🌐', {
              channelName,
              sessionId,
              eventName,
              dataKeys: data ? Object.keys(data) : [],
              hasContent: !!data?.content,
              contentPreview: data?.content?.substring?.(0, 50),
              fromMe: data?.fromMe,
              timestamp: new Date().toISOString(),
            })
          })
          console.log('🔍 [WhatsApp Subscription] Bound global event listener for debugging', { channelName })
        }

        // Bind handlers
        safeChannelBind(channel, 'message.queued', handleRealtimeWhatsAppMessage)
        safeChannelBind(channel, 'message.sent', handleRealtimeWhatsAppMessage)
        safeChannelBind(channel, 'message.received', handleRealtimeWhatsAppMessage)
        safeChannelBind(channel, 'message.status', handleRealtimeWhatsAppStatus)
        safeChannelBind(channel, 'contact.updated', handleRealtimeContactUpdate)

        console.log('✅ [WhatsApp Subscription] Bound event handlers', {
          channelName,
          sessionId,
        })
      }
    }

    // Subscribe to sessions from contact metadata (for backwards compatibility)
    contactSessionIds.forEach((sessionId) => {
      subscribeToWhatsAppSession(sessionId)
    })

    // CRITICAL: Also fetch active sessions from API and subscribe to them
    // This ensures we receive events from the CURRENTLY ACTIVE sessions
    // even if contact metadata has stale sessionIds
    const fetchAndSubscribeActiveSessionsAsync = async () => {
      try {
        // Get auth token
        let authToken: string | null = null
        if (typeof window !== 'undefined') {
          try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
              const parsed = JSON.parse(authStorage)
              authToken = parsed?.state?.token || null
            }
          } catch (e) {
            // Ignore
          }
        }

        if (!authToken) {
          console.warn('📱 [WhatsApp Subscription] No auth token, skipping active sessions fetch')
          return
        }

        const response = await fetch('/api/whatsapp/sessions', {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        })

        if (!response.ok) {
          console.warn('📱 [WhatsApp Subscription] Failed to fetch active sessions', {
            status: response.status,
          })
          return
        }

        const data = await response.json()
        const activeSessions: Array<{ sessionId: string; status: string }> = data.sessions || []

        console.log('📱 [WhatsApp Subscription] Fetched active sessions', {
          count: activeSessions.length,
          sessions: activeSessions.map((s) => ({ id: s.sessionId, status: s.status })),
        })

        // Subscribe to all connected/active sessions
        activeSessions.forEach((session) => {
          if (session.status === 'CONNECTED' || session.status === 'CONNECTING') {
            subscribeToWhatsAppSession(session.sessionId)
          }
        })
      } catch (err) {
        console.warn('📱 [WhatsApp Subscription] Error fetching active sessions', err)
      }
    }

    // Execute async fetch (don't await to avoid blocking)
    fetchAndSubscribeActiveSessionsAsync()

    console.log('📱 [WhatsApp Subscription] Completed subscription process')

    // Clean up channels we no longer want
    subscribedChannelsRef.current.forEach((channel, channelName) => {
      if (!desiredChannels.has(channelName)) {
        console.log('FullScreenChatbot: unsubscribing from channel', channelName)
        if (channel) {
          // Unbind everything before unsubscribing
          safeChannelUnbind(channel, 'pusher:subscription_succeeded')
          safeChannelUnbind(channel, 'pusher:subscription_error')

          if (channel.unbind_all) {
            channel.unbind_all()
          }
        }
        client.unsubscribe(channelName)
        subscribedChannelsRef.current.delete(channelName)
        clearSubscriptionRetry(channelName)
      }
    })

    return () => {
      // Clear retry timers
      subscriptionRetryRef.current.forEach(entry => {
        if (entry.timer) {
          clearTimeout(entry.timer)
        }
      })
      subscriptionRetryRef.current.clear()

      // CRITICAL: Unbind and unsubscribe from all channels to prevent duplicate listeners
      if (pusherRef.current) {
        subscribedChannelsRef.current.forEach((channel, channelName) => {
          if (channel) {
            channel.unbind_all()
          }
          pusherRef.current?.unsubscribe(channelName)
        })
        subscribedChannelsRef.current.clear()
      }
    }
  }, [
    realtimeReady,
    tenantUserContacts,
    currentUserId,
    currentTenantId,
    handleRealtimeTenantMessage,
    handleRealtimeDeliveryReceipt,
    handleRealtimeReadReceipt,
    handleRealtimeTyping,
    handleScheduledRealtimeUpdate,
    whatsappContactMap.size,
    Array.from(whatsappContactMap.keys()).sort().join(','),
    handleRealtimeWhatsAppMessage,
    handleRealtimeWhatsAppStatus,
    handleRealtimeContactUpdate,
  ])

  const loadUserThread = useCallback(
    async (contactKey: string, peerUserId: string) => {
      console.log('FullScreenChatbot: Loading user thread', {
        contactKey,
        peerUserId,
        currentUserId,
        hasSessionToken: !!sessionToken,
        tokenPreview: sessionToken ? `${sessionToken.substring(0, 10)}...` : 'null',
      })

      try {
        const headers: HeadersInit = sessionToken
          ? { Authorization: `Bearer ${sessionToken}` }
          : {}
        console.log('FullScreenChatbot: Request headers', {
          hasAuthHeader: 'Authorization' in headers,
          authHeaderPreview: sessionToken ? `Bearer ${sessionToken.substring(0, 20)}...` : 'none',
        })

        // Add cache busting timestamp
        const cacheBuster = Date.now()
        const response = await fetch(`/api/chat/user-threads?peerId=${encodeURIComponent(peerUserId)}&_=${cacheBuster}`, {
          headers,
          cache: 'no-store',
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          console.error('FullScreenChatbot: Failed to load thread', {
            status: response.status,
            error: errorData,
          })
          throw new Error(errorData?.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        if (!data?.success || !Array.isArray(data.messages)) {
          console.error('FullScreenChatbot: Invalid response format', data)
          throw new Error('Respuesta inválida del servidor')
        }

        const mapped = (data.messages || []).map(mapUserThreadMessage)
        console.log('FullScreenChatbot: Loaded messages', {
          contactKey,
          messageCount: mapped.length,
        })

        setUserThreads(prev => ({ ...prev, [contactKey]: mapped }))
        userThreadLoadedRef.current[contactKey] = true
        scrollToBottom()
      } catch (error) {
        console.error('FullScreenChatbot: failed to load user chat thread', error)
        userThreadLoadedRef.current[contactKey] = false
        toast.error('No se pudo cargar el chat', error instanceof Error ? error.message : 'Intenta nuevamente más tarde.')
      }
    },
    [mapUserThreadMessage, scrollToBottom, currentUserId, sessionToken],
  )

  useEffect(() => {
    console.log('🔍 [Thread Loading Effect] Triggered', {
      isTenantUserContact,
      activePeerUserId,
      sessionToken: !!sessionToken,
      currentUserId,
      selectedContactId,
      activeSidebarContactId: activeSidebarContact.id,
      contactsInitialized,
    })

    if (!isTenantUserContact || !activePeerUserId) {
      console.log('⏭️ [Thread Loading Effect] Skipping - not tenant user contact or no peer user ID')
      return
    }

    // Don't load threads without authentication or identity
    if (!sessionToken || !currentUserId) {
      console.log('⏭️ [Thread Loading Effect] Skipping - no session token or user ID')
      return
    }

    // Check if already loaded - but only skip if we actually have messages in state
    const hasMessagesInState = userThreads[activeSidebarContact.id]?.length > 0
    if (userThreadLoadedRef.current[activeSidebarContact.id] && hasMessagesInState) {
      console.log('⏭️ [Thread Loading Effect] Thread already loaded with messages, skipping reload', {
        contactKey: activeSidebarContact.id,
        messageCount: hasMessagesInState,
      })
      return
    }

    console.log('✅ [Thread Loading Effect] Loading thread', {
      contactKey: activeSidebarContact.id,
      peerUserId: activePeerUserId,
    })
    void loadUserThread(activeSidebarContact.id, activePeerUserId)
  }, [activePeerUserId, activeSidebarContact.id, isTenantUserContact, loadUserThread, sessionToken, userThreads, currentUserId, selectedContactId, contactsInitialized])

  // Load WhatsApp messages on mount  
  const loadWhatsAppMessages = useCallback(
    async (contactKey: string, sessionId: string, jid: string) => {
      console.log('📱 [WhatsApp Messages] Loading WhatsApp messages', {
        contactKey,
        sessionId,
        jid,
        hasSessionToken: !!sessionToken,
      })

      try {
        const headers: HeadersInit = sessionToken
          ? { Authorization: `Bearer ${sessionToken}` }
          : {}

        const cacheBuster = Date.now()
        // Use contactId instead of sessionId and jid - backend will resolve everything
        const response = await fetch(
          `/api/whatsapp/chat-messages?contactId=${encodeURIComponent(contactKey)}&_=${cacheBuster}`,
          {
            headers,
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          console.error('📱 [WhatsApp Messages] Failed to load messages', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            contactKey,
            url: response.url,
          })
          throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('📱 [WhatsApp Messages] Response data:', {
          success: data?.success,
          messageCount: data?.messages?.length || 0,
          hasMessages: Array.isArray(data?.messages),
          contactKey,
        })

        if (!data?.success || !Array.isArray(data.messages)) {
          console.error('📱 [WhatsApp Messages] Invalid response format', {
            data,
            contactKey,
            expectedFormat: { success: true, messages: [] },
          })
          throw new Error('Respuesta inválida del servidor')
        }

        // Map WhatsApp messages to Message format
        const mapped: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id || msg.messageId || `wa-${Date.now()}-${Math.random()}`,
          role: msg.fromMe ? 'user' : 'assistant',
          content: msg.content || msg.text || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          type: 'text',
          deliveryStatus: msg.status?.toLowerCase() || 'sent',
          metadata: {
            ...(msg.metadata || {}),
            source: 'whatsapp',
            messageId: msg.messageId || msg.id,
            sessionId: msg.sessionId,
          },
        }))

        console.log('📱 [WhatsApp Messages] Loaded messages', {
          contactKey,
          messageCount: mapped.length,
          summaryCount: (data.sessionSummaries || []).length,
          activityCount: (data.activities || []).length
        })

        if (Array.isArray(data.sessionSummaries)) {
          setSessionSummaries(prev => ({ ...prev, [contactKey]: data.sessionSummaries }))
        }

        if (Array.isArray(data.activities)) {
          setSessionActivities(prev => ({ ...prev, [contactKey]: data.activities }))
        }

        setCommandThreads(prev => {
          const current = prev[contactKey] ?? []

          // Create a map of existing messages by ID for quick lookup
          const existingMap = new Map()
          current.forEach(m => {
            existingMap.set(m.id, m)
            if (m.metadata?.messageId) {
              existingMap.set(m.metadata.messageId, m)
            }
          })

          // Filter out mapped messages that already exist
          const newMessages = mapped.filter(m => {
            const idExists = existingMap.has(m.id)
            const messageIdExists = m.metadata?.messageId ? existingMap.has(m.metadata.messageId) : false
            return !idExists && !messageIdExists
          })

          if (newMessages.length === 0 && current.length > 0) {
            return prev
          }

          // Combine and sort
          const combined = [...current, ...newMessages].sort((a, b) =>
            a.timestamp.getTime() - b.timestamp.getTime()
          )

          return { ...prev, [contactKey]: combined }
        })

        whatsappThreadLoadedRef.current[contactKey] = true
        scrollToBottom()
      } catch (error) {
        console.error('📱 [WhatsApp Messages] Failed to load WhatsApp messages', error)
        whatsappThreadLoadedRef.current[contactKey] = false
        toast.error('No se pudo cargar el chat de WhatsApp', error instanceof Error ? error.message : 'Intenta nuevamente más tarde.')
      }
    },
    [sessionToken, scrollToBottom]
  )

  // Effect to load WhatsApp messages when a WhatsApp contact is selected
  useEffect(() => {
    console.log('🔍 [WhatsApp Message Loading Effect] Triggered', {
      activeSidebarContactId: activeSidebarContact.id,
      whatsappContactMapSize: whatsappContactMap.size,
      isInWhatsappMap: whatsappContactMap.has(activeSidebarContact.id),
      contactsInitialized,
      sessionToken: !!sessionToken,
    })

    // Skip if contacts aren't initialized yet
    if (!contactsInitialized) {
      console.log('⏭️ [WhatsApp Message Loading Effect] Skipping - contacts not initialized')
      return
    }

    // Check if this is a WhatsApp contact
    if (!whatsappContactMap.has(activeSidebarContact.id)) {
      console.log('⏭️ [WhatsApp Message Loading Effect] Skipping - not a WhatsApp contact')
      return
    }

    const whatsappInfo = whatsappContactMap.get(activeSidebarContact.id)
    if (!whatsappInfo?.sessionId || !whatsappInfo?.jid) {
      console.log('⏭️ [WhatsApp Message Loading Effect] Skipping - missing session ID or JID')
      return
    }

    // Check if already loaded
    if (whatsappThreadLoadedRef.current[activeSidebarContact.id]) {
      console.log('⏭️ [WhatsApp Message Loading Effect] Messages already loaded (or attempted), skipping reload', {
        contactKey: activeSidebarContact.id,
        messageCount: commandThreads[activeSidebarContact.id]?.length || 0,
      })
      return
    }

    console.log('✅ [WhatsApp Message Loading Effect] Loading WhatsApp messages', {
      contactKey: activeSidebarContact.id,
      sessionId: whatsappInfo.sessionId,
      jid: whatsappInfo.jid,
    })

    void loadWhatsAppMessages(activeSidebarContact.id, whatsappInfo.sessionId, whatsappInfo.jid)
  }, [activeSidebarContact.id, whatsappContactMap, contactsInitialized, sessionToken, loadWhatsAppMessages])

  // Effect to mark WhatsApp contact as read when viewing
  useEffect(() => {
    const contactId = activeSidebarContact.id

    // Skip if contacts aren't initialized or no session token
    if (!contactsInitialized || !sessionToken) {
      return
    }

    // Check if this is a WhatsApp contact (use stable check)
    const isWhatsAppContact = whatsappContactMap.has(contactId)
    if (!isWhatsAppContact) {
      return
    }

    // Skip if already marked as read for this contact
    if (markedAsReadRef.current.has(contactId)) {
      return
    }

    // Mark as read (optimistic - add to set before API call)
    markedAsReadRef.current.add(contactId)

    const markAsRead = async () => {
      try {
        await fetch('/api/whatsapp/contacts/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ contactId }),
        })
        // NOTE: Don't call loadContacts() here - it causes contacts to disappear
        // The unread count will update naturally when new messages arrive
      } catch (error) {
        // On error, remove from marked set so it can retry on next selection
        markedAsReadRef.current.delete(contactId)
        console.error('[FullScreenChatbot] Failed to mark contact as read:', error)
      }
    }

    void markAsRead()
  }, [activeSidebarContact.id, contactsInitialized, sessionToken]) // Removed whatsappContactMap - use stable check inside


  useEffect(() => {
    if (!isTenantUserContact || !activePeerUserId) {
      return
    }

    const messages = (userThreads[activeSidebarContact.id] || [])
    const unreadIds = (messages || [])
      .filter(message => message.role === 'assistant' && !message.readAt)
      .map(message => message.id)

    if (unreadIds.length > 0) {
      void markMessagesAsRead(unreadIds)
    }
  }, [
    isTenantUserContact,
    activePeerUserId,
    activeSidebarContact.id,
    userThreads,
    markMessagesAsRead,
  ])

  // Removed conflicting second WhatsApp message loading effect to prevent race conditions and double fetching
  // The effect above (lines 4260+) handles loading via the correct /api/whatsapp/messages endpoint

  useEffect(() => {
    if (!activeSidebarContact?.id) {
      return
    }
    void refreshScheduledMessageForContact(activeSidebarContact.id)
  }, [activeSidebarContact?.id, refreshScheduledMessageForContact])

  const sendWhatsAppMessage = useCallback(
    async (contactId: string, messageContent: string) => {
      // Use session token (for chat widget) if available, otherwise fall back to admin token (for dashboard users)
      // Priority changed to sessionToken to avoid 401 errors with hybrid guard when both are present
      const tokenToUse = sessionToken || authToken

      if (!tokenToUse) {
        toast.error('Inicia sesión para continuar', 'Verifica tu número antes de enviar mensajes por WhatsApp.')
        return
      }

      const tempId = `whatsapp-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const createdAt = new Date()
      const optimistic: Message = {
        id: tempId,
        role: 'user',
        content: messageContent,
        timestamp: createdAt,
        type: 'text',
        deliveryStatus: 'sending',
        status: 'sending',
        metadata: {
          messageId: tempId,
          optimistic: true,
          source: 'whatsapp',
        },
      }

      applyToContactThread(contactId, current => [...current, optimistic])

      const whatsappInfo = whatsappContactMap.get(contactId)
      if (!whatsappInfo) {
        toast.error('Error de contacto', 'No se encontró información de sesión de WhatsApp para este contacto.')
        applyToContactThread(contactId, current => current.filter(message => message.id !== tempId))
        return
      }

      try {
        // Get tenantId from chat auth store - this is more reliable than sessionId from contact metadata
        // The backend will use tenantId to find the active session
        const { tenantId: userTenantId } = useChatAuthStore.getState()

        const { user: currentUser } = useAuthStore.getState()
        const response = await fetch('/api/whatsapp/chat-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {})
          },
          body: JSON.stringify({
            sessionId: userTenantId || contactId,
            toJid: whatsappInfo.jid,
            content: messageContent,
            senderName: (currentUser as any)?.displayName || currentUser?.name || 'Agente'
          }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok || !data?.success || !data?.message) {
          throw new Error(data?.error || 'No se pudo enviar el mensaje')
        }

        const mapped = mapWhatsAppDtoToMessage({
          id: typeof data.message.id === 'string' ? data.message.id : tempId,
          messageId: typeof data.message.messageId === 'string' ? data.message.messageId : tempId,
          fromMe: true,
          content: typeof data.message.content === 'string' ? data.message.content : messageContent,
          timestamp: data.message.timestamp ?? new Date().toISOString(),
          status: normalizeWhatsAppStatus(data.message.status),
          remoteJid: typeof data.message.remoteJid === 'string' ? data.message.remoteJid : null,
          metadata: data.message.metadata && typeof data.message.metadata === 'object' ? data.message.metadata : null,
        })

        applyToContactThread(contactId, current => {
          const filtered = current.filter(existing => {
            const existingId = typeof existing.metadata?.messageId === 'string' ? existing.metadata?.messageId : existing.id
            const mappedId = typeof mapped.metadata?.messageId === 'string' ? mapped.metadata.messageId : mapped.id
            return existingId !== tempId && existingId !== mappedId
          })
          return [...filtered, mapped]
        })
      } catch (error) {
        applyToContactThread(contactId, current => current.filter(message => message.id !== tempId))
        console.error('FullScreenChatbot: failed to send WhatsApp message', error)
        toast.error('No se pudo enviar el mensaje', error instanceof Error ? error.message : 'Intenta nuevamente más tarde.')
      }
    },
    [applyToContactThread, sessionToken, authToken, normalizeWhatsAppStatus, whatsappContactMap],
  )

  const sendDirectMessage = useCallback(
    async (
      contactKey: string,
      peerUserId: string,
      messageContent: string,
      recipientEmail?: string | null,
    ) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const createdAt = new Date()

      // Handle file uploads if files are selected
      let uploadedAttachments: any[] = []
      if (selectedFiles.length > 0) {
        setIsUploadingFiles(true)
        try {
          const formData = new FormData()
          selectedFiles.forEach(file => formData.append('files', file))

          const uploadResponse = await fetch('/api/chat/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => null)
            throw new Error(errorData?.error || 'Failed to upload files')
          }

          const uploadData = await uploadResponse.json()
          uploadedAttachments = uploadData.files || []
        } catch (error) {
          console.error('Failed to upload files:', error)
          toast.error('Error al subir archivos', 'Intenta nuevamente')
          setIsUploadingFiles(false)
          return
        }
        setIsUploadingFiles(false)
      }

      const optimisticMessage: Message = {
        id: tempId,
        role: 'user',
        content: messageContent,
        timestamp: createdAt,
        type: 'text',
        readAt: null,
        deliveryStatus: 'sending',
        attachments: uploadedAttachments,
        metadata: {
          source: 'flowcast',
          optimistic: true,
        },
      }

      try {
        setUserChatSending(true)
        setInputValue('')
        setSelectedFiles([])

        setUserThreads(prev => {
          const existing = prev[contactKey] ?? []
          return {
            ...prev,
            [contactKey]: [...existing, optimisticMessage],
          }
        })

        const payload = {
          recipientId: peerUserId,
          content: messageContent,
          recipientEmail,
          attachments: uploadedAttachments,
        }

        console.log('FullScreenChatbot: Sending direct message', {
          contactKey,
          peerUserId,
          recipientEmail,
          messageLength: messageContent.length,
          payload,
          currentUserId,
          currentUserEmail,
          sessionToken: sessionToken ? 'present' : 'missing',
        })

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`
        }

        const response = await fetch('/api/chat/user-threads', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const errorMessage = typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`
          console.error('FullScreenChatbot: Server error response', {
            status: response.status,
            payload,
          })
          throw new Error(errorMessage)
        }

        const data = await response.json()
        if (!data?.success || !data.message) {
          console.error('FullScreenChatbot: Invalid server response', data)
          throw new Error('Respuesta inválida del servidor')
        }

        const mapped = mapUserThreadMessage(data.message)
        const finalMessage = mapped.deliveryStatus ? mapped : { ...mapped, deliveryStatus: 'sent' as const }
        setUserThreads(prev => {
          const existing = prev[contactKey] ?? []
          const withoutTemp = existing.filter(message => message.id !== tempId)
          if (withoutTemp.some(message => message.id === finalMessage.id)) {
            return { ...prev, [contactKey]: withoutTemp }
          }
          return {
            ...prev,
            [contactKey]: [...withoutTemp, finalMessage],
          }
        })
        userThreadLoadedRef.current[contactKey] = true
        scrollToBottom()
        console.log('FullScreenChatbot: Message sent successfully', { messageId: finalMessage.id })
      } catch (error) {
        console.error('FullScreenChatbot: failed to send direct message', {
          error,
          peerUserId,
          recipientEmail,
        })
        setUserThreads(prev => {
          const existing = prev[contactKey]
          if (!existing) {
            return prev
          }
          const filtered = existing.filter(message => message.id !== tempId)
          if (filtered.length === existing.length) {
            return prev
          }
          return {
            ...prev,
            [contactKey]: filtered,
          }
        })
        toast.error('No se pudo enviar el mensaje', error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
        setInputValue(messageContent)
      } finally {
        setUserChatSending(false)
        composerRef.current?.focus({ preventScroll: true })
        if (typingEmitTimeoutRef.current) {
          clearTimeout(typingEmitTimeoutRef.current)
          typingEmitTimeoutRef.current = null
        }
        emitTypingState(false)
      }
    },
    [
      mapUserThreadMessage,
      scrollToBottom,
      sessionToken,
      currentUserId,
      currentUserEmail,
      emitTypingState,
      selectedFiles,
      cancelScheduledMessageById,
      scheduledMessages,
    ],
  )

  const canEditMessage = useCallback((message: Message): boolean => {
    if (message.role !== 'user') return false
    const now = new Date()
    const messageTime = message.timestamp
    const diffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60)
    return diffMinutes <= 15
  }, [])

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!isTenantUserContact || !currentUserId) return

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`
        }

        const response = await fetch('/api/chat/user-threads/delete', {
          method: 'POST',
          headers,
          body: JSON.stringify({ messageId }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete message')
        }

        // Update local state with soft delete (mark as deleted, don't remove)
        setUserThreads(prev => {
          const currentThread = prev[activeSidebarContact.id]
          if (!currentThread || !Array.isArray(currentThread)) return prev

          return {
            ...prev,
            [activeSidebarContact.id]: (currentThread || []).map(msg =>
              msg.id === messageId
                ? { ...msg, isDeleted: true, deletedAt: new Date(), content: '' }
                : msg
            ),
          }
        })

        toast.success('Mensaje eliminado')
      } catch (error) {
        console.error('FullScreenChatbot: failed to delete message', error)
        toast.error('No se pudo eliminar el mensaje', 'Intenta nuevamente')
      }
    },
    [isTenantUserContact, currentUserId, sessionToken, activeSidebarContact.id],
  )

  const handleStartEdit = useCallback((message: Message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditingContent('')
  }, [])

  const handleSaveEdit = useCallback(
    async (messageId: string) => {
      if (!editingContent.trim() || !isTenantUserContact || !currentUserId) return

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`
        }

        const response = await fetch('/api/chat/user-threads/edit', {
          method: 'POST',
          headers,
          body: JSON.stringify({ messageId, content: editingContent.trim() }),
        })

        if (!response.ok) {
          throw new Error('Failed to edit message')
        }

        // Update local state with editedAt timestamp
        setUserThreads(prev => {
          const currentThread = prev[activeSidebarContact.id]
          if (!currentThread || !Array.isArray(currentThread)) return prev

          return {
            ...prev,
            [activeSidebarContact.id]: (currentThread || []).map(msg =>
              msg.id === messageId ? { ...msg, content: editingContent.trim(), editedAt: new Date() } : msg
            ),
          }
        })

        // Clear editing state
        setEditingMessageId(null)
        setEditingContent('')

        // Show success toast using Zustand store
        toast.success('Mensaje editado correctamente', 'Los cambios han sido guardados')
      } catch (error) {
        console.error('FullScreenChatbot: failed to edit message', error)
        toast.error('No se pudo editar el mensaje', 'Intenta nuevamente')
      }
    },
    [editingContent, isTenantUserContact, currentUserId, sessionToken, activeSidebarContact.id],
  )

  const sendMessage = useCallback(
    async (rawContent?: string) => {
      const content = (rawContent ?? inputValue).trim()
      if (!content) return

      const matchedCommand = resolveCommandFromInput(content)

      console.log('[FullScreenChatbot] sendMessage called', {
        contactId: activeSidebarContact.id,
        isFlowbotConversation,
        isTenantUserContact,
        isWhatsAppContact,
        hasCommand: !!matchedCommand,
      })

      if (!isFlowbotConversation) {
        // CRITICAL: For hybrid contacts (Tenant User + WhatsApp), prioritize WhatsApp
        // This ensures messages are delivered via WhatsApp when the contact has WhatsApp enabled
        if (isTenantUserContact && isWhatsAppContact) {
          console.log('[FullScreenChatbot] Hybrid contact detected - routing to WhatsApp')
          if (selectedFiles.length > 0) {
            toast.error('Los archivos adjuntos aún no están disponibles en WhatsApp', 'Envía solo mensajes de texto por ahora.')
            return
          }

          setSelectedFiles([])
          setInputValue('')
          await sendWhatsAppMessage(activeSidebarContact.id, content)
          return
        }

        if (isTenantUserContact) {
          console.log('[FullScreenChatbot] Routing to tenant user direct message')
          if (!activePeerUserId) {
            toast.error('No se pudo identificar el usuario destino', 'Intenta abrir el chat nuevamente.')
            return
          }

          if (!currentUserId) {
            toast.error('Tu sesión no está lista todavía', 'Refresca la página e inténtalo de nuevo en unos segundos.')
            return
          }

          if (matchedCommand) {
            toast.info('Comandos no disponibles', 'En un chat entre usuarios envía mensajes directos sin comandos @.')
            return
          }

          await sendDirectMessage(activeSidebarContact.id, activePeerUserId, content, fallbackEmail)
          return
        }

        if (isWhatsAppContact) {
          console.log('[FullScreenChatbot] Routing to WhatsApp message')
          if (selectedFiles.length > 0) {
            toast.error('Los archivos adjuntos aún no están disponibles en WhatsApp', 'Envía solo mensajes de texto por ahora.')
            return
          }

          setSelectedFiles([])
          setInputValue('')
          await sendWhatsAppMessage(activeSidebarContact.id, content)
          return
        }

        if (matchedCommand) {
          console.log('[FullScreenChatbot] Routing to command execution')
          await executeCommandForThread(matchedCommand, content)
          return
        }

        console.warn('[FullScreenChatbot] No valid routing found - showing FlowBot toast')
        toast.info('Selecciona FlowBot', 'Usa un comando como @links en un chat de cliente o abre FlowBot para conversar.')
        return
      }

      if (matchedCommand?.allowInFlowbotConversation === false) {
        toast.info('Comando disponible solo en chats de operadores', 'Abre un chat de cliente para usar los comandos con @.')
        return
      }

      if (isStreaming || isUploadingFiles) return

      // Get fresh sessionToken from store to avoid stale closure issues
      // Access the Zustand store directly to get the latest value
      const currentState = useChatAuthStore.getState()
      const currentSessionToken = currentState?.sessionToken
      const effectiveSessionToken = currentSessionToken || sessionToken

      // Debug logging to diagnose authentication issues
      if (!effectiveSessionToken) {
        console.warn('[FullScreenChatbot] sendMessage blocked: no sessionToken', {
          sessionToken: sessionToken,
          currentSessionToken: currentSessionToken,
          effectiveSessionToken: effectiveSessionToken,
          sessionId: sessionId,
          chatAuthStatus,
          isHydrated,
          hasSessionToken: !!sessionToken,
          hasCurrentSessionToken: !!currentSessionToken,
          storeStatus: currentState?.status,
          storeIsHydrated: currentState?.isHydrated,
        })
        toast.error('Inicia sesión para continuar', 'Verifica tu número para seguir usando FlowBot.')
        return
      }

      // Use effectiveSessionToken for the API call
      const tokenToUse = effectiveSessionToken

      // Note: memoryService can be null if sessionId is not available yet, but we can still send messages
      // The memory service will be initialized once sessionId is available

      // Handle file uploads if files are selected
      let uploadedAttachments: any[] = []
      if (selectedFiles.length > 0) {
        setIsUploadingFiles(true)
        try {
          const formData = new FormData()
          selectedFiles.forEach(file => formData.append('files', file))

          const uploadResponse = await fetch('/api/chat/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => null)
            throw new Error(errorData?.error || 'Failed to upload files')
          }

          const uploadData = await uploadResponse.json()
          uploadedAttachments = uploadData.files || []
        } catch (error) {
          console.error('Failed to upload files:', error)
          toast.error('Error al subir archivos', 'Intenta nuevamente')
          setIsUploadingFiles(false)
          return
        }
        setIsUploadingFiles(false)
      }

      const timestamp = new Date()
      const userMessage: Message = {
        id: `${timestamp.getTime()}-user`,
        role: 'user',
        content,
        timestamp,
        type: 'text',
        readAt: null,
        deliveryStatus: 'sent',
        attachments: uploadedAttachments,
      }

      setMessages(prev => [...prev, userMessage])

      // Persist delivery status for FlowBot messages
      if (activeSidebarContact?.id) {
        updateDeliveryStatus(userMessage.id, activeSidebarContact.id, {
          deliveryStatus: 'sent',
          deliveredAt: timestamp.toISOString(),
          readAt: null,
        })
      }

      setInputValue('')
      setSelectedFiles([])

      // Get scheduled message for current contact
      const contactId = activeSidebarContact.id
      const scheduledForContact = scheduledMessages[contactId]
      if (scheduledForContact) {
        try {
          await cancelScheduledMessageById(scheduledForContact.id, scheduledForContact.contactId ?? contactId)
        } catch (error) {
          console.warn('FullScreenChatbot: failed to cancel scheduled message after manual send', error)
        }
      }

      composerRef.current?.focus({ preventScroll: true })
      setIsStreaming(true)

      // Add message to memory if service is available
      if (memoryService) {
        await memoryService.addMessage('user', content, { timestamp, messageId: userMessage.id })
      }

      // All chatbot intents and interactions are now handled by the backend
      // The backend will check for payment intents and handle them before sending to AI
      try {
        console.log('[FullScreenChatbot] Sending message to chatbot stream:', {
          message: content.substring(0, 50),
          sessionId,
          tenantId: currentTenantId,
          hasContext: !!conversationContext,
          paymentContext: conversationContext?.paymentContext,
        })

        const response = await fetch('/api/chatbot/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            sessionId,
            clientId: sessionId,
            tenantId: currentTenantId, // Required for payment link generation
            conversationContext,
            sessionToken,
          }),
        })

        console.log('[FullScreenChatbot] Chatbot stream response:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
        })

        if (!response.ok) {
          // Handle server error without throwing, to avoid noisy unhandled errors
          let serverMessage = ''
          try {
            const data = await response.json()
            serverMessage = (data as any)?.error || (data as any)?.message || ''
          } catch {
            try {
              serverMessage = await response.text()
            } catch {
              // ignore
            }
          }
          const friendly = serverMessage
            ? `Error del servidor: ${serverMessage}`
            : `El servidor respondió con un error (${response.status}). Inténtalo de nuevo más tarde.`
          toast.error('No se pudo enviar el mensaje', friendly)
          const fallback: Message = {
            id: `${Date.now()}-error`,
            role: 'assistant',
            content:
              'Lo siento, tuve un problema procesando tu solicitud. Intenta de nuevo en unos segundos.',
            timestamp: new Date(),
            type: 'text',
          }
          setMessages(prev => [...prev, fallback])
          setIsStreaming(false)
          return
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let fullResponse = ''
        let lastQuickActions: Message['quickActions'] | undefined
        let streamComplete = false
        let shouldBeSilent = false

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          type: 'text',
        }
        setMessages(prev => [...prev, assistantMessage])

        while (!streamComplete) {
          const { done, value } = await reader.read()
          if (done) {
            streamComplete = true
            setIsStreaming(false)
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const eventData = JSON.parse(line.slice(6))

              if (eventData.type === 'chunk' && typeof eventData.content === 'string') {
                fullResponse += eventData.content
                updateAssistantMessage(assistantMessage.id, fullResponse)
              }

              if (eventData.type === 'ui_action') {
                // Mobile full-screen chat ignores dashboard side-effects for now
              }

              if (eventData.type === 'complete') {
                console.log('[FullScreenChatbot] Received complete event:', {
                  hasFullResponse: typeof eventData.fullResponse === 'string',
                  responseLength: typeof eventData.fullResponse === 'string' ? eventData.fullResponse.length : 0,
                  responsePreview: typeof eventData.fullResponse === 'string' ? eventData.fullResponse.substring(0, 100) : 'none',
                  hasUpdatedContext: !!eventData.updatedConversationContext,
                  paymentContext: eventData.updatedConversationContext?.paymentContext,
                })

                if (typeof eventData.fullResponse === 'string') {
                  fullResponse = eventData.fullResponse
                }

                if (Array.isArray(eventData.quickActions)) {
                  lastQuickActions = eventData.quickActions
                }

                if (eventData.updatedConversationContext) {
                  setConversationContext(prev => ({
                    ...prev,
                    ...(eventData.updatedConversationContext as ConversationContext),
                  }))
                }

                if (eventData.isSilent) {
                  shouldBeSilent = true
                }

                streamComplete = true
                setIsStreaming(false)
                break
              }
            } catch (error) {
              console.warn('Failed to parse stream chunk', error)
            }
          }

          if (streamComplete) {
            try {
              await reader.cancel()
            } catch (error) {
              console.warn('FullScreenChatbot: failed to cancel reader after completion', error)
            }
            break
          }
        }

        if (shouldBeSilent) {
          setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
        } else {
          updateAssistantMessage(assistantMessage.id, fullResponse || 'Lo siento, no tengo respuesta en este momento.', lastQuickActions)

          // Mark user message as read when assistant responds
          if (activeSidebarContact?.id) {
            updateDeliveryStatus(userMessage.id, activeSidebarContact.id, {
              deliveryStatus: 'read',
              readAt: new Date().toISOString(),
            })
          }
        }

        // Add message to memory if service is available
        if (memoryService) {
          await memoryService.addMessage('assistant', fullResponse, {
            timestamp: assistantMessage.timestamp,
            messageId: assistantMessage.id,
          })
        }
      } catch (error) {
        console.error('FullScreenChatbot error:', error)
        const fallback: Message = {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: 'Lo siento, tuve un problema procesando tu solicitud. Intenta de nuevo en unos segundos.',
          timestamp: new Date(),
          type: 'text',
        }
        setMessages(prev => [...prev, fallback])
      } finally {
        setIsStreaming(false)
      }
    },
    [
      conversationContext,
      executeCommandForThread,
      inputValue,
      isFlowbotConversation,
      isTenantUserContact,
      isWhatsAppContact,
      activePeerUserId,
      activeSidebarContact.id,
      currentUserId,
      isStreaming,
      memoryService,
      resolveCommandFromInput,
      sendDirectMessage,
      sendWhatsAppMessage,
      fallbackEmail,
      sessionId,
      sessionToken,
      updateAssistantMessage,
      isUploadingFiles,
      selectedFiles,
    ],
  )

  const handleRequestNewCustomer = useCallback(() => {
    if (isFlowbotConversation) {
      void sendMessage('agregar nuevo cliente')
      return
    }

    toast.info('Cambia a FlowBot', 'Debes estar en el chat con FlowBot para agregar un nuevo cliente.')
  }, [isFlowbotConversation, sendMessage])

  const handleShowProducts = useCallback(async () => {
    if (!isFlowbotConversation) {
      toast.info('Selecciona FlowBot', 'Selecciona el chat de FlowBot para acceder a los productos.')
      return
    }
    try {
      await sendMessage('Necesito un link de pago')
    } catch (error) {
      console.error('FullScreenChatbot: failed to trigger payment flow', error)
    }
  }, [isFlowbotConversation, sendMessage])

  const handleQuickAction = useCallback(
    (quickAction: ChatQuickAction) => {
      if (!isFlowbotConversation) {
        toast.info('Selecciona FlowBot', 'Abre el chat de FlowBot para usar acciones rápidas.')
        return
      }
      const { action, id } = quickAction

      if (id === 'see-products' || action === 'show_products') {
        void handleShowProducts()
        return
      }

      if (id === 'see-schedule') {
        const scheduleMessage = preferredLanguage === 'es' ? 'Necesito agendar una cita' : 'I need to book an appointment'
        setInputValue(scheduleMessage)
        composerRef.current?.focus({ preventScroll: true })
        setTimeout(() => {
          void sendMessage(scheduleMessage)
        }, 0)
        return
      }

      setInputValue(action)
      composerRef.current?.focus({ preventScroll: true })
      setTimeout(() => {
        void sendMessage(action)
      }, 0)
    },
    [handleShowProducts, isFlowbotConversation, preferredLanguage, sendMessage],
  )

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.nativeEvent?.isComposing) {
        return
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        const canSend = isFlowbotConversation
          ? !isStreaming
          : isTenantUserContact
            ? !userChatSending
            : !commandExecuting
        if (canSend) {
          void sendMessage()
        }
      }
    },
    [commandExecuting, isFlowbotConversation, isStreaming, isTenantUserContact, sendMessage, userChatSending],
  )

  const handleCloseSessionById = useCallback(async (contactId: string, data: {
    annotation: string
    interactionType: string
    needsFollowUp: boolean
    followUpDate?: string
  }) => {
    if (!contactId) return

    try {
      setClosingContactId(contactId)
      const { user } = useAuthStore.getState()
      const response = await fetch(`/api/whatsapp/contacts/${contactId}/session/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: user?.id }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CloseSessionById] Error:', response.status, errorText)
        throw new Error(`Failed to close session: ${errorText}`)
      }

      toast.success('Sesión cerrada', 'La sesión ha sido cerrada exitosamente.')
      // Optimistic update
      syncContact(contactId, (c) => ({
        ...c,
        metadata: {
          ...(c.metadata as any),
          sessionStatus: 'closed',
        }
      }))
    } catch (error) {
      console.error('Error closing session:', error)
      toast.error('Error', 'No se pudo cerrar la sesión')
    } finally {
      setClosingContactId(null)
    }
  }, [syncContact])

  const handleCloseSession = useCallback(async (data: {
    annotation: string
    interactionType: string
    needsFollowUp: boolean
    followUpDate?: string
  }) => {
    await handleCloseSessionById(activeSidebarContact.id, data)
  }, [activeSidebarContact.id, handleCloseSessionById])

  const handleAssignSession = useCallback(async (userId: string) => {
    if (!activeSidebarContact.id) return

    try {
      const response = await fetch(`/api/whatsapp/contacts/${activeSidebarContact.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AssignSession] Error:', response.status, errorText)
        throw new Error(`Failed to assign session: ${errorText}`)
      }

      toast.success('Assigned', 'Contact assigned successfully.')
      void loadContacts({ sessionToken: sessionToken ?? null })
    } catch (error) {
      console.error('Error assigning session:', error)
      toast.error('Error', 'Failed to assign session')
    }
  }, [activeSidebarContact.id, loadContacts, sessionToken])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void sendMessage()
    },
    [sendMessage],
  )

  const safeAreaInsetTop = 'env(safe-area-inset-top, 0px)'
  const safeAreaInsetBottom = 'env(safe-area-inset-bottom, 0px)'
  const containerHeight = viewportHeight ? `${viewportHeight}px` : '100dvh'
  const keyboardOpened = keyboardInset > 0 || viewportOffsetTop > 0
  const basePadding = 'var(--composer-shell-padding, 1rem)'
  const composerPaddingBottom = keyboardOpened
    ? basePadding
    : `calc(${basePadding} + ${safeAreaInsetBottom})`

  // Handle keyboard opening - scroll to keep latest message visible
  useEffect(() => {
    if (keyboardOpened && !keyboardOpenedRef.current) {
      keyboardOpenedRef.current = true

      // Wait for keyboard animation, then scroll immediately
      setTimeout(() => {
        if (scrollRef.current) {
          // Use immediate scroll (auto) to keep message visible during keyboard animation
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })

          // Also try smooth scroll after a short delay to ensure it's at the bottom
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
            }
          }, 100)
        }
      }, 300) // Wait for keyboard animation to start
    }

    if (!keyboardOpened && keyboardOpenedRef.current) {
      keyboardOpenedRef.current = false
    }
  }, [keyboardOpened])

  // Also handle composer focus directly for more reliable keyboard detection
  useEffect(() => {
    const textarea = composerRef.current
    if (!textarea) return

    const handleFocus = () => {
      // Wait for keyboard to open, then scroll
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })

          // Try again after keyboard animation completes
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })
            }
          }, 300)
        }
      }, 200)
    }

    textarea.addEventListener('focus', handleFocus)
    return () => {
      textarea.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Calculate proper padding for messages area to ensure they're never hidden behind composer
  // When keyboard is open, we need MORE padding because composer is fixed and transformed up
  // When keyboard is closed, we need padding = composerHeight + safe area + small spacing
  const contentPaddingBottom = composerHeight
    ? keyboardOpened
      ? `${composerHeight + keyboardInset + 32}px` // Extra padding when keyboard is open
      : `${composerHeight + 24}px` // Normal padding when keyboard is closed
    : `calc(0.75rem + ${safeAreaInsetBottom})`

  const trimmedInputValue = inputValue.trim()
  const composerDisabled = false // Always allow typing - only disable send button when empty

  const localeForTime = preferredLanguage === 'es' ? 'es-PE' : 'en-US'

  const handleFormatLastActivity = useCallback((date?: Date) => {
    return formatTimeLabel(date, localeForTime)
  }, [localeForTime])

  const handleOpenSettings = useCallback(() => {
    setShowSettingsPanel(true)
  }, [])

  const crmSummary = useMemo(() => {
    if (!hasCrmTools) {
      return {
        stage: 'Automatizado',
        owner: 'FlowBot Concierge',
        segment: 'Asistente virtual',
        priority: 'Baja',
        tags: ['Sistema'],
      }
    }

    const tags: string[] = []
    if (activeContactRecord?.type === 'GROUP') {
      tags.push('Grupo')
    } else {
      tags.push('Individual')
    }
    if (activeContactRecord?.phone) {
      tags.push('Teléfono verificado')
    } else {
      tags.push('Sin teléfono')
    }
    if (activeContactRecord?.description) {
      tags.push('Perfil completo')
    }

    return {
      stage: activeContactRecord?.description ? 'En seguimiento' : 'Nuevo lead',
      owner: activeContactRecord?.type === 'GROUP' ? 'Equipo comercial' : 'Sin asignar',
      segment: activeContactRecord?.type === 'GROUP' ? 'Cuenta empresarial' : 'Cliente potencial',
      priority: activeContactRecord?.phone ? 'Alta' : 'Media',
      tags,
    }
  }, [hasCrmTools, activeContactRecord])

  const crmActivities = useMemo(() => {
    const activities: Array<{ id: string; label: string; detail: string; time: string }> = []
    const locale = safeString(localeForTime || 'en-US')

    const lastActivityDate = safeDate(activeSidebarContact?.lastActivity)
    if (lastActivityDate) {
      activities.push({
        id: 'last-activity',
        label: 'Última interacción',
        detail: safeString(activeSidebarContact?.lastMessage || 'Sin mensajes recientes'),
        time: formatDateTime(lastActivityDate, locale),
      })
    }

    if (activeContactRecord && isNonEmptyString(activeContactRecord.description)) {
      const updatedAtDate = safeDate(activeContactRecord.updatedAt)
      if (updatedAtDate) {
        activities.push({
          id: 'description',
          label: 'Nota interna',
          detail: safeString(activeContactRecord.description),
          time: formatDateTime(updatedAtDate, locale),
        })
      }
    }

    const createdAt = safeDate(activeContactRecord?.createdAt)
    if (createdAt) {
      activities.push({
        id: 'created-at',
        label: 'Registro creado',
        detail: 'Contacto añadido al CRM',
        time: formatDateTime(createdAt, locale),
      })
    }

    if (activities.length === 0) {
      activities.push({
        id: 'empty',
        label: 'Sin actividad',
        detail: 'Aún no registramos acciones para este contacto.',
        time: '—',
      })
    }

    return activities
  }, [activeContactRecord, activeSidebarContact, localeForTime])

  useEffect(() => {
    setCrmActiveTab('summary')
  }, [activeSidebarContact.id])

  const navigateAdminPath = useCallback((path: string) => {
    setChatbotOpen(false)
    router.push(path)
  }, [router, setChatbotOpen])

  const openAdminOverview = useCallback(() => {
    navigateAdminPath('/admin')
  }, [navigateAdminPath])

  const openAdminSettings = useCallback(() => {
    navigateAdminPath('/admin/settings')
  }, [navigateAdminPath])

  const goToCommunications = useCallback((view?: string) => {
    setChatbotOpen(false)
    const suffix = view ? `?view=${view}` : ''
    router.push(`/admin/communications${suffix}`)
  }, [router, setChatbotOpen])

  const openCommunicationsComposer = useCallback(() => {
    goToCommunications('composer')
  }, [goToCommunications])

  const openCommunicationsTemplates = useCallback(() => {
    goToCommunications('templates')
  }, [goToCommunications])

  const openCommunicationsStudio = useCallback(() => {
    goToCommunications('studio')
  }, [goToCommunications])

  const openCommunicationsSettings = useCallback(() => {
    goToCommunications('settings')
  }, [goToCommunications])

  const openCrmHubFromAdmin = useCallback(() => {
    setChatbotOpen(false)
    redirectToCrmHub()
  }, [redirectToCrmHub, setChatbotOpen])

  const communicationsSummaries = useMemo<CommunicationsBroadcastSummary[]>(() => {
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'es-ES'
    return [...paymentNotifications]
      .slice(-5)
      .reverse()
      .map(record => {
        const timestamp = new Date(record.timestamp)
        const baseTitle = record.payload.link?.description
          || record.payload.customer?.name
          || 'Pago recibido'
        const channel = (record.payload.mode ?? 'pago').toString().toUpperCase()
        const amount = record.payload.amount
        const currency = record.payload.currency
        const statusLabel = amount != null
          ? `${amount}${currency ? ` ${currency}` : ''}`
          : undefined
        return {
          id: record.id,
          title: baseTitle,
          channel,
          timestampLabel: timestamp.toLocaleString(locale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          statusLabel,
        }
      })
  }, [paymentNotifications])

  const contactCount = Array.isArray(contacts) ? contacts.length : 0
  const crmCustomerCount = crmCustomers.length
  const paymentNotificationCount = paymentNotifications.length

  const rightPanelContext = useRightPanelContext({
    admin: {
      authUser,
      dashboardUser,
      contactCount,
      crmCustomerCount,
      paymentNotificationCount,
      handlers: {
        openOverview: openAdminOverview,
        openCrmHub: openCrmHubFromAdmin,
        goToCommunications,
        openSettings: openAdminSettings,
      },
    },
    communications: {
      unreadCount: paymentNotificationCount,
      broadcasts: communicationsSummaries,
      handlers: {
        openComposer: openCommunicationsComposer,
        openTemplates: openCommunicationsTemplates,
        openStudio: openCommunicationsStudio,
        openSettings: openCommunicationsSettings,
      },
    },
    crm: {
      activeTab: crmActiveTab,
      setActiveTab: setCrmActiveTab,
      hasCrmTools,
      sessionStartTime: activeSidebarContact.sessionStartTime instanceof Date
        ? activeSidebarContact.sessionStartTime.toISOString()
        : activeSidebarContact.sessionStartTime,
      summary: crmSummary,
      activities: crmActivities,
      customers: crmCustomers,
      loadingCustomers,
      selectedCustomerId,
      tenantId: crmTenantId,
      sessionToken,
      currentUserId: crmCurrentUserId,
      currentUserName: crmCurrentUserName,
      assignees: crmAssignees,
      conversationMessages: crmConversationMessages,
      contactProfile: crmContactProfile,
      onRegisterContact: handleRegisterContact,
      onUpdateContact: handleUpdateContact,
      ticketPanelCommand: undefined,
      onTicketPanelCommandHandled: undefined,
      handlers: {
        onSelectCustomer: handleSelectCustomer,
        onAssignTicket: handleAssignTicket,
        onScheduleFollowUp: handleScheduleFollowUp,
        onConvertToCustomer: handleConvertToCustomer,
        onLogNote: handleLogNote,
        onRedirectTickets: redirectToCrmHub,
        onRequestNewCustomer: handleRequestNewCustomer,
        onCreateCustomer: handleCreateCustomer,
        onInsertTicketMessage: handleInsertTicketMessage,
        onCloseSession: handleCloseSession,
        onAssignSession: handleAssignSession,
      },
    },
  })

  useTypingEmitterCleanup({
    activeContactId: activeSidebarContact.id,
    emitTypingState,
    lastTypingTargetRef,
    typingEmitTimeoutRef,
    localTypingStateRef,
  })

  const activeStatusLine = activeSidebarContact.isFlowbot
    ? 'Disponible 24/7'
    : isTenantUserContact
      ? activePeerOnline
        ? 'En línea'
        : 'Desconectado'
      : activeSidebarContact.lastActivity
        ? `Último visto ${formatTimeLabel(activeSidebarContact.lastActivity, localeForTime)}`
        : activeSidebarContact.subtitle ?? 'Sin estado disponible'

  const handleSelectContact = useCallback(
    async (contactId: string) => {
      setSelectedContactId(contactId)
      setShowContactsPanel(false)

      // Find the contact to check if it's a WhatsApp contact (not FlowBot, not TenantUser)
      const contact = sidebarEntries.find(entry => entry.id === contactId)
      if (contact && !contact.isFlowbot && contact.type !== 'TENANT_USER') {
        // Open session for WhatsApp contacts
        try {
          const { user: currentUser } = useAuthStore.getState()
          await fetch(`/api/whatsapp/contacts/${contactId}/session/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser?.id })
          })
          // Optimistic update of session status
          syncContact(contactId, (c) => ({
            ...c,
            metadata: {
              ...(c.metadata as any),
              sessionStatus: 'open',
              sessionStartTime: new Date().toISOString()
            }
          }))
        } catch (error) {
          console.error('[handleSelectContact] Failed to open session:', error)
        }
      }
    },
    [setShowContactsPanel, setSelectedContactId, sidebarEntries, loadContacts, sessionToken],
  )

  const handleLogout = useCallback(async () => {
    try {
      setShowLogoutModal(false)

      // Immediately show loading overlay to prevent flash of chat UI
      const loadingOverlay = document.createElement('div')
      loadingOverlay.id = 'logout-overlay'
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        color: white;
        font-size: 18px;
      `
      loadingOverlay.innerHTML = '<div>Cerrando sesión...</div>'
      document.body.appendChild(loadingOverlay)

      // Call logout to clear state and revoke session
      await logout()

      // Wait a bit to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100))

      // Build logout redirect URL with locale and tenant context
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      const locale = pathname.split('/')[1] || 'es'
      const tenant = chatAuthTenantId || chatAuthLastTenantId
      const baseUrl = locale ? `/${locale}/otp-login` : '/otp-login'
      const logoutUrl = tenant ? `${baseUrl}?tenant=${tenant}` : baseUrl

      console.log('[FullScreenChatbot] Logout redirect:', { locale, tenant, logoutUrl })

      // Use window.location.replace for a hard redirect that clears history
      // This ensures a complete page reload and clears all state
      window.location.replace(logoutUrl)
    } catch (error) {
      console.error('[FullScreenChatbot] Failed to logout:', error)

      // Remove loading overlay on error
      const overlay = document.getElementById('logout-overlay')
      if (overlay) overlay.remove()

      // Even if logout fails, clear localStorage and redirect
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('chat-auth-storage')
        } catch (e) {
          console.warn('[FullScreenChatbot] Failed to clear localStorage on error:', e)
        }
      }
      // Build fallback redirect URL
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      const locale = pathname.split('/')[1] || 'es'
      const tenant = chatAuthTenantId || chatAuthLastTenantId
      const baseUrl = locale ? `/${locale}/otp-login` : '/otp-login'
      const logoutUrl = tenant ? `${baseUrl}?tenant=${tenant}` : baseUrl

      // Use replace instead of href to prevent back button issues
      window.location.replace(logoutUrl)
    }
  }, [logout, chatAuthTenantId, chatAuthLastTenantId])

  const handleSignIn = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearAuthError()

    const result = await authLogin(signInEmail, signInPassword)
    if (result.success) {
      setShowSignInModal(false)
      setSignInEmail('')
      setSignInPassword('')
      router.push('/admin')
    }
  }, [authLogin, signInEmail, signInPassword, clearAuthError, router])

  return (
    <>

      <ChatbotShellLayout
        themeId={activeThemeId}
        containerHeight={containerHeight}
        viewportOffsetTop={viewportOffsetTop}
        dialogs={
          <ChatbotDialogs
            messageInfoDialog={messageInfoDialog}
            onCloseMessageInfo={() => setMessageInfoDialog({ open: false, message: null })}
            showLogoutModal={showLogoutModal}
            onChangeLogoutModal={setShowLogoutModal}
            onLogout={handleLogout}
            showSignInModal={showSignInModal}
            onChangeSignInModal={setShowSignInModal}
            onSignIn={handleSignIn}
            authError={authError}
            clearAuthError={clearAuthError}
            authLoading={authLoading}
            signInEmail={signInEmail}
            setSignInEmail={setSignInEmail}
            signInPassword={signInPassword}
            setSignInPassword={setSignInPassword}
            showSignInPassword={showSignInPassword}
            setShowSignInPassword={setShowSignInPassword}
          />
        }
      >
        <GlobalSessionManagerModal
          open={showSessionManagerModal}
          onOpenChange={setShowSessionManagerModal}
          openSessions={openSessions}
          onCloseSession={handleCloseSessionById}
          isClosing={!!closingContactId}
        />
        <div className="flex h-full w-full flex-1 flex-col">
          <div className="flex h-full w-full md:hidden">
            <MobileChatInterface
              activeSidebarContact={activeSidebarContact}
              activeStatusLine={activeStatusLine}
              sidebarEntries={sidebarEntries}
              filteredSidebarEntries={filteredSidebarEntries}
              contactsLoading={contactsLoading}
              contactsError={contactsError}
              onRetryContacts={() => {
                const tenantId = authUser?.tenantId ?? dashboardUser?.tenantId ?? undefined
                void loadContacts({ sessionToken: sessionToken ?? null, tenantId })
              }}
              sidebarQuery={sidebarQuery}
              setSidebarQuery={setSidebarQuery}
              handleSelectContact={handleSelectContact}
              handleOpenSettings={handleOpenSettings}
              handleFormatLastActivity={handleFormatLastActivity}
              messages={conversationMessages}
              isLoadingMessages={false}
              isStreaming={isStreaming}
              composerRef={composerRef}
              inputValue={inputValue}
              handleComposerChange={handleComposerChange}
              handleComposerKeyDown={handleComposerKeyDown}
              composerPlaceholder={composerPlaceholder}
              composerDisabled={composerDisabled}
              handleComposerSubmit={handleSubmit}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              isUploadingFiles={isUploadingFiles}
              messageInfoDialog={messageInfoDialog}
              setMessageInfoDialog={setMessageInfoDialog}
              flowbotEntry={flowbotFallbackEntry}
              onScheduleFollowUp={handleScheduleFollowUp}
              onQuickAction={handleQuickAction}
              scheduledAt={scheduledMessages[activeSidebarContact.id]?.scheduledAt ?? null}
              onClearSchedule={() => {
                void handleScheduleSelection(null)
              }}
              userEmail={currentUserEmail ?? null}
              userRole={authUser?.role ?? dashboardUser?.role ?? null}
              onLogout={handleLogout}
              onScheduledMessageClick={(message) => {
                const contactId = activeSidebarContact.id
                const scheduled = scheduledMessages[contactId]
                if (scheduled) {
                  setPreviewScheduledMessage(scheduled)
                }
              }}
            />
          </div>

          <div className="relative hidden h-full w-full flex-1 overflow-hidden md:flex md:flex-row">
            <ChatbotSidebar
              entries={sidebarEntries}
              filteredEntries={filteredSidebarEntries}
              activeEntry={activeSidebarContact}
              flowbotEntry={flowbotFallbackEntry}
              loading={contactsLoading}
              query={sidebarQuery}
              onQueryChange={setSidebarQuery}
              onSelectContact={handleSelectContact}
              onOpenSettings={handleOpenSettings}
              formatLastActivity={handleFormatLastActivity}
            />
            <div
              className={cn('relative flex flex-1', isFlowbotConversation && 'chatbot-thread-surface')}
              style={!isFlowbotConversation ? { background: 'var(--chatbot-sidebar-bg)' } : undefined}
            >
              {showContactsPanel && (
                <div className="absolute inset-0 z-40 flex md:hidden">
                  <ChatContactsPanel
                    tenantId={currentTenantId}
                    sessionToken={sessionToken}
                    onClose={() => setShowContactsPanel(false)}
                    onSelectContact={handleSelectContact}
                    onOpenSettings={() => {
                      setShowContactsPanel(false)
                      setShowSettingsPanel(true)
                    }}
                    onlineUserIds={onlineUserIds}
                  />
                </div>
              )}
              {showSettingsPanel && (
                <div
                  className="fixed inset-0 z-[100] flex bg-white/95 backdrop-blur-sm overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="settings-panel-title"
                  onClick={(e) => {
                    // Close on backdrop click
                    if (e.target === e.currentTarget) {
                      setShowSettingsPanel(false)
                    }
                  }}
                >
                  <ChatUserSettingsPanel open={showSettingsPanel} onClose={() => setShowSettingsPanel(false)} />
                </div>
              )}
              <div className="flex w-full flex-col lg:flex-row">
                <section className="flex flex-1 flex-col">
                  <header
                    className="sticky top-0 z-10 chatbot-header chatbot-thread-header flex items-center justify-between border-b px-3 sm:px-5"
                    style={{ paddingTop: `calc(${safeAreaInsetTop} + 1.1rem)` }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowContactsPanel(true)}
                        className={cn(
                          'inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:hidden',
                          showContactsPanel && 'bg-white/20',
                        )}
                        aria-label="Abrir lista de chats"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div className="flex flex-col">
                        <span className="chatbot-header-title text-base font-semibold">
                          {activeSidebarContact.name}
                        </span>
                        <span className="text-xs normal-case text-slate-200">{activeStatusLine}</span>
                      </div>
                    </div>
                    {/* Open Sessions Counter */}
                    <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Users className="h-4 w-4 text-emerald-400" />
                          {openSessionsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-200">
                          {openSessionsCount} {openSessionsCount === 1 ? 'Sesión abierta' : 'Sesiones abiertas'}
                        </span>
                      </div>
                      <div className="w-px h-3 bg-white/10" />
                      <button
                        onClick={() => setShowSessionManagerModal(true)}
                        className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Gestionar
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <NotificationToggle variant="ghost" size="sm" className="hidden md:inline-flex" />
                      <div className="hidden md:block">
                        <FlowBotToggle sessionToken={sessionToken} tenantId={currentTenantId} />
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenSettings}
                        className="chatbot-sidebar-pill-secondary hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm hover:bg-white/10 transition-colors"
                        aria-label="Abrir configuración"
                        title="Configuración"
                      >
                        <Settings className="h-5 w-5" style={{ color: 'var(--chatbot-sidebar-text, white)' }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="chatbot-sidebar-pill-secondary hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm hover:bg-red-500/10 transition-colors"
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                      >
                        <LogOut className="h-5 w-5" style={{ color: 'var(--chatbot-sidebar-text, white)' }} />
                      </button>
                    </div>
                  </header>
                  <main
                    ref={scrollRef}
                    className="mobile-message-container auto-scroll-on-keyboard flex-1 overflow-y-auto bg-[#f5f1ed] px-4 pb-1 pt-3 sm:px-6 sm:pt-4 md:px-10 md:pt-6"
                    style={{
                      paddingBottom: contentPaddingBottom,
                      scrollPaddingBottom: contentPaddingBottom,
                      overscrollBehavior: 'contain',
                      backgroundColor: '#f5f1ed',
                    }}
                  >
                    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 sm:gap-2.5">
                      {(timelineItems || []).length ? (
                        (timelineItems || []).map((item, index) => {
                          if (item.type === 'session_end') {
                            const summary = item.data
                            return (
                              <div key={`end-${index}-${summary.id}`} className="flex w-full justify-center py-4 flex-col items-center gap-1">
                                <div className="bg-slate-200 dark:bg-slate-700/50 rounded-full px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 shadow-sm text-center">
                                  Sesión finalizada {item.date.toLocaleDateString(localeForTime)} · {formatTimeLabel(item.date, localeForTime)}
                                  {summary.authorName && ` por ${summary.authorName}`}
                                </div>
                                {summary.summary && (
                                  <div className="text-[10px] text-slate-400 max-w-[80%] text-center mt-1 italic">
                                    "{summary.summary}"
                                  </div>
                                )}
                              </div>
                            )
                          }

                          if (item.type === 'session_start') {
                            const activity = item.data
                            return (
                              <div key={`start-${index}-${activity.id}`} className="flex w-full justify-center py-4">
                                <div className="bg-green-100 dark:bg-green-900/30 rounded-full px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-sm">
                                  Sesión iniciada {item.date.toLocaleDateString(localeForTime)} · {formatTimeLabel(item.date, localeForTime)}
                                  {activity.authorName && ` por ${activity.authorName}`}
                                </div>
                              </div>
                            )
                          }

                          if (item.type === 'transfer') {
                            const activity = item.data
                            const metadata = activity.metadata || {}
                            return (
                              <div key={`transfer-${index}-${activity.id}`} className="flex w-full justify-center py-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shadow-sm">
                                  Transferido {metadata.from ? `de ${metadata.from} ` : ''}a {metadata.to}
                                </div>
                              </div>
                            )
                          }

                          if (item.type !== 'message') return null

                          const message = item.data as Message

                          // Session visualization logic (Legacy / Fallback)
                          const currentSessionId = message.metadata?.sessionId as string | undefined

                          // Look back for previous MESSAGE (skip events) - simplistic approach: check immediate previous item
                          // Ideally we should scan back, but immediate previous is strictly used for divider logic
                          const previousItem = index > 0 ? timelineItems[index - 1] : null
                          const previousMessage = previousItem?.type === 'message' ? previousItem.data as Message : null
                          const previousSessionId = previousMessage?.metadata?.sessionId as string | undefined

                          // Show inferred divider only if we don't have explicit session_start nearby (too complex to check)
                          // AND if explicit sessionId changed
                          const showSessionDivider = currentSessionId && (index === 0 || (previousMessage && currentSessionId !== previousSessionId))

                          const isUser = message.role === 'user'
                          const showDeliveryMeta = isUser // Show delivery status for all user messages
                          const showTimestamp = isTenantUserContact && !isUser // Show timestamp for incoming messages in tenant chats
                          const hasError = (message.deliveryStatus as string) === 'failed'
                          const isDeleted = message.isDeleted

                          // Determine status with explicit fallbacks
                          let normalizedStatus = message.deliveryStatus
                          if (!normalizedStatus && showDeliveryMeta) {
                            if (message.readAt) normalizedStatus = 'read'
                            else if (message.deliveredAt) normalizedStatus = 'delivered'
                            else normalizedStatus = 'sent' // Default to sent if no other status
                          }
                          const isScheduled = message.deliveryStatus === 'scheduled' || message.status === 'scheduled'

                          let StatusIcon: typeof Check | typeof CheckCheck | null = null
                          let statusLabel: string | null = null
                          let iconClass = 'text-slate-400'
                          let labelClass = 'text-slate-600 dark:text-slate-400'

                          if (normalizedStatus === 'sending') {
                            StatusIcon = Check
                            statusLabel = 'Enviando…'
                            iconClass = 'text-slate-400 opacity-70'
                            labelClass = 'text-slate-200'
                          } else if (isScheduled) {
                            StatusIcon = Clock
                            const scheduledDate = message.scheduledFor ?? (message.scheduledForRaw ? new Date(message.scheduledForRaw) : null)
                            statusLabel = scheduledDate
                              ? `Programado · ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Programado'
                            iconClass = 'text-amber-500'
                            labelClass = 'text-amber-600 dark:text-amber-400'
                          } else if (normalizedStatus === 'sent') {
                            StatusIcon = CheckCheck
                            statusLabel = `Enviado · ${formatTimeLabel(message.timestamp, localeForTime)}`
                            iconClass = 'text-slate-400'
                            labelClass = 'text-slate-200'
                          } else if (normalizedStatus === 'delivered') {
                            StatusIcon = CheckCheck
                            statusLabel = `Recibido · ${formatTimeLabel(message.deliveredAt ?? message.timestamp, localeForTime)}`
                            iconClass = 'text-slate-400'
                            labelClass = 'text-slate-200'
                          } else if (normalizedStatus === 'read') {
                            StatusIcon = CheckCheck
                            statusLabel = `Leído · ${formatTimeLabel(message.readAt ?? new Date(), localeForTime)}`
                            iconClass = 'text-sky-500'
                            labelClass = 'text-slate-200'
                          } else if (showTimestamp) {
                            // For incoming messages (assistant role), just show timestamp
                            statusLabel = formatTimeLabel(message.timestamp, localeForTime)
                            labelClass = 'text-slate-400 dark:text-slate-500'
                          }
                          const isEditing = editingMessageId === message.id
                          const canEdit = canEditMessage(message)

                          return (
                            <div key={message.id} className="flex flex-col w-full">
                              {showSessionDivider && (
                                <div className="flex w-full justify-center py-4">
                                  <div className="bg-slate-200 dark:bg-slate-700/50 rounded-full px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 shadow-sm">
                                    Sesión iniciada
                                  </div>
                                </div>
                              )}
                              <div className="flex w-full items-center gap-3">
                                {isForwarding && (
                                  <div className="flex shrink-0 items-center justify-center">
                                    <input
                                      type="checkbox"
                                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                      checked={selectedMessages.has(message.id)}
                                      onChange={() => {
                                        const newSelected = new Set(selectedMessages)
                                        if (newSelected.has(message.id)) {
                                          newSelected.delete(message.id)
                                        } else {
                                          newSelected.add(message.id)
                                        }
                                        setSelectedMessages(newSelected)
                                      }}
                                    />
                                  </div>
                                )}
                                <div
                                  className={cn('group relative flex w-full items-end gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
                                  onMouseEnter={() => handleMessageMouseEnter(message.id)}
                                  onMouseLeave={handleMessageMouseLeave}
                                  onClick={() => {
                                    if (isForwarding) {
                                      const newSelected = new Set(selectedMessages)
                                      if (newSelected.has(message.id)) {
                                        newSelected.delete(message.id)
                                      } else {
                                        newSelected.add(message.id)
                                      }
                                      setSelectedMessages(newSelected)
                                    }
                                  }}
                                >
                                  {(hoveredMessageId === message.id || openDropdownMessageId === message.id) && !isForwarding && (
                                    <DropdownMenu
                                      onOpenChange={(open) => {
                                        if (open) {
                                          setOpenDropdownMessageId(message.id)
                                        } else {
                                          setOpenDropdownMessageId(null)
                                          setHoveredMessageId(null)
                                        }
                                      }}
                                    >
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          className="absolute top-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:shadow-xl dark:bg-slate-800 dark:text-gray-200 dark:border-slate-700 dark:hover:bg-slate-700"
                                          style={{ transform: 'translate(8px, -8px)' }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                          }}
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700" side="bottom" sideOffset={4}>
                                        <DropdownMenuItem
                                          onClick={() => setMessageInfoDialog({ open: true, message })}
                                          className="cursor-pointer text-gray-900 dark:text-gray-100"
                                        >
                                          <Info className="mr-2 h-4 w-4" />
                                          Ver información
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setIsForwarding(true)
                                            setSelectedMessages(new Set([message.id]))
                                          }}
                                          className="cursor-pointer text-gray-900 dark:text-gray-100"
                                        >
                                          <Forward className="mr-2 h-4 w-4" />
                                          Reenviar
                                        </DropdownMenuItem>
                                        {canEdit && (
                                          <DropdownMenuItem
                                            onClick={() => handleStartEdit(message)}
                                            className="cursor-pointer text-gray-900 dark:text-gray-100"
                                          >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar mensaje
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => {
                                            if (window.confirm('¿Estás seguro de eliminar este mensaje?')) {
                                              handleDeleteMessage(message.id)
                                            }
                                          }}
                                          className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Eliminar mensaje
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                  <div
                                    className={cn(
                                      'relative flex max-w-[85%] flex-col gap-1 rounded-2xl px-3 py-2 text-sm shadow-sm transition-all sm:max-w-[75%]',
                                      isUser
                                        ? 'rounded-br-none bg-[var(--chatbot-user-bubble)] text-[var(--chatbot-user-text)] chatbot-user-bubble animate-message-pop-in-user'
                                        : 'rounded-bl-none bg-[var(--chatbot-assistant-bubble)] text-[var(--chatbot-assistant-text)] chatbot-assistant-bubble animate-message-pop-in-bot',
                                      hasError && 'border-red-500 bg-red-50 text-red-900',
                                      isDeleted && 'opacity-70 grayscale',
                                    )}
                                    onClick={(e) => {
                                      // Handle click for scheduled messages
                                      if (isScheduled) {
                                        e.stopPropagation()
                                        const contactId = activeSidebarContact.id
                                        const scheduled = scheduledMessages[contactId]
                                        if (scheduled) {
                                          setPreviewScheduledMessage(scheduled)
                                        }
                                      }
                                    }}
                                  >
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={editingContent}
                                          onChange={(e) => setEditingContent(e.target.value)}
                                          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                          rows={3}
                                          autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCancelEdit}
                                            className="h-7 text-xs"
                                          >
                                            Cancelar
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveEdit(message.id)}
                                            className="h-7 text-xs bg-gray-800 hover:bg-gray-700 text-white"
                                          >
                                            Guardar
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {message.isDeleted ? (
                                          <div className="italic text-red-300 dark:text-red-300 text-sm">
                                            Este mensaje fue eliminado
                                          </div>
                                        ) : (
                                          <>
                                            <div
                                              className="space-y-3 text-sm leading-relaxed tracking-[0.01em] sm:text-base"
                                              style={{ color: 'inherit' }} // Force inheritance from parent bubble
                                            >
                                              {renderMessageContent(message.content, message.id)}
                                            </div>
                                            {message.attachments && message.attachments.length > 0 && (
                                              <AttachmentsList attachments={message.attachments} />
                                            )}
                                            {message.editedAt && (
                                              <div className="text-[0.65rem] text-yellow-300 dark:text-yellow-300 italic">
                                                editado
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {isFlowbotConversation && message.quickActions?.length ? (
                                      <div className={cn('mt-3 flex flex-wrap gap-2', isUser ? 'justify-end' : 'justify-start')}>
                                        {(message.quickActions || []).map(action => (
                                          <button
                                            key={`${message.id}-${action.action}`}
                                            type="button"
                                            onClick={() => handleQuickAction(action)}
                                            className="chatbot-quick-action rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/30"
                                          >
                                            {action.label}
                                          </button>
                                        ))}
                                      </div>
                                    ) : null}
                                    {(showDeliveryMeta || showTimestamp) && statusLabel ? (
                                      <div className={cn(
                                        'mt-2 flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide',
                                        isUser ? 'justify-end' : 'justify-start'
                                      )}>
                                        {StatusIcon ? (
                                          <StatusIcon className={cn('h-3.5 w-3.5', iconClass)} />
                                        ) : null}
                                        <span className={labelClass}>{statusLabel}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm !text-gray-900">

                          {isFlowbotConversation
                            ? 'Aún no hay mensajes en esta conversación. Saluda a FlowBot para comenzar.'
                            : isTenantUserContact
                              ? 'Comienza la conversación enviando un mensaje directo a tu compañero de equipo.'
                              : 'Escribe un comando con @ para invitar a FlowBot a este chat. Ejemplo: @links para compartir enlaces de pago.'}
                        </div>
                      )}

                      {isTenantUserContact && typingContacts[activeSidebarContact.id] ? (
                        <div className="mt-2 flex w-full items-center gap-3 text-xs font-semibold uppercase tracking-wide text-emerald-600 sm:text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                            <span className="relative flex h-2 w-6 items-center justify-between">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:120ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:240ms]" />
                            </span>
                          </div>
                          {'Escribiendo...'}
                        </div>
                      ) : null}

                      {isFlowbotConversation && isStreaming ? (
                        <div className="flex w-full items-center justify-start gap-3 text-sm text-slate-500">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{
                              background: 'var(--chatbot-sidebar-pill-bg)',
                              border: '1px solid var(--chatbot-sidebar-border)',
                            }}
                          >
                            <span className="relative flex h-2 w-8 items-center justify-between">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:120ms]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:240ms]" />
                            </span>
                          </div>
                          FlowBot está escribiendo…
                        </div>
                      ) : null}

                      {!isFlowbotConversation && isTenantUserContact && userChatSending ? (
                        <div className="flex w-full items-center justify-start gap-3 text-sm text-slate-400">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{
                              background: 'var(--chatbot-sidebar-pill-bg)',
                              border: '1px solid var(--chatbot-sidebar-border)',
                            }}
                          >
                            <span className="relative flex h-2 w-8 items-center justify-between">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:120ms]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:240ms]" />
                            </span>
                          </div>
                          Enviando mensaje…
                        </div>
                      ) : null}

                      {!isFlowbotConversation && !isTenantUserContact && commandExecuting ? (
                        <div className="flex w-full items-center justify-start gap-3 text-sm text-slate-400">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{
                              background: 'var(--chatbot-sidebar-pill-bg)',
                              border: '1px solid var(--chatbot-sidebar-border)',
                            }}
                          >
                            <span className="relative flex h-2 w-8 items-center justify-between">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:120ms]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:240ms]" />
                            </span>
                          </div>
                          FlowBot está preparando la información…
                        </div>
                      ) : null}
                    </div>
                  </main>
                  <div
                    ref={composerContainerRef}
                    className="chatbot-composer-shell mobile-input-shell-fixed keyboard-aware-container mt-auto border-t border-t-[rgba(0,0,0,0.1)] bg-[#f5f1ed] md:border-t md:relative focus-within:ring-0 focus-within:outline-none focus-within:border-t-[rgba(0,0,0,0.1)]"
                    style={{
                      paddingBottom: composerPaddingBottom,
                      paddingTop: basePadding,
                      borderTopColor: 'rgba(0, 0, 0, 0.1)',
                      borderTopWidth: '1px',
                      borderTopStyle: 'solid',
                      backgroundColor: '#f5f1ed',
                      position: isDesktop ? 'relative' : 'fixed',
                      bottom: isDesktop ? undefined : (keyboardOpened ? `${keyboardInset}px` : safeAreaInsetBottom),
                      left: isDesktop ? undefined : 0,
                      right: isDesktop ? undefined : 0,
                      zIndex: isDesktop ? undefined : 10,
                      transition: isDesktop ? undefined : 'bottom 0.2s ease-out',
                    }}
                    onFocus={(e) => {
                      const target = e.currentTarget
                      target.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
                      target.style.outlineColor = 'rgba(255, 255, 255, 0.8)'
                      target.style.outlineOffset = '2px'
                      target.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                      target.style.borderTopColor = 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Scheduled Message Indicator */}
                    {(() => {
                      const scheduled = scheduledMessages[activeSidebarContact.id]
                      if (!scheduled) {
                        return null
                      }

                      const scheduledCount = scheduledEntries.length
                      const now = new Date()
                      const diffMs = scheduled.scheduledAt.getTime() - now.getTime()
                      const diffMins = Math.floor(diffMs / 60000)
                      const diffHours = Math.floor(diffMs / 3600000)
                      const diffDays = Math.floor(diffMs / 86400000)

                      const timeLabel =
                        diffMs <= 0
                          ? 'pendiente de envío'
                          : diffMins < 60
                            ? `en ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
                            : diffHours < 24
                              ? `en ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
                              : diffDays < 7
                                ? `en ${diffDays} día${diffDays !== 1 ? 's' : ''}`
                                : scheduled.scheduledAt.toLocaleString('es-PE', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })

                      return (
                        <div className="mx-auto mb-2 w-full max-w-3xl px-2 sm:px-3">
                          <div className="flex items-center gap-2 rounded-lg bg-amber-600 border border-amber-700 px-3 py-2 dark:bg-amber-950/80 dark:border-amber-800">
                            <CalendarClock className="h-4 w-4 text-white dark:text-white shrink-0" />
                            <button
                              type="button"
                              onClick={() => setScheduledMessagesModalOpen(true)}
                              className="flex-1 text-left"
                            >
                              <span className="text-xs font-semibold text-white dark:text-white">
                                {scheduledCount > 1
                                  ? `${scheduledCount} mensajes programados`
                                  : `Mensaje programado ${timeLabel}`}
                              </span>
                              {scheduled.status === 'FAILED' && scheduled.lastError ? (
                                <span className="mt-0.5 block text-[10px] text-white/80">
                                  Error: {scheduled.lastError}
                                </span>
                              ) : null}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleScheduleSelection(null)
                              }}
                              className="shrink-0 p-1 rounded-full hover:bg-amber-700 dark:hover:bg-amber-900/50 transition-colors"
                              aria-label="Cancelar programación"
                            >
                              <X className="h-3.5 w-3.5 text-white dark:text-white" />
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                    {/* File Upload Area */}
                    {selectedFiles.length > 0 && (
                      <div className="mx-auto mb-2 w-full max-w-3xl px-2 sm:px-3">
                        <FileUpload
                          onFilesSelected={setSelectedFiles}
                          onFilesCleared={() => setSelectedFiles([])}
                          selectedFiles={selectedFiles}
                          disabled={isUploadingFiles || isStreaming}
                        />
                      </div>
                    )}

                    {isForwarding ? (
                      <div className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-3xl bg-white p-3 shadow-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsForwarding(false)
                              setSelectedMessages(new Set())
                            }}
                            className="text-gray-600 dark:text-gray-300"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {selectedMessages.size} mensaje{selectedMessages.size !== 1 ? 's' : ''} seleccionado{selectedMessages.size !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            if (selectedMessages.size > 0) {
                              // TODO: Implement contact selector
                              alert(`Reenviando ${selectedMessages.size} mensajes... (Selector de contactos pendiente)`)
                              setIsForwarding(false)
                              setSelectedMessages(new Set())
                            }
                          }}
                          disabled={selectedMessages.size === 0}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Forward className="mr-2 h-4 w-4" />
                          Reenviar
                        </Button>
                      </div>
                    ) : (
                      <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="chatbot-composer mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl bg-white p-2 sm:p-3 focus-within:ring-0 focus-within:outline-none"
                        name="chat-message-form"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid rgba(0, 0, 0, 0.15)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
                          e.currentTarget.style.outlineOffset = '2px'
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        <textarea
                          ref={composerRef}
                          value={inputValue}
                          onChange={event => {
                            // Use onChange for React state management
                            handleComposerChange(event.target.value)
                          }}
                          onFocus={event => {
                            // Change focus color to white
                            const target = event.currentTarget
                            target.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
                            target.style.outlineOffset = '2px'
                            target.style.outlineColor = 'rgba(255, 255, 255, 0.8)'
                            target.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                            target.style.border = 'none'
                            target.style.borderColor = 'transparent'
                            // Use requestAnimationFrame to ensure it persists
                            requestAnimationFrame(() => {
                              target.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
                              target.style.outlineColor = 'rgba(255, 255, 255, 0.8)'
                              target.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                            })
                          }}
                          onBlur={event => {
                            // Remove focus styles when not focused
                            const target = event.currentTarget
                            target.style.outline = 'none'
                            target.style.boxShadow = 'none'
                          }}
                          onInput={event => {
                            // Handle height adjustment and ensure autocomplete works
                            const target = event.currentTarget
                            target.style.height = 'auto'
                            target.style.height = `${Math.min(target.scrollHeight, 96)}px`
                            // Ensure white focus styling is maintained
                            target.style.outline = '2px solid rgba(255, 255, 255, 0.8)'
                            target.style.outlineOffset = '2px'
                            target.style.outlineColor = 'rgba(255, 255, 255, 0.8)'
                            target.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.5)'
                            target.style.border = 'none'
                            target.style.borderColor = 'transparent'

                            // Ensure the value is synced for iOS autocomplete
                            if (target.value !== inputValue) {
                              handleComposerChange(target.value)
                            }
                          }}
                          placeholder={composerPlaceholder}
                          className="chatbot-composer-textarea flex-1 resize-none bg-white text-[15px] placeholder:text-slate-400 sm:text-base"
                          style={{
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            outlineWidth: '0',
                            outlineStyle: 'none',
                            outlineColor: 'transparent',
                            boxShadow: 'none',
                            border: 'none',
                            borderWidth: '0',
                            borderStyle: 'none',
                            borderColor: 'transparent',
                            WebkitAppearance: 'none',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          rows={1}
                          onKeyDown={handleComposerKeyDown}
                          autoComplete="off"
                          autoCorrect="on"
                          autoCapitalize="sentences"
                          spellCheck="true"
                          name="message"
                          inputMode="text"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (isWhatsAppContact) {
                              toast.info('Pronto podrás compartir archivos', 'La carga de archivos para WhatsApp estará disponible en futuras actualizaciones.')
                              return
                            }

                            if (selectedFiles.length === 0) {
                              // Open file picker
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.multiple = true
                              input.accept = 'image/*,video/*,.pdf'
                              input.onchange = (e) => {
                                const files = (e.target as HTMLInputElement).files
                                if (files && files.length > 0) {
                                  const fileArray = Array.from(files)
                                  const validation = FileValidator.validateFiles(fileArray)
                                  if (validation.valid) {
                                    setSelectedFiles(fileArray)
                                  } else {
                                    toast.error('Error al seleccionar archivos', validation.error || 'Archivos inválidos')
                                  }
                                }
                              }
                              input.click()
                            } else {
                              // Clear files if already selected
                              setSelectedFiles([])
                            }
                          }}
                          disabled={isUploadingFiles || isStreaming}
                          className="h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none"
                        >
                          <Paperclip className={cn('h-4 w-4', selectedFiles.length > 0 && 'text-blue-500')} />
                        </Button>
                        {/* Schedule Button */}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={handleScheduleFollowUp}
                          disabled={isUploadingFiles || isStreaming}
                          className="h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none"
                          aria-label="Programar mensaje"
                          title="Programar mensaje"
                        >
                          <CalendarClock className={cn('h-4 w-4', scheduledMessages[activeSidebarContact.id] && 'text-amber-500')} />
                        </Button>
                        <Button
                          type="submit"
                          size="icon"
                          disabled={composerDisabled && selectedFiles.length === 0}
                          className="chatbot-composer-send h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none"
                        >
                          {isUploadingFiles ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                </section>
                {panelPlugins.length > 0 && activePanelId && (
                  <PanelHost
                    plugins={panelPlugins}
                    activePluginId={activePanelId}
                    onChange={setActivePanelId}
                    context={rightPanelContext}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Schedule Bottom Sheet */}
          <ScheduleBottomSheet
            open={scheduleSheetOpen}
            onOpenChange={setScheduleSheetOpen}
            onSelect={date => {
              void handleScheduleSelection(date)
            }}
            sessionToken={sessionToken}
            messageContent={inputValue}
            hasFiles={selectedFiles.length > 0}
          />

          {/* Scheduled Message Preview Dialog */}
          <Dialog open={!!previewScheduledMessage} onOpenChange={(open) => {
            if (!open) setPreviewScheduledMessage(null)
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  Mensaje Programado
                </DialogTitle>
                <DialogDescription>
                  Vista previa del mensaje programado para enviar
                </DialogDescription>
              </DialogHeader>
              {previewScheduledMessage && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Se enviará el:
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {previewScheduledMessage.scheduledAt.toLocaleString('es-PE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-white">
                      Estado: {previewScheduledMessage.status.toLowerCase()}
                    </span>
                    {previewScheduledMessage.lastError ? (
                      <span className="text-[10px] text-amber-100">{previewScheduledMessage.lastError}</span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Contenido del mensaje:
                    </p>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {previewScheduledMessage.content || '(Sin contenido)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await cancelScheduledMessageById(
                            previewScheduledMessage.id,
                            previewScheduledMessage.contactId ?? activeSidebarContact.id,
                          )
                          toast.success('Programación cancelada')
                          setPreviewScheduledMessage(null)
                        } catch (error) {
                          console.error('FullScreenChatbot: failed to cancel scheduled message from preview', error)
                          toast.error(
                            'No se pudo cancelar el mensaje programado',
                            error instanceof Error ? error.message : 'Intenta nuevamente.',
                          )
                        }
                      }}
                    >
                      Cancelar programación
                    </Button>
                    <Button onClick={() => setPreviewScheduledMessage(null)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Scheduled Messages Modal - Shows all scheduled messages */}
          <Dialog open={scheduledMessagesModalOpen} onOpenChange={setScheduledMessagesModalOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  Mensajes Programados
                </DialogTitle>
                <DialogDescription>
                  {scheduledEntries.length === 0
                    ? 'No hay mensajes programados'
                    : `${scheduledEntries.length} mensaje${scheduledEntries.length !== 1 ? 's' : ''} programado${scheduledEntries.length !== 1 ? 's' : ''}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {scheduledEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarClock className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No hay mensajes programados</p>
                  </div>
                ) : (
                  scheduledEntries
                    .sort(([, a], [, b]) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                    .map(([contactId, scheduled]) => {
                      const contact = contacts.find(c => c.id === contactId || c.id === scheduled.contactId)
                      let contactName = 'Contacto desconocido'
                      if (contact) {
                        const displayName =
                          'displayName' in contact ? ((contact as Record<string, unknown>).displayName as string | undefined) : undefined
                        const name =
                          'name' in contact ? ((contact as Record<string, unknown>).name as string | undefined) : undefined
                        contactName = displayName || name || 'Contacto desconocido'
                      } else if (activeSidebarContact.id === contactId) {
                        contactName = activeSidebarContact.name
                      }
                      const now = new Date()
                      const diffMs = scheduled.scheduledAt.getTime() - now.getTime()
                      const diffMins = Math.floor(diffMs / 60000)
                      const diffHours = Math.floor(diffMs / 3600000)
                      const diffDays = Math.floor(diffMs / 86400000)
                      const isExpired = diffMs < 0
                      const isUpcoming = diffMs > 0 && diffMins < 60

                      const formatTimeRemaining = () => {
                        if (isExpired) {
                          return 'Expirado'
                        }
                        if (diffMins < 60) {
                          return `en ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
                        } else if (diffHours < 24) {
                          return `en ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
                        } else if (diffDays < 7) {
                          return `en ${diffDays} día${diffDays !== 1 ? 's' : ''}`
                        } else {
                          return scheduled.scheduledAt.toLocaleString('es-PE', {
                            weekday: 'short',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      }

                      return (
                        <div
                          key={`${contactId}-${scheduled.id}`}
                          className={cn(
                            'rounded-lg border p-4 transition-colors',
                            isExpired
                              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                              : isUpcoming
                                ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
                                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {contactName}
                                </h4>
                                {isExpired && (
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                                    Expirado
                                  </span>
                                )}
                                {isUpcoming && !isExpired && (
                                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                                    Próximo
                                  </span>
                                )}
                                <span className="text-xs font-medium text-white/90 bg-emerald-600/60 px-2 py-0.5 rounded-full capitalize">
                                  {scheduled.status.toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <CalendarClock className="h-4 w-4 shrink-0" />
                                <span className="font-medium">
                                  {scheduled.scheduledAt.toLocaleString('es-PE', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                <span>{formatTimeRemaining()}</span>
                              </div>
                              <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-900/50 p-2">
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {scheduled.content || '(Sin contenido)'}
                                </p>
                              </div>
                              {scheduled.lastError ? (
                                <p className="mt-2 text-xs text-red-500 dark:text-red-300">{scheduled.lastError}</p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await cancelScheduledMessageById(scheduled.id, scheduled.contactId ?? contactId)
                                  toast.success('Programación cancelada')
                                } catch (error) {
                                  console.error('FullScreenChatbot: failed to cancel scheduled message from modal', error)
                                  toast.error(
                                    'No se pudo cancelar el mensaje programado',
                                    error instanceof Error ? error.message : 'Intenta nuevamente.',
                                  )
                                }
                              }}
                              className="shrink-0 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                              aria-label="Cancelar programación"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setScheduledMessagesModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ChatbotShellLayout>
      <ChatUserSettingsPanel
        open={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
      />
    </>
  )
}

export default FullScreenChatbot

