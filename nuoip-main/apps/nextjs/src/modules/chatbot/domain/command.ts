export interface ChatbotCommandDefinition {
  code: string
  label: string
  description?: string
  category?: string
  allowInFlowbotConversation?: boolean
}

export interface ChatbotCommandExecutionResult {
  code: string
  label: string
  content: string
  renderedAt: string
}
