import { ensureMemorySession, loadMemorySessionContext, updateMemorySessionMetadata } from '@/lib/services/ai/chatbot-memory-service'
import { detectLanguageSync, type SupportedLanguage } from './language-detector'
import { createChatbotTelemetry } from './telemetry'
import type {
  ConversationState,
  ConversationStep,
  ConversationMessage,
  UserData,
  AppointmentData,
  PaymentContext,
  TransitionRecord,
} from './types'

const memory = new Map<string, ConversationState>()
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

interface PersistedState {
  sessionId: string
  currentStep: ConversationStep
  language: SupportedLanguage
  userData: UserData
  appointmentData: AppointmentData
  conversationHistory: Array<Omit<ConversationMessage, 'timestamp'> & { timestamp: string }>
  attemptCount: ConversationState['attemptCount']
  shownWeeks: ConversationState['shownWeeks']
  phoneDeclined: boolean
  questionsAsked: string[]
  topicsDiscussed: string[]
  shownSlotIds: string[]
  lastActivity: string
  pendingAction: ConversationState['pendingAction']
  showingAllDays?: boolean
  userTimezone?: string | null
  paymentContext: PaymentContext
  transitionLog?: TransitionRecord[]
}

function createInitialPaymentContext(): PaymentContext {
  return {
    stage: 'idle',
    productId: null,
    productName: null,
    amountCents: null,
    currency: null,
    linkToken: null,
    linkUrl: null,
    linkRoute: null,
    lastGeneratedAt: null,
    customerName: null,
    customerEmail: null,
    nameConfirmed: false,
    emailConfirmed: false,
    confirmed: false,
    selectedCustomerId: null,
    selectedCustomerType: null,
    historyOffset: 0,
    historyPageSize: 5,
    lastViewedAt: null,
  }
}

export function createConversationState(sessionId: string): ConversationState {
  const now = new Date()
  return {
    sessionId,
    currentStep: 'GREETING',
    language: 'en',
    userData: {
      name: null,
      email: null,
      phone: null,
    },
    appointmentData: {
      selectedSlotId: null,
      selectedSlotLabel: null,
      preferredDate: null,
      preferredTime: null,
      displayedSlots: [],
    },
    conversationHistory: [],
    attemptCount: {
      name: 0,
      email: 0,
      phone: 0,
    },
    shownWeeks: [],
    phoneDeclined: false,
    questionsAsked: new Set(),
    topicsDiscussed: new Set(),
    shownSlotIds: [],
    lastActivity: now,
    pendingAction: null,
    userTimezone: null,
    showingAllDays: false,
    paymentContext: createInitialPaymentContext(),
    transitionLog: [],
  }
}

function serializeState(state: ConversationState): PersistedState {
  return {
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    language: state.language,
    userData: state.userData,
    appointmentData: state.appointmentData,
    conversationHistory: state.conversationHistory.map(message => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    })),
    attemptCount: state.attemptCount,
    shownWeeks: state.shownWeeks,
    phoneDeclined: state.phoneDeclined,
    questionsAsked: Array.from(state.questionsAsked),
    topicsDiscussed: Array.from(state.topicsDiscussed),
    shownSlotIds: state.shownSlotIds,
    lastActivity: state.lastActivity.toISOString(),
    pendingAction: state.pendingAction,
    showingAllDays: state.showingAllDays,
    paymentContext: state.paymentContext,
    transitionLog: state.transitionLog.map(entry => ({
      from: entry.from,
      to: entry.to,
      intent: entry.intent,
      reason: entry.reason,
      timestamp: entry.timestamp,
      source: entry.source,
    })),
  }
}

function deserializeState(raw: PersistedState): ConversationState {
  return {
    sessionId: raw.sessionId,
    currentStep: raw.currentStep,
    language: raw.language,
    userData: raw.userData,
    userTimezone: raw.userTimezone ?? null,
    appointmentData: {
      selectedSlotId: raw.appointmentData?.selectedSlotId ?? null,
      selectedSlotLabel: raw.appointmentData?.selectedSlotLabel ?? null,
      preferredDate: raw.appointmentData?.preferredDate ?? null,
      preferredTime: raw.appointmentData?.preferredTime ?? null,
      displayedSlots: raw.appointmentData?.displayedSlots ?? [],
    },
    conversationHistory: raw.conversationHistory.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
    attemptCount: raw.attemptCount,
    shownWeeks: raw.shownWeeks ?? [],
    phoneDeclined: raw.phoneDeclined ?? false,
    questionsAsked: new Set(raw.questionsAsked ?? []),
    topicsDiscussed: new Set(raw.topicsDiscussed ?? []),
    shownSlotIds: raw.shownSlotIds ?? [],
    lastActivity: raw.lastActivity ? new Date(raw.lastActivity) : new Date(),
    pendingAction: raw.pendingAction ?? null,
    showingAllDays: raw.showingAllDays ?? false,
    paymentContext: raw.paymentContext
      ? {
        ...createInitialPaymentContext(),
        ...raw.paymentContext,
        nameConfirmed: Boolean(raw.paymentContext.nameConfirmed),
        emailConfirmed: Boolean(raw.paymentContext.emailConfirmed),
        confirmed: Boolean(raw.paymentContext.confirmed),
      }
      : createInitialPaymentContext(),
    transitionLog: Array.isArray(raw.transitionLog)
      ? raw.transitionLog.map(entry => ({
        from: entry.from as TransitionRecord['from'],
        to: entry.to as TransitionRecord['to'],
        intent: (entry.intent ?? 'UNKNOWN') as TransitionRecord['intent'],
        reason: (entry.reason ?? 'transition') as TransitionRecord['reason'],
        timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : new Date().toISOString(),
        source: entry.source === 'test' ? 'test' : 'live',
      }))
      : [],
  }
}

