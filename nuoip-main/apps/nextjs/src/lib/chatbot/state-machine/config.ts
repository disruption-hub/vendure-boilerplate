import type { ConversationStep, IntentType } from '../types'

type TransitionKey = IntentType | 'ANY'

interface StateDefinition {
  description: string
  /** Intents that are valid while the conversation is in this state */
  allowedIntents: IntentType[]
  /** Next steps permitted from this state keyed by triggering intent */
  transitions: Partial<Record<TransitionKey, ConversationStep[]>>
  /** Optional flag to mark states that should always roll back to AWAITING_INTENT after guard-rail responses */
  fallbackState?: ConversationStep
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const set = <T extends ConversationStep>(values: T[]): T[] => Array.from(new Set(values))

export const stateMachineConfig: Record<ConversationStep, StateDefinition> = {
  GREETING: {
    description: 'Initial greeting before intents are gathered',
    allowedIntents: [
      'GREETING',
      'PRICING_QUESTION',
      'TECHNICAL_SPECS',
      'COMPANY_INFO',
      'SCHEDULE_APPOINTMENT',
      'ASK_QUESTION',
      'VIEW_PAYMENT_HISTORY',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'UNKNOWN',
    ],
    transitions: {
      GREETING: ['AWAITING_INTENT'],
      PRICING_QUESTION: ['AWAITING_INTENT'],
      TECHNICAL_SPECS: ['AWAITING_INTENT'],
      COMPANY_INFO: ['AWAITING_INTENT'],
      SCHEDULE_APPOINTMENT: ['COLLECTING_NAME', 'COLLECTING_EMAIL', 'COLLECTING_PHONE', 'SHOWING_SLOTS', 'AWAITING_INTENT'],
      ASK_QUESTION: ['AWAITING_INTENT'],
      VIEW_PAYMENT_HISTORY: ['AWAITING_INTENT'],
      OFF_TOPIC: ['AWAITING_INTENT'],
      HARMFUL_CONTENT: ['AWAITING_INTENT'],
      UNKNOWN: ['AWAITING_INTENT'],
      ANY: ['GREETING'],
    },
    fallbackState: 'AWAITING_INTENT',
  },
  AWAITING_INTENT: {
    description: 'Listening for the primary intent from the user',
    allowedIntents: [
      'PRICING_QUESTION',
      'TECHNICAL_SPECS',
      'COMPANY_INFO',
      'SCHEDULE_APPOINTMENT',
      'ASK_QUESTION',
      'VIEW_PAYMENT_HISTORY',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'GREETING',
      'UNKNOWN',
    ],
    transitions: {
      PRICING_QUESTION: ['AWAITING_INTENT'],
      TECHNICAL_SPECS: ['AWAITING_INTENT'],
      COMPANY_INFO: ['AWAITING_INTENT'],
      ASK_QUESTION: ['AWAITING_INTENT'],
      VIEW_PAYMENT_HISTORY: ['AWAITING_INTENT'],
      OFF_TOPIC: ['AWAITING_INTENT'],
      HARMFUL_CONTENT: ['AWAITING_INTENT'],
      GREETING: ['AWAITING_INTENT'],
      UNKNOWN: ['AWAITING_INTENT'],
      SCHEDULE_APPOINTMENT: ['COLLECTING_NAME', 'COLLECTING_EMAIL', 'COLLECTING_PHONE', 'SHOWING_SLOTS'],
      ANY: ['AWAITING_INTENT'],
    },
    fallbackState: 'AWAITING_INTENT',
  },
  COLLECTING_NAME: {
    description: 'Collecting or validating the user name before scheduling',
    allowedIntents: [
      'PROVIDE_NAME',
      'UNKNOWN',
      'ASK_QUESTION',
      'PRICING_QUESTION',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'VIEW_PAYMENT_HISTORY',
    ],
    transitions: {
      PROVIDE_NAME: ['COLLECTING_EMAIL'],
      UNKNOWN: ['COLLECTING_NAME'],
      ASK_QUESTION: ['AWAITING_INTENT', 'COLLECTING_NAME'],
      PRICING_QUESTION: ['AWAITING_INTENT', 'COLLECTING_NAME'],
      VIEW_PAYMENT_HISTORY: ['COLLECTING_NAME'],
      OFF_TOPIC: ['COLLECTING_NAME'],
      HARMFUL_CONTENT: ['COLLECTING_NAME'],
      ANY: ['COLLECTING_NAME'],
    },
    fallbackState: 'COLLECTING_NAME',
  },
  COLLECTING_EMAIL: {
    description: 'Collecting or validating the user email before scheduling',
    allowedIntents: [
      'PROVIDE_EMAIL',
      'UNKNOWN',
      'ASK_QUESTION',
      'PRICING_QUESTION',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'VIEW_PAYMENT_HISTORY',
    ],
    transitions: {
      PROVIDE_EMAIL: ['COLLECTING_PHONE', 'SHOWING_SLOTS'],
      UNKNOWN: ['COLLECTING_EMAIL'],
      ASK_QUESTION: ['AWAITING_INTENT', 'COLLECTING_EMAIL'],
      PRICING_QUESTION: ['AWAITING_INTENT', 'COLLECTING_EMAIL'],
      VIEW_PAYMENT_HISTORY: ['COLLECTING_EMAIL'],
      OFF_TOPIC: ['COLLECTING_EMAIL'],
      HARMFUL_CONTENT: ['COLLECTING_EMAIL'],
      ANY: ['COLLECTING_EMAIL'],
    },
    fallbackState: 'COLLECTING_EMAIL',
  },
  COLLECTING_PHONE: {
    description: 'Optionally collecting phone number after email',
    allowedIntents: [
      'PROVIDE_PHONE',
      'DECLINE_PHONE',
      'UNKNOWN',
      'ASK_QUESTION',
      'PRICING_QUESTION',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'VIEW_PAYMENT_HISTORY',
    ],
    transitions: {
      PROVIDE_PHONE: ['SHOWING_SLOTS'],
      DECLINE_PHONE: ['SHOWING_SLOTS'],
      UNKNOWN: ['COLLECTING_PHONE'],
      ASK_QUESTION: ['AWAITING_INTENT', 'COLLECTING_PHONE'],
      PRICING_QUESTION: ['AWAITING_INTENT', 'COLLECTING_PHONE'],
      VIEW_PAYMENT_HISTORY: ['COLLECTING_PHONE'],
      OFF_TOPIC: ['COLLECTING_PHONE'],
      HARMFUL_CONTENT: ['COLLECTING_PHONE'],
      ANY: ['COLLECTING_PHONE'],
    },
    fallbackState: 'COLLECTING_PHONE',
  },
  SHOWING_SLOTS: {
    description: 'Presenting available schedule slots and handling navigation',
    allowedIntents: [
      'SELECT_TIME_SLOT',
      'REQUEST_NEXT_WEEK',
      'REQUEST_SPECIFIC_DATE',
      'ASK_QUESTION',
      'UNKNOWN',
      'PRICING_QUESTION',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'SCHEDULE_APPOINTMENT',
      'VIEW_PAYMENT_HISTORY',
    ],
    transitions: {
      SELECT_TIME_SLOT: ['CONFIRMING'],
      REQUEST_NEXT_WEEK: ['SHOWING_SLOTS'],
      REQUEST_SPECIFIC_DATE: ['SHOWING_SLOTS'],
      ASK_QUESTION: ['AWAITING_INTENT', 'SHOWING_SLOTS'],
      UNKNOWN: ['SHOWING_SLOTS'],
      PRICING_QUESTION: ['AWAITING_INTENT'],
      OFF_TOPIC: ['SHOWING_SLOTS'],
      HARMFUL_CONTENT: ['SHOWING_SLOTS'],
      SCHEDULE_APPOINTMENT: ['SHOWING_SLOTS'],
      VIEW_PAYMENT_HISTORY: ['SHOWING_SLOTS'],
      ANY: ['SHOWING_SLOTS'],
    },
    fallbackState: 'AWAITING_INTENT',
  },
  CONFIRMING: {
    description: 'Confirming the selected slot before booking',
    allowedIntents: [
      'CONFIRM_APPOINTMENT',
      'SELECT_TIME_SLOT',
      'REQUEST_NEXT_WEEK',
      'REQUEST_SPECIFIC_DATE',
      'ASK_QUESTION',
      'UNKNOWN',
      'PRICING_QUESTION',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'VIEW_PAYMENT_HISTORY',
    ],
    transitions: {
      CONFIRM_APPOINTMENT: ['COMPLETED', 'SHOWING_SLOTS'],
      SELECT_TIME_SLOT: ['CONFIRMING', 'SHOWING_SLOTS'],
      REQUEST_NEXT_WEEK: ['SHOWING_SLOTS'],
      REQUEST_SPECIFIC_DATE: ['SHOWING_SLOTS'],
      ASK_QUESTION: ['AWAITING_INTENT', 'CONFIRMING'],
      UNKNOWN: ['CONFIRMING'],
      PRICING_QUESTION: ['AWAITING_INTENT'],
      OFF_TOPIC: ['CONFIRMING'],
      HARMFUL_CONTENT: ['CONFIRMING'],
      VIEW_PAYMENT_HISTORY: ['CONFIRMING'],
      ANY: ['CONFIRMING'],
    },
    fallbackState: 'AWAITING_INTENT',
  },
  COMPLETED: {
    description: 'Appointment booked – conversation can continue or restart',
    allowedIntents: [
      'SCHEDULE_APPOINTMENT',
      'ASK_QUESTION',
      'PRICING_QUESTION',
      'TECHNICAL_SPECS',
      'COMPANY_INFO',
      'OFF_TOPIC',
      'HARMFUL_CONTENT',
      'UNKNOWN',
      'VIEW_PAYMENT_HISTORY',
    ],
    transitions: {
      SCHEDULE_APPOINTMENT: ['COLLECTING_NAME', 'COLLECTING_EMAIL', 'COLLECTING_PHONE', 'SHOWING_SLOTS'],
      ASK_QUESTION: ['AWAITING_INTENT'],
      PRICING_QUESTION: ['AWAITING_INTENT'],
      TECHNICAL_SPECS: ['AWAITING_INTENT'],
      COMPANY_INFO: ['AWAITING_INTENT'],
      OFF_TOPIC: ['COMPLETED'],
      HARMFUL_CONTENT: ['COMPLETED'],
      UNKNOWN: ['AWAITING_INTENT'],
      VIEW_PAYMENT_HISTORY: ['COMPLETED'],
      ANY: ['COMPLETED'],
    },
    fallbackState: 'AWAITING_INTENT',
  },
}

export function isIntentAllowed(state: ConversationStep, intent: IntentType): boolean {
  const definition = stateMachineConfig[state]
  return definition ? definition.allowedIntents.includes(intent) : false
}

export function isTransitionAllowed(
  from: ConversationStep,
  to: ConversationStep,
  intent: IntentType | 'ANY',
): boolean {
  const definition = stateMachineConfig[from]
  if (!definition) {
    return false
  }

  const candidates = new Set([
    ...(definition.transitions[intent as TransitionKey] ?? []),
    ...(definition.transitions.ANY ?? []),
  ])

  return candidates.has(to)
}

export function getFallbackState(state: ConversationStep): ConversationStep | null {
  return stateMachineConfig[state]?.fallbackState ?? null
}
