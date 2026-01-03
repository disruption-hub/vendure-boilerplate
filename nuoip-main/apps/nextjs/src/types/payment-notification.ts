export interface PaymentNotificationPayload {
  id?: string
  amount?: string | number
  currency?: string
  tenantId?: string | null
  customer?: {
    name?: string
    email?: string
  }
  link?: {
    id?: string
    description?: string
  }
  timestamp?: string | number | Date
  mode?: string
  [key: string]: unknown
}

export interface PaymentNotificationRecord {
  id: string
  payload: PaymentNotificationPayload
  timestamp: string
}
