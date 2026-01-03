export type {
  CrmFacade,
  CrmCustomerSummary,
  ListCustomersQuery,
  SelectCustomerCommand,
  RequestTicketCommand,
  TicketRealtimeEvent,
  TicketRealtimeListener,
} from './contracts'
export { createCrmFacade, type CrmFacadeDependencies, type CrmGatewayAdapter } from './facade'
export { createHttpCrmGateway, type HttpCrmGatewayOptions } from './adapters/http-crm-gateway'
export { createChatbotCrmGateway } from './adapters/chatbot-crm-gateway'
