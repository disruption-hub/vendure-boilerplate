import type { SupportedLanguage } from './language-detector'

export type ConversationStep =
  | 'GREETING'
  | 'AWAITING_INTENT'
  | 'COLLECTING_NAME'
  | 'COLLECTING_EMAIL'
  | 'COLLECTING_PHONE'
  | 'SHOWING_SLOTS'
  | 'CONFIRMING'
  | 'COMPLETED'

export interface UserData {
  name: string | null
  email: string | null
  phone: string | null
}

export interface AppointmentData {
  selectedSlotId: string | null
  selectedSlotLabel: string | null
  preferredDate: string | null
  preferredTime: string | null
  displayedSlots: Array<{
    id: string
    label: string
    start: string
    end: string
  }>
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  language: SupportedLanguage
}

export interface AttemptCount {
  name: number
  email: number
  phone: number
}

export type PendingAction =
  | 'schedule_prompt'
  | 'payment_select_product'
  | 'payment_collect_name'
  | 'payment_collect_email'
  | 'payment_confirm'
  | 'payment_new_link_confirm'
  | 'payment_history_more'
  | 'client_collect_name'
  | 'client_collect_email'
  | 'client_collect_phone'
  | null

export interface PaymentContext {
  stage: 'idle' | 'awaiting_product' | 'awaiting_name' | 'awaiting_email' | 'awaiting_confirmation' | 'ready' | 'completed' | 'history'
  productId: string | null
  productName: string | null
  amountCents: number | null
  currency: string | null
  linkToken: string | null
  linkUrl: string | null
  linkRoute: string | null
  lastGeneratedAt: string | null
  customerName: string | null
  customerEmail: string | null
  nameConfirmed: boolean
  emailConfirmed: boolean
  confirmed: boolean
  selectedCustomerId: string | null
  selectedCustomerType: 'lead' | 'contact' | null
  historyOffset: number
  historyPageSize: number
  lastViewedAt: string | null
}

export type TransitionSource = 'test' | 'live'

export type TransitionReason = 'transition' | 'guard_rail' | 'invalid_intent' | 'invalid_transition'

export interface TransitionRecord {
  from: ConversationStep
  to: ConversationStep
  intent: IntentType | 'ANY'
  reason: TransitionReason
  timestamp: string
  source: TransitionSource
}

export interface ConversationState {
  sessionId: string
  currentStep: ConversationStep
  language: SupportedLanguage
  userData: UserData
  appointmentData: AppointmentData
  conversationHistory: ConversationMessage[]
  attemptCount: AttemptCount
  shownWeeks: Array<'current' | 'next' | 'specific'>
  phoneDeclined: boolean
  questionsAsked: Set<string>
  topicsDiscussed: Set<string>
  shownSlotIds: string[]
  lastActivity: Date
  pendingAction: PendingAction
  userTimezone: string | null
  showingAllDays: boolean
  paymentContext: PaymentContext
  transitionLog: TransitionRecord[]
}

export interface RouteResult {
  response: string
  nextState: ConversationStep
  data?: Partial<ConversationState>
}

export interface IntentEntities {
  name?: string
  email?: string
  phone?: string
  dateTime?: string
  weekPreference?: 'current' | 'next'
  specificDate?: string
  slotId?: string
}

export type IntentType =
  | 'GREETING'
  | 'PRICING_QUESTION'
  | 'TECHNICAL_SPECS'
  | 'COMPANY_INFO'
  | 'SCHEDULE_APPOINTMENT'
  | 'CONFIRM_APPOINTMENT'
  | 'SELECT_TIME_SLOT'
  | 'REQUEST_NEXT_WEEK'
  | 'REQUEST_SPECIFIC_DATE'
  | 'PROVIDE_NAME'
  | 'PROVIDE_EMAIL'
  | 'PROVIDE_PHONE'
  | 'DECLINE_PHONE'
  | 'ASK_QUESTION'
  | 'VIEW_PAYMENT_HISTORY'
  | 'REQUEST_PAYMENT_LINK'
  | 'OFF_TOPIC'
  | 'HARMFUL_CONTENT'
  | 'UNKNOWN'

export interface IntentResult {
  intent: IntentType
  confidence: number
  entities: IntentEntities
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface ConversationContextSnapshot {
  state: ConversationStep
  userData: UserData
  appointmentData: AppointmentData
}
