// Payment link service - proxies to backend for all database operations
// Following the architecture: Next.js does NOT access database directly

export interface PaymentLinkRecord {
  id: string;
  token: string;
}

export async function createPaymentLinkForProduct(
  productId: string,
  options: {
    sessionId?: string;
    tenantId?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<PaymentLinkRecord> {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  const response = await fetch(`${backendUrl}/api/v1/payments/links/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      ...options,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create payment link: ${error}`)
  }

  const paymentLink = await response.json()
  return {
    id: paymentLink.id,
    token: paymentLink.token,
  }
}
