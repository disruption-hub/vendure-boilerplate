import { stateMachineConfig } from './config'
import type { ConversationStep, IntentType } from '../types'

export type FlowCategory = 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge'

export const stateCategories: Record<ConversationStep, FlowCategory> = {
  GREETING: 'core',
  AWAITING_INTENT: 'core',
  COLLECTING_NAME: 'profile',
  COLLECTING_EMAIL: 'profile',
  COLLECTING_PHONE: 'profile',
  SHOWING_SLOTS: 'appointment',
  CONFIRMING: 'appointment',
  COMPLETED: 'core',
}

export const stateShapes: Partial<Record<ConversationStep, 'rounded' | 'stadium' | 'circle' | 'diamond'>> = {
  GREETING: 'stadium',
  AWAITING_INTENT: 'diamond',
  COMPLETED: 'circle',
}

export const intentLabels: Partial<Record<IntentType | 'ANY', string>> = {
  ANY: 'Fallback',
  SCHEDULE_APPOINTMENT: 'Schedule appointment',
  CONFIRM_APPOINTMENT: 'Confirm appointment',
  PROVIDE_NAME: 'Provide name',
  PROVIDE_EMAIL: 'Provide email',
  PROVIDE_PHONE: 'Provide phone',
  DECLINE_PHONE: 'Decline phone',
  SELECT_TIME_SLOT: 'Select slot',
  REQUEST_NEXT_WEEK: 'Show next week',
  REQUEST_SPECIFIC_DATE: 'Specific date',
  ASK_QUESTION: 'Ask question',
  PRICING_QUESTION: 'Pricing question',
  TECHNICAL_SPECS: 'Technical specs',
  COMPANY_INFO: 'Company info',
  GREETING: 'Greeting',
  OFF_TOPIC: 'Off topic',
  HARMFUL_CONTENT: 'Guard rail',
  UNKNOWN: 'Unknown',
}

export function humanizeIdentifier(input: string): string {
  return input
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim()
}

export function labelForIntent(intent: IntentType | 'ANY'): string {
  return intentLabels[intent] ?? humanizeIdentifier(intent)
}

export interface StateMachineEdge {
  from: ConversationStep
  to: ConversationStep
  intent: IntentType | 'ANY'
  category: FlowCategory
  dashed: boolean
}

export function buildStateMachineEdges(): StateMachineEdge[] {
  const edges: StateMachineEdge[] = []
  const seen = new Set<string>()

  Object.entries(stateMachineConfig).forEach(([fromState, definition]) => {
    const from = fromState as ConversationStep
    Object.entries(definition.transitions).forEach(([intentKey, targets]) => {
      const intent = intentKey as IntentType | 'ANY'
      targets?.forEach(target => {
        const to = target as ConversationStep
        const edgeKey = `${from}-${intent}-${to}`
        if (seen.has(edgeKey)) {
          return
        }
        seen.add(edgeKey)

        edges.push({
          from,
          to,
          intent,
          category: stateCategories[to] ?? 'core',
          dashed: intent === 'ANY' || from === to,
        })
      })
    })
  })

  return edges
}
