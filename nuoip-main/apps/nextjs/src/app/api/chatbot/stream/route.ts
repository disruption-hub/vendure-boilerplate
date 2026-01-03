import { NextRequest } from 'next/server'
import { proxyToBackend, proxyStreamToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Proxy to backend chatbot stream endpoint (SSE streaming)
    return proxyStreamToBackend(request, '/api/v1/chatbot/stream', {
      method: 'POST',
      body,
    })
  } catch (error) {
    console.error('[Chatbot Stream] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
