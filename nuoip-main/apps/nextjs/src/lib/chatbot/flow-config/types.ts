import type { SupportedLanguage } from '@/lib/chatbot/language-detector'
import type { ConversationStep, IntentType } from '@/lib/chatbot/types'

export type FlowCategory = 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge'

export type FlowMessageValue = string | string[] | RegExp

export type FlowMessageMap = Partial<Record<SupportedLanguage, FlowMessageValue>> & {
  en?: FlowMessageValue
}

export interface FlowOverlayNodeConfig {
  id: string
  title: string
  description: string
  category: FlowCategory
  shape?: 'rounded' | 'stadium' | 'circle' | 'diamond'
}

export interface FlowOverlayEdgeConfig {
  from: string
  to: string
  label: string
  category: FlowCategory
  dashed?: boolean
}

export interface FlowOverlayConfig {
  id: string
  name: string
  description?: string
  nodes: FlowOverlayNodeConfig[]
  edges: FlowOverlayEdgeConfig[]
  enabled?: boolean
}

export interface FlowQuickActionConfig {
  id: string
  action: string
  labels: Partial<Record<SupportedLanguage, string>> & { en?: string }
}

export interface FlowConfig {
  version: number
  states: Record<ConversationStep, {
    description: string
  }>
  messages: Record<string, FlowMessageMap>
  intentLabels: Partial<Record<IntentType | 'ANY', string>>
  categories: Partial<Record<ConversationStep, FlowCategory>>
  shapes: Partial<Record<ConversationStep, 'rounded' | 'stadium' | 'circle' | 'diamond'>>
  overlays: FlowOverlayConfig[]
  quickActions: FlowQuickActionConfig[]
}

export type FlowConfigInput = Partial<Omit<FlowConfig, 'version'>> & {
  version?: number
}
