import type {
  PaymentGateway,
  PaymentFacade,
  EnsurePaymentLinkParams,
  EnsurePaymentLinkResult,
} from './contracts'

export function createPaymentsFacade({ gateway }: { gateway: PaymentGateway }): PaymentFacade {
  return {
    resolveTenantBaseUrl: tenantId => gateway.resolveTenantBaseUrl(tenantId),
    listActiveProducts: () => gateway.listActiveProducts(),
    ensurePaymentLink: async (params: EnsurePaymentLinkParams): Promise<EnsurePaymentLinkResult> => {
      const existing = await gateway.findExistingLink({
        productId: params.productId,
        sessionId: params.sessionId,
        amountCents: params.amountCents,
        currency: params.currency,
        customerEmail: params.customerEmail ?? null,
      })

      if (existing) {
        return {
          linkId: existing.id,
          token: existing.token,
          existing: true,
        }
      }

      const created = await gateway.createPaymentLink({
        productId: params.productId,
        sessionId: params.sessionId,
        tenantId: params.tenantId ?? null,
        customerName: params.customerName ?? null,
        customerEmail: params.customerEmail ?? null,
        metadata: params.metadata,
      })

      await gateway.syncPaymentLinkToCrm(created, {
        sessionId: params.sessionId,
        tenantId: params.tenantId ?? null,
        selectedCustomerId: params.selectedCustomerId ?? null,
        selectedCustomerType: params.selectedCustomerType ?? null,
      })

      return {
        linkId: created.id,
        token: created.token,
        existing: false,
      }
    },
  }
}
