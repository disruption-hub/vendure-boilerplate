import { useCallback, useEffect, useRef, useState } from 'react'

import type { CrmCustomerSummary, CrmFacade } from '@/domains/crm'
import type { CrmPanelTab } from '@/domains/crm/panels/CrmChatPanel'

interface ActiveContactSnapshot {
  tenantId?: string | null
  phone?: string | null
}

interface UseCrmCustomersOptions {
  crmFacade: CrmFacade
  crmActiveTab: CrmPanelTab
  hasCrmTools: boolean
  activeContact: ActiveContactSnapshot | null | undefined
  sessionId: string | null
  onCustomerSelected?: (customer: CrmCustomerSummary) => void
}

interface UseCrmCustomersResult {
  customers: CrmCustomerSummary[]
  loading: boolean
  selectedCustomerId: string | null
  handleSelectCustomer: (customerId: string) => void
  refreshCustomers: () => void
  upsertCustomer: (customer: CrmCustomerSummary) => Promise<void>
}

export function useCrmCustomers({
  crmFacade,
  crmActiveTab,
  hasCrmTools,
  activeContact,
  sessionId,
  onCustomerSelected,
}: UseCrmCustomersOptions): UseCrmCustomersResult {
  const [customers, setCustomers] = useState<CrmCustomerSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const lastFetchKeyRef = useRef<string | null>(null)
  const customersRef = useRef<CrmCustomerSummary[]>([])
  const selectedCustomerIdRef = useRef<string | null>(null)

  useEffect(() => {
    customersRef.current = customers
  }, [customers])

  useEffect(() => {
    selectedCustomerIdRef.current = selectedCustomerId
  }, [selectedCustomerId])

  useEffect(() => {
    console.log('[useCrmCustomers] Effect triggered', {
      hasCrmTools,
      activeContact,
      activeContactTenantId: activeContact?.tenantId,
      activeContactPhone: activeContact?.phone,
      sessionId: sessionId ? 'present' : 'missing',
      crmActiveTab,
    })

    // Match original implementation: require hasCrmTools AND tenantId
    // But allow loading when authenticated (hasCrmTools can be false if no contact selected)
    // The key is that activeContact should have tenantId from authenticated user
    if (!hasCrmTools || !activeContact?.tenantId) {
      console.log('[useCrmCustomers] Skipping load - missing requirements', {
        hasCrmTools,
        hasTenantId: !!activeContact?.tenantId,
        activeContact,
      })
      lastFetchKeyRef.current = null
      setCustomers([])
      return
    }

    const fetchKey = `${activeContact.tenantId}|${activeContact.phone ?? ''}|${sessionId ?? ''}|${refreshCounter}`
    if (lastFetchKeyRef.current === fetchKey) {
      console.log('[useCrmCustomers] Skipping load - same fetch key', { fetchKey })
      return
    }
    lastFetchKeyRef.current = fetchKey

    let cancelled = false

    const loadCustomers = async () => {
      console.log('[useCrmCustomers] Loading customers', {
        tenantId: activeContact.tenantId,
        phone: activeContact.phone,
        hasPhone: !!activeContact.phone,
      })
      setLoading(true)
      try {
        // Load customers - if phone is provided, filter by phone; otherwise load all for tenant
        const fetched = await crmFacade.listCustomers({
          tenantId: activeContact.tenantId,
          phone: activeContact.phone ?? null,
          email: null,
        })

        console.log('[useCrmCustomers] Customers fetched', {
          count: fetched.length,
          customerIds: fetched.map(c => c.id).slice(0, 5),
        })

        if (cancelled) {
          return
        }

        setCustomers(prev => {
          const previous = customersRef.current
          const sameLength = previous.length === fetched.length
          const sameIds =
            sameLength && previous.every((customer, index) => customer.id === fetched[index]?.id)

          if (sameLength && sameIds) {
            return prev
          }

          return fetched
        })

        if (
          fetched.length > 0 &&
          !selectedCustomerIdRef.current &&
          sessionId &&
          activeContact.tenantId
        ) {
          const first = fetched[0]
          setSelectedCustomerId(first.id)
          await crmFacade.selectCustomer({
            sessionId,
            tenantId: activeContact.tenantId,
            customerId: first.id,
            customerType: first.type,
            initiatedBy: 'chat',
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load CRM customers:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCustomers()

    return () => {
      cancelled = true
    }
  }, [
    crmFacade,
    crmActiveTab,
    hasCrmTools,
    activeContact?.tenantId,
    activeContact?.phone,
    sessionId,
    refreshCounter,
  ])

  useEffect(() => {
    if (!activeContact?.tenantId || !sessionId || customers.length === 0) {
      return
    }

    if (!activeContact.phone) {
      return
    }

    const matching = customers.find(customer => customer.phone === activeContact.phone)

    if (matching && matching.id !== selectedCustomerId) {
      setSelectedCustomerId(matching.id)
      void crmFacade
        .selectCustomer({
          sessionId,
          tenantId: activeContact.tenantId,
          customerId: matching.id,
          customerType: matching.type,
          initiatedBy: 'chat',
        })
        .catch(error => {
          console.error('Failed to update selected customer in conversation state:', error)
        })
    }
  }, [activeContact?.tenantId, activeContact?.phone, customers, selectedCustomerId, sessionId, crmFacade])

  const handleSelectCustomer = useCallback(
    (customerId: string) => {
      setSelectedCustomerId(customerId)
      const customer = customers.find(item => item.id === customerId)

      if (!customer || !sessionId || !activeContact?.tenantId) {
        return
      }

      onCustomerSelected?.(customer)

      void crmFacade
        .selectCustomer({
          sessionId,
          tenantId: activeContact.tenantId,
          customerId: customer.id,
          customerType: customer.type,
          initiatedBy: 'chat',
        })
        .catch(error => {
          console.error('Failed to update selected customer in conversation state:', error)
        })
    },
    [customers, sessionId, activeContact?.tenantId, crmFacade, onCustomerSelected],
  )

  const refreshCustomers = useCallback(() => {
    setRefreshCounter(counter => counter + 1)
    lastFetchKeyRef.current = null
  }, [])

  const upsertCustomer = useCallback(
    async (customer: CrmCustomerSummary) => {
      setCustomers(prev => {
        const index = prev.findIndex(item => item.id === customer.id)
        if (index >= 0) {
          const next = [...prev]
          next[index] = customer
          return next
        }
        return [customer, ...prev]
      })

      setSelectedCustomerId(customer.id)

      if (sessionId && activeContact?.tenantId) {
        onCustomerSelected?.(customer)
        await crmFacade
          .selectCustomer({
            sessionId,
            tenantId: activeContact.tenantId,
            customerId: customer.id,
            customerType: customer.type,
            initiatedBy: 'chat',
          })
          .catch(error => {
            console.error('Failed to update selected customer after creation:', error)
          })
      }
    },
    [crmFacade, sessionId, activeContact?.tenantId, onCustomerSelected],
  )

  return {
    customers,
    loading,
    selectedCustomerId,
    handleSelectCustomer,
    refreshCustomers,
    upsertCustomer,
  }
}