function isExpired(state: ConversationState): boolean {
  return Date.now() - state.lastActivity.getTime() > SESSION_TIMEOUT_MS
}

export async function getConversationState(sessionId: string, tenantId: string): Promise<ConversationState> {
  const telemetry = createChatbotTelemetry(sessionId, tenantId)
  const cached = memory.get(sessionId)
  if (cached && !isExpired(cached)) {
    return cached
  }

  await ensureMemorySession(sessionId, tenantId)

  try {
    const metadata = await loadMemorySessionContext(sessionId, tenantId)
    if (metadata && typeof metadata === 'object' && 'chatbotState' in metadata) {
      const state = deserializeState((metadata as { chatbotState: PersistedState }).chatbotState)
      if (!isExpired(state)) {
        memory.set(sessionId, state)
        return state
      }
    }
  } catch (error) {
    telemetry.warn('chatbot.state_load_failed', {
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }

  const initial = createConversationState(sessionId)
  memory.set(sessionId, initial)
  return initial
}

export async function updateConversationState(
  sessionId: string,
  tenantId: string,
  updates: Partial<ConversationState>,
): Promise<ConversationState> {
  const telemetry = createChatbotTelemetry(sessionId, tenantId)

  // Try to get from memory, or load from storage, or create new
  let current = memory.get(sessionId)

  if (!current) {
    try {
      // Try to load from storage if not in memory
      const metadata = await loadMemorySessionContext(sessionId, tenantId)
      if (metadata && typeof metadata === 'object' && 'chatbotState' in metadata) {
        const loaded = deserializeState((metadata as { chatbotState: PersistedState }).chatbotState)
        if (!isExpired(loaded)) {
          current = loaded
          memory.set(sessionId, current)
        }
      }
    } catch (error) {
      // Ignore load error, will create new state
    }
  }

  if (!current) {
    current = createConversationState(sessionId)
  }

  // Ensure paymentContext exists (handling legacy state in memory)
  const currentPaymentContext = current.paymentContext || createInitialPaymentContext()

  const merged: ConversationState = {
    ...current,
    ...updates,
    userData: { ...current.userData, ...updates.userData },
    appointmentData: { ...current.appointmentData, ...updates.appointmentData },
    conversationHistory: updates.conversationHistory ?? current.conversationHistory,
    attemptCount: updates.attemptCount ?? current.attemptCount,
    shownWeeks: updates.shownWeeks ?? current.shownWeeks,
    questionsAsked: updates.questionsAsked ?? current.questionsAsked,
    topicsDiscussed: updates.topicsDiscussed ?? current.topicsDiscussed,
    shownSlotIds: updates.shownSlotIds ?? current.shownSlotIds,
    lastActivity: updates.lastActivity ?? new Date(),
    paymentContext: updates.paymentContext
      ? {
        ...currentPaymentContext,
        ...updates.paymentContext,
        nameConfirmed: updates.paymentContext.nameConfirmed ?? currentPaymentContext.nameConfirmed,
        emailConfirmed: updates.paymentContext.emailConfirmed ?? currentPaymentContext.emailConfirmed,
      }
      : currentPaymentContext,
    transitionLog: updates.transitionLog ?? current.transitionLog,
  }

  memory.set(sessionId, merged)

  try {
    await updateMemorySessionMetadata(sessionId, tenantId, {
      chatbotState: serializeState(merged),
    })
  } catch (error) {
    telemetry.warn('chatbot.state_persist_failed', {
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }

  return merged
}

export function hasUserData(state: ConversationState, field: keyof UserData): boolean {
  return Boolean(state.userData[field])
}

export function shouldAskFor(state: ConversationState, field: keyof UserData): boolean {
  if (field === 'phone') {
    return !state.phoneDeclined && !state.userData.phone
  }
  return !state.userData[field]
}

export function recordConversationMessage(
  state: ConversationState,
  role: ConversationMessage['role'],
  content: string,
  language?: SupportedLanguage,
): ConversationState {
  const updatedHistory = [
    ...state.conversationHistory,
    {
      role,
      content,
      timestamp: new Date(),
      language: language ?? detectLanguageSync(content),
    },
  ]

  const updated = {
    ...state,
    conversationHistory: updatedHistory,
    lastActivity: new Date(),
  }

  memory.set(state.sessionId, updated)
  return updated
}

export async function resetConversationState(sessionId: string, tenantId: string): Promise<void> {
  memory.delete(sessionId)
  await updateMemorySessionMetadata(sessionId, tenantId, { chatbotState: serializeState(createConversationState(sessionId)) })
}
