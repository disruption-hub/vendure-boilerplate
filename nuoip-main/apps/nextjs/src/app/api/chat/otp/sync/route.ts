import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    const response = await proxyToBackend(request, '/api/v1/auth/phone/sync', {
      method: 'POST',
      body,
    })

    return response
  } catch (error) {
    console.error('Error proxying OTP sync to backend:', error)
    return NextResponse.json(
      { error: 'Failed to sync session', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

