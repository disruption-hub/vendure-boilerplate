const communicationChannelValues = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  TELEGRAM: 'TELEGRAM',
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
} as const

export const CommunicationChannel = communicationChannelValues
export type CommunicationChannelType = typeof communicationChannelValues[keyof typeof communicationChannelValues]
export const COMMUNICATION_CHANNEL_VALUES = Object.values(communicationChannelValues) as CommunicationChannelType[]

const communicationProviderValues = {
  BREVO: 'BREVO',
  RESEND: 'RESEND',
  LABSMOBILE: 'LABSMOBILE',
  TELEGRAM_BOT: 'TELEGRAM_BOT',
  WHATSAPP_CLOUD: 'WHATSAPP_CLOUD',
  INSTAGRAM_GRAPH: 'INSTAGRAM_GRAPH',
} as const

export const CommunicationProvider = communicationProviderValues
export type CommunicationProviderType = typeof communicationProviderValues[keyof typeof communicationProviderValues]
export const COMMUNICATION_PROVIDER_VALUES = Object.values(communicationProviderValues) as CommunicationProviderType[]

const communicationLogStatusValues = {
  pending: 'pending',
  sent: 'sent',
  partial: 'partial',
  failed: 'failed',
} as const

export const CommunicationLogStatus = communicationLogStatusValues
export type CommunicationLogStatusType = typeof communicationLogStatusValues[keyof typeof communicationLogStatusValues]
export type CommunicationLogStatus = CommunicationLogStatusType
export const COMMUNICATION_LOG_STATUS_VALUES = Object.values(communicationLogStatusValues) as CommunicationLogStatusType[]
