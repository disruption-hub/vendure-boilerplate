export type {
  CommunicationsFacade,
  EnqueueNotificationCommand,
  StartCampaignCommand,
  EnqueueNotificationResult,
  CommunicationChannelType,
} from './contracts'
export {
  createCommunicationsFacade,
  type CommunicationsFacadeDependencies,
  type CommunicationsGatewayAdapter,
} from './facade'
export {
  createHttpCommunicationsGateway,
  type HttpCommunicationsGatewayOptions,
} from './adapters/http-communications-gateway'
