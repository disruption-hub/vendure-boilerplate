export const createChatbotTelemetry = (_sessionId?: string, _tenantId?: string) => ({ 
  track: (_event: string, _data?: any) => {}, 
  log: (_message: string, _data?: any) => {}, 
  warn: (_event: string, _data?: any) => {} 
})
