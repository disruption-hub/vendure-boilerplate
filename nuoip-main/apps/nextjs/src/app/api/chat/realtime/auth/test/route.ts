import { NextRequest, NextResponse } from 'next/server'
import { handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  console.log('🧪 [Auth Test] Test endpoint called')
  
  const response = NextResponse.json({
    success: true,
    message: 'Auth endpoint is reachable',
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
  }, { status: 200 })
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export async function POST(request: NextRequest) {
  console.log('🧪 [Auth Test] Test POST endpoint called')
  
  try {
    const contentType = request.headers.get('content-type') || ''
    let socketId: string | undefined
    let channelName: string | undefined
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      socketId = formData.get('socket_id')?.toString()
      channelName = formData.get('channel_name')?.toString()
    } else {
      const body = await request.json().catch(() => ({}))
      socketId = body.socket_id
      channelName = body.channel_name
    }
    
    // Return a minimal valid Pusher response format for testing
    // This simulates what the real endpoint should return
    const testAuthResponse = {
      auth: `test-key:test-signature-${Date.now()}`,
      ...(channelName?.startsWith('presence-') && {
        channel_data: JSON.stringify({
          user_id: 'test-user',
          user_info: {
            name: 'Test User',
            role: 'test',
          },
        }),
      }),
    }
    
    console.log('🧪 [Auth Test] Returning test Pusher response', {
      socketId,
      channelName,
      hasAuth: !!testAuthResponse.auth,
      hasChannelData: !!testAuthResponse.channel_data,
    })
    
    const response = NextResponse.json(testAuthResponse, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Content-Type', 'application/json')
    
    return response
  } catch (error) {
    const response = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

