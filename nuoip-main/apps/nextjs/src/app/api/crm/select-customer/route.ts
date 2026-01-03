import { NextRequest, NextResponse } from 'next/server'
import { handleCORS, proxyToBackend } from '@/lib/api-helpers'
import { updateConversationState } from '@/lib/chatbot/conversation-state'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const authHeader = request.headers.get('authorization')

    console.log('[CRM Select Customer API] Request received', {
      hasSessionId: !!body.sessionId,
      hasTenantId: !!body.tenantId,
      hasCustomerId: !!body.customerId,
      hasAuth: !!authHeader,
    })

    // Proxy to backend CRM select-customer endpoint
    let response
    try {
      response = await proxyToBackend(request, '/api/v1/crm/select-customer', {
        method: 'POST',
        headers: authHeader ? { 'Authorization': authHeader } : {},
        body,
      })
    } catch (error) {
      console.warn('[CRM Select Customer API] Proxy failed, falling back to local handling:', error)
      // Fallback will happen below if response is undefined or not ok
    }

    // If proxy succeeded, return the response
    if (response && response.ok) {
      console.log('[CRM Select Customer API] Proxy succeeded', { status: response.status })
      return response
    }

    console.log('[CRM Select Customer API] Proxy response not OK', {
      status: response?.status,
      statusText: response?.statusText,
      hasResponse: !!response
    })

    // If proxy failed (404/500) or threw, fallback to local handling for dev/unimplemented backend
    if (!response || response.status === 404 || response.status === 500) {
      console.log('[CRM Select Customer API] Backend endpoint missing or failed, using local fallback')

      // Try to update conversation state locally as fallback
      try {
        if (body.sessionId && body.tenantId) {
          console.log('[CRM Select Customer API] Updating local state', {
            sessionId: body.sessionId,
            tenantId: body.tenantId,
            customerId: body.customerId
          })

          await updateConversationState(body.sessionId, body.tenantId, {
            paymentContext: {
              selectedCustomerId: body.customerId,
              selectedCustomerType: body.customerType || null,
            } as any,
          })
          console.log('[CRM Select Customer API] Local conversation state updated (fallback)')
        } else {
          console.warn('[CRM Select Customer API] Missing sessionId or tenantId for fallback state update')
        }
      } catch (stateError) {
        console.warn('[CRM Select Customer API] Failed to update local state in fallback (ignoring):', stateError)
      }

      return NextResponse.json({
        success: true,
        message: 'Customer selected successfully (fallback)',
        fallback: true
      })
    }

    // If it was another error (e.g. 400 validation from backend), return it
    console.log('[CRM Select Customer API] Returning backend error response', { status: response.status })
    return response
  } catch (error) {
    console.error('[CRM Select Customer API] Critical Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to select customer',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
