import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authorizeSoketiChannel } from '@/lib/realtime/soketi'

export async function POST(request: NextRequest) {
  console.log('🔐🔐🔐 AUTH API CALLED 🔐🔐🔐')

  try {
    // 1. Authenticate user with NextAuth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.tenantId) {
      console.log('🔐 AUTH: No valid NextAuth session', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id,
        hasTenantId: !!session?.user?.tenantId,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔐 AUTH: Authenticated user', {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      email: session.user.email,
    })

  const contentType = request.headers.get('content-type') ?? ''
  let socketId: string | null = null
  let channelName: string | null = null

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null)
    socketId = typeof body?.socket_id === 'string' ? body.socket_id : null
    channelName = typeof body?.channel_name === 'string' ? body.channel_name : null
  } else {
    const form = await request.formData()
    socketId = typeof form.get('socket_id') === 'string' ? (form.get('socket_id') as string) : null
    channelName = typeof form.get('channel_name') === 'string' ? (form.get('channel_name') as string) : null
  }

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Invalid auth payload' }, { status: 400 })
  }

  // 3. Allow appropriate channels for authenticated users
  const allowedPrefixes = [
    `private-tenant.${session.user.tenantId}.`,
    `presence-tenant.${session.user.tenantId}.`,
    `private-whatsapp.`, // Allow all WhatsApp channels for authenticated users
  ]

  if (!allowedPrefixes.some(prefix => channelName.startsWith(prefix))) {
    console.log('🔐 AUTH: Forbidden channel', { channelName, allowedPrefixes })
    return NextResponse.json({ error: 'Forbidden channel' }, { status: 403 })
  }

  console.log('🔐 AUTH: Channel authorized', { channelName })

  // 4. Generate auth response
  const authData = {
    user_id: session.user.id,
    user_info: {
      email: session.user.email ?? undefined,
    },
  }

  console.log('🔐 AUTH: Generating auth response', {
    socketId,
    channelName,
    authData,
  })

  // Also log environment variables for debugging
  console.log('Realtime auth: Environment check', {
    hasAppId: !!process.env.SOKETI_DEFAULT_APP_ID,
    hasKey: !!process.env.SOKETI_DEFAULT_APP_KEY,
    hasSecret: !!process.env.SOKETI_DEFAULT_APP_SECRET,
    hasHost: !!process.env.SOKETI_PUBLIC_HOST,
    hasPort: !!process.env.SOKETI_PUBLIC_PORT,
    appId: process.env.SOKETI_DEFAULT_APP_ID,
    host: process.env.SOKETI_PUBLIC_HOST,
    port: process.env.SOKETI_PUBLIC_PORT,
  })

  console.log('🔐 AUTH: Calling authorizeSoketiChannel', {
    socketId,
    channelName,
    authDataKeys: Object.keys(authData),
  })

  const response = await authorizeSoketiChannel(socketId, channelName, authData)

  console.log('🔐 AUTH: authorizeSoketiChannel returned', {
    hasResponse: !!response,
    responseType: typeof response,
    responseLength: response?.length || 0,
  })

  if (!response) {
    console.log('🔐 AUTH: Soketi not configured - no response from authorizeSoketiChannel')
    return NextResponse.json({ error: 'Realtime not configured' }, { status: 503 })
  }

  console.log('🔐 AUTH: Auth response generated successfully', {
    channelName,
    responseLength: response.length,
    responsePreview: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
  })

  // Parse the response to verify it's correct
  try {
    const parsedResponse = JSON.parse(response)
    console.log('🔐 AUTH: Auth response validation', {
      hasAuth: !!parsedResponse.auth,
      hasChannelData: !!parsedResponse.channel_data,
      authLength: parsedResponse.auth?.length || 0,
      channelDataKeys: parsedResponse.channel_data ? Object.keys(parsedResponse.channel_data) : [],
    })
  } catch (parseError) {
    console.log('🔐 AUTH: Could not parse auth response', parseError)
  }

  return new NextResponse(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  } catch (error) {
    console.error('🔐 AUTH: Error processing auth request', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
