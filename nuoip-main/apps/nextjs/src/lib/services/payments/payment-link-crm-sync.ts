export async function syncPaymentLinkToCRM(
  link: { id: string; token: string },
  params: {
    sessionId?: string;
    tenantId?: string | null;
    selectedCustomerId?: string | null;
    selectedCustomerType?: 'lead' | 'contact' | null;
  }
): Promise<void> {
  return Promise.resolve();
}
