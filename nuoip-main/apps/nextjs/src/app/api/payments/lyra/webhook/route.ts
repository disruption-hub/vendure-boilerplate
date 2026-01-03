import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(
  request: NextRequest,
) {
  const contentType = request.headers.get('content-type') || ''
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('mode') || 'production'

  // Get raw body text first (can only read once)
  const rawBody = await request.text().catch(() => '')

  // Log all headers for debugging
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  console.log('[Webhook Proxy] Received webhook:', {
    contentType,
    mode,
    rawBodyLength: rawBody.length,
    rawBodyPreview: rawBody.substring(0, 500),
    headers: JSON.stringify(headers).substring(0, 500),
  })

  // Try to parse as JSON, fallback to form data, then empty object
  let body: any = {}
  if (rawBody && rawBody.trim()) {
    try {
      body = JSON.parse(rawBody)
      console.log('[Webhook Proxy] Parsed as JSON:', {
        bodyKeys: Object.keys(body),
        hasOrderDetails: !!body?.orderDetails,
        hasOrderId: !!body?.orderId,
        fullBodyPreview: JSON.stringify(body).substring(0, 500),
      })
    } catch {
      // If not JSON, try to parse as URL-encoded form data
      try {
        const params = new URLSearchParams(rawBody)
        const formObject: any = {}
        for (const [key, value] of params.entries()) {
          // Try to parse nested JSON values
          try {
            formObject[key] = JSON.parse(value)
          } catch {
            formObject[key] = value
          }
        }
        body = formObject
        console.log('[Webhook Proxy] Parsed as form data:', {
          bodyKeys: Object.keys(body),
          fullBodyPreview: JSON.stringify(body).substring(0, 500),
        })
      } catch {
        // If all parsing fails, log and preserve raw body as string
        console.error('[Webhook Proxy] Failed to parse body. Raw body:', rawBody.substring(0, 500))
        // Preserve raw body in a special field for debugging
        body = { _rawBody: rawBody }
      }
    }
  } else {
    console.warn('[Webhook Proxy] Empty raw body received')
  }

  // Pass the raw body to backend to preserve signature integrity
  return proxyToBackend(request, `/api/v1/payments/lyra/webhook?mode=${mode}`, {
    method: 'POST',
    body: rawBody, // Use the raw string body
    headers: {
      'Content-Type': contentType || 'application/json',
    },
  })
}

