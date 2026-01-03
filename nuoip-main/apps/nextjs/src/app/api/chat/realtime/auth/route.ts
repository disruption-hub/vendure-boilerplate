import { NextRequest, NextResponse } from 'next/server'
import { authorizeSoketiChannel } from '@/lib/realtime/soketi'
import { handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS(request: NextRequest) {
  console.log('🔐 [Channel Auth] OPTIONS (CORS preflight) request received', {
    url: request.url,
    origin: request.headers.get('origin'),
    method: request.headers.get('access-control-request-method'),
    headers: request.headers.get('access-control-request-headers'),
  })
  
  const response = handleCORS()
  // Ensure all required CORS headers are present
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  console.log('🔐 [Channel Auth] OPTIONS response headers', {
    allowOrigin: response.headers.get('access-control-allow-origin'),
    allowMethods: response.headers.get('access-control-allow-methods'),
    allowHeaders: response.headers.get('access-control-allow-headers'),
  })
  
  return response
}

export async function POST(request: NextRequest) {
  // Log immediately to ensure we see if the endpoint is called
  console.log('🔐🔐🔐 [Channel Auth] Authorization request received 🔐🔐🔐')
  console.log('🔐 [Channel Auth] Request method:', request.method)
  console.log('🔐 [Channel Auth] Request URL:', request.url)
  
  // Wrap everything in try-catch to prevent unhandled errors that might result in 401
  try {
    let socketId: string | undefined
    let channelName: string | undefined
    let channelData: any

    // Parse request body with error handling
    try {
      const contentType = request.headers.get('content-type') || ''
      const authHeader = request.headers.get('authorization')
      
      console.log('🔐 [Channel Auth] Request details:', {
        contentType,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
        url: request.url,
        method: request.method,
        allHeaders: Object.fromEntries(request.headers.entries()),
      })

      if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const formData = await request.formData()
          socketId = formData.get('socket_id')?.toString()
          channelName = formData.get('channel_name')?.toString()
          const rawChannelData = formData.get('channel_data')?.toString()
          console.log('🔐 [Channel Auth] Form data received:', {
            hasSocketId: !!socketId,
            socketId: socketId ? socketId.substring(0, 20) + '...' : 'missing',
            hasChannelName: !!channelName,
            channelName,
            hasChannelData: !!rawChannelData,
            channelDataLength: rawChannelData?.length,
          })
          if (rawChannelData) {
            try {
              channelData = JSON.parse(rawChannelData)
              console.log('🔐 [Channel Auth] Parsed channelData:', {
                hasUserId: !!channelData?.user_id,
                userId: channelData?.user_id,
                hasUserInfo: !!channelData?.user_info,
              })
            } catch (parseError) {
              console.warn('🔐 [Channel Auth] Failed to parse channelData, using raw:', parseError)
              channelData = rawChannelData
            }
          }
        } catch (formError) {
          console.error('🔐 [Channel Auth] Error parsing form data:', formError)
          const response = NextResponse.json(
            { error: 'Invalid form data' },
            { status: 400 }
          )
          response.headers.set('Access-Control-Allow-Origin', '*')
          response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          return response
        }
      } else {
        try {
          const body = await request.json()
          socketId = body.socket_id
          channelName = body.channel_name
          channelData = body.channel_data
          console.log('🔐 [Channel Auth] JSON body received:', {
            hasSocketId: !!socketId,
            hasChannelName: !!channelName,
            channelName,
            hasChannelData: !!channelData,
          })
        } catch (jsonError) {
          console.error('🔐 [Channel Auth] Error parsing JSON body:', jsonError)
          const response = NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
          )
          response.headers.set('Access-Control-Allow-Origin', '*')
          response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          return response
        }
      }
    } catch (parseError) {
      console.error('🔐 [Channel Auth] Error parsing request:', parseError)
      const response = NextResponse.json(
        { error: 'Failed to parse request' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Validate required parameters - return 400 (not 401) for missing params
    if (!socketId || !channelName) {
      console.warn('🔐 [Channel Auth] Missing required parameters', {
        hasSocketId: !!socketId,
        hasChannelName: !!channelName,
      })
      const response = NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Validate channel access
    // Extract tenantId and userId from channel name (do this early so we can use it)
    let channelTenantId: string | null = null
    let channelUserId: string | null = null

    if (channelName.startsWith('private-scheduled.')) {
      // Format: private-scheduled.{tenantId}.{userId}
      const parts = channelName.split('.')
      if (parts.length >= 3) {
        channelTenantId = parts[1]
        channelUserId = parts[2]
      }
    } else if (channelName.startsWith('presence-tenant.')) {
      // Format: presence-tenant.{tenantId}.{...}
      const parts = channelName.split('.')
      if (parts.length >= 2) {
        channelTenantId = parts[1]
      }
    }

    // authHeader is already declared above
    let user: any = null
    let userTenantId: string | null = null
    let userId: string | null = null

    // Authenticate user (either NextAuth or Chat Auth) - wrapped in try-catch
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.BACKEND_URL ||
          'https://nuoip-production.up.railway.app'

        console.log('🔐 [Channel Auth] Fetching user profile', {
          backendUrl,
          hasAuthHeader: !!authHeader,
          authHeaderPrefix: authHeader.substring(0, 20) + '...',
        })

        try {
          const profileResponse = await fetch(`${backendUrl}/api/v1/auth/phone/profile`, {
            headers: {
              'Authorization': authHeader
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          })

          console.log('🔐 [Channel Auth] Profile response', {
            status: profileResponse.status,
            ok: profileResponse.ok,
            statusText: profileResponse.statusText,
          })

          if (profileResponse.ok) {
            try {
              const profile = await profileResponse.json()
              if (profile) {
                user = profile
                userId = profile.id
                userTenantId = profile.tenantId
                console.log('🔐 [Channel Auth] User profile loaded', {
                  userId,
                  userTenantId,
                  hasProfile: !!profile,
                })
              } else {
                console.warn('🔐 [Channel Auth] Profile response was ok but no profile data')
              }
            } catch (profileParseError) {
              console.error('🔐 [Channel Auth] Error parsing profile response:', profileParseError)
            }
          } else {
            const errorText = await profileResponse.text().catch(() => 'Unable to read error')
            console.warn('🔐 [Channel Auth] Failed to fetch profile for auth:', {
              status: profileResponse.status,
              statusText: profileResponse.statusText,
              error: errorText.substring(0, 200),
            })
            // Don't fail authorization if profile fetch fails - allow based on channel format
          }
        } catch (fetchError) {
          console.error('🔐 [Channel Auth] Error fetching profile (network/timeout):', {
            error: fetchError instanceof Error ? fetchError.message : 'unknown',
            name: fetchError instanceof Error ? fetchError.name : typeof fetchError,
          })
          // Don't fail authorization if profile fetch fails - allow based on channel format
        }
      } catch (error) {
        console.error('🔐 [Channel Auth] Error in profile fetch block:', {
          error: error instanceof Error ? error.message : 'unknown',
          stack: error instanceof Error ? error.stack : undefined,
        })
        // Don't fail authorization - continue with channel format validation
      }
    } else {
      console.log('🔐 [Channel Auth] No auth header provided - will allow based on channel format')
    }

    // If it's a presence channel and we don't have channelData from the client,
    // generate it from the user profile or use a default guest structure
    // This is CRITICAL - presence channels REQUIRE channelData
    if (channelName?.startsWith('presence-') && !channelData) {
      try {
        if (user) {
          channelData = {
            user_id: user.id || userId || `user_${Date.now()}`,
            user_info: {
              name: user.displayName || user.name || user.phone || 'Anonymous',
              email: user.email || null,
              role: 'user',
              tenantId: user.tenantId || userTenantId || channelTenantId || null
            }
          }
          console.log('🔐 [Channel Auth] Generated channelData from user profile', {
            channelName,
            userId: channelData.user_id,
            hasUserInfo: !!channelData.user_info,
          })
        } else {
          // For presence channels, we need channelData even without a user
          // Generate a guest/anonymous user structure
          const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`
          channelData = {
            user_id: guestId,
            user_info: {
              name: 'Guest',
              role: 'guest',
              tenantId: channelTenantId || null
            }
          }
          console.log('🔐 [Channel Auth] Generated guest channelData for presence channel', {
            channelName,
            guestId,
            channelTenantId,
          })
        }
      } catch (channelDataError) {
        console.error('🔐 [Channel Auth] Error generating channelData:', channelDataError)
        // Fallback to minimal channelData
        channelData = {
          user_id: `guest_${Date.now()}`,
          user_info: {
            name: 'Guest',
            role: 'guest',
            tenantId: channelTenantId || null
          }
        }
      }
    }

    // Validate tenant access (only if we have user info)
    if (channelTenantId && userTenantId && channelTenantId !== userTenantId) {
      console.warn('🔐 [Channel Auth] Tenant mismatch - REJECTING', {
        channelName,
        channelTenantId,
        userTenantId,
      })
      const response = NextResponse.json(
        { error: 'Forbidden: Tenant mismatch' },
        { status: 403 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Validate user access for private-scheduled channels (only if we have user info)
    if (channelName.startsWith('private-scheduled.') && channelUserId && userId && channelUserId !== userId) {
      console.warn('🔐 [Channel Auth] User mismatch for private-scheduled channel - REJECTING', {
        channelName,
        channelUserId,
        userId,
      })
      const response = NextResponse.json(
        { error: 'Forbidden: User mismatch' },
        { status: 403 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Log validation results
    console.log('🔐 [Channel Auth] Validation passed', {
      channelName,
      channelTenantId,
      channelUserId,
      userTenantId,
      userId,
      hasUser: !!user,
      tenantMatch: !channelTenantId || !userTenantId || channelTenantId === userTenantId,
      userMatch: !channelName.startsWith('private-scheduled.') || !channelUserId || !userId || channelUserId === userId,
    })

    // If we don't have user info but the channel format is valid, allow it
    // (chat users might not have proper auth headers, but channel name itself is validated)
    if (!user && channelName) {
      console.log('Channel authorization: No user auth, but allowing based on channel format', {
        channelName,
        isPrivateScheduled: channelName.startsWith('private-scheduled.'),
        isPresenceTenant: channelName.startsWith('presence-tenant.'),
      })
      // Continue to authorize - the channel name format itself provides some validation
    }

    console.log('Channel authorization request:', {
      channelName,
      channelTenantId,
      channelUserId,
      userTenantId,
      userId,
      hasAuthHeader: !!authHeader,
      hasChannelData: !!channelData,
    })

    console.log('🔐 [Channel Auth] Calling authorizeSoketiChannel', {
      socketId,
      channelName,
      hasChannelData: !!channelData,
      channelDataType: channelData ? typeof channelData : 'none',
      isPresenceChannel: channelName?.startsWith('presence-'),
    })

    // Call authorizeSoketiChannel with error handling
    let authResponse: string | null = null
    try {
      authResponse = await authorizeSoketiChannel(
        socketId,
        channelName,
        channelData
      )
    } catch (authError) {
      console.error('🔐 [Channel Auth] Error calling authorizeSoketiChannel:', {
        error: authError instanceof Error ? authError.message : 'unknown',
        stack: authError instanceof Error ? authError.stack : undefined,
      })
      const response = NextResponse.json(
        { error: 'Authorization service error' },
        { status: 500 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    if (!authResponse) {
      console.error('🔐 [Channel Auth] authorizeSoketiChannel returned null', {
        socketId,
        channelName,
        hasChannelData: !!channelData,
        isPresenceChannel: channelName?.startsWith('presence-'),
      })
      const response = NextResponse.json(
        { error: 'Realtime service unavailable or authorization failed' },
        { status: 503 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Parse the response with error handling
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(authResponse)
      
      // Validate response format matches Pusher requirements
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error('Response is not an object')
      }
      if (!parsedResponse.auth || typeof parsedResponse.auth !== 'string') {
        throw new Error('Response missing or invalid auth field')
      }
      
      // For presence channels, verify channel_data is a string (not object)
      if (channelName?.startsWith('presence-') && parsedResponse.channel_data) {
        if (typeof parsedResponse.channel_data !== 'string') {
          console.warn('🔐 [Channel Auth] channel_data is not a string, converting...')
          parsedResponse.channel_data = JSON.stringify(parsedResponse.channel_data)
        }
      }
      
    } catch (parseError) {
      console.error('🔐 [Channel Auth] Failed to parse or validate auth response', {
        error: parseError,
        response: authResponse?.substring(0, 200),
        responseLength: authResponse?.length,
      })
      const response = NextResponse.json(
        { error: 'Invalid authorization response format' },
        { status: 500 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return response
    }

    // Final response validation and logging
    // CRITICAL: Response format must be exactly: { auth: "key:signature", channel_data?: "..." }
    // channel_data must be a JSON string (not object) for presence channels
    const finalResponse: {
      auth: string
      channel_data?: string
    } = {
      auth: parsedResponse.auth,
    }
    
    // Only include channel_data if it exists and is a string
    if (parsedResponse.channel_data) {
      if (typeof parsedResponse.channel_data === 'string') {
        finalResponse.channel_data = parsedResponse.channel_data
      } else {
        // Convert to string if it's not already
        console.warn('🔐 [Channel Auth] channel_data is not a string, converting', {
          type: typeof parsedResponse.channel_data,
        })
        finalResponse.channel_data = JSON.stringify(parsedResponse.channel_data)
      }
    }
    
    // Validate final response format
    if (!finalResponse.auth || typeof finalResponse.auth !== 'string') {
      console.error('🔐 [Channel Auth] Invalid final response - missing or invalid auth', {
        hasAuth: !!finalResponse.auth,
        authType: typeof finalResponse.auth,
      })
      const errorResponse = NextResponse.json(
        { error: 'Invalid authorization response' },
        { status: 500 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }
    
    // Verify auth format: should be "key:signature"
    if (!finalResponse.auth.includes(':')) {
      console.error('🔐 [Channel Auth] Invalid auth format - missing colon', {
        authPrefix: finalResponse.auth.substring(0, 50),
      })
      const errorResponse = NextResponse.json(
        { error: 'Invalid authorization format' },
        { status: 500 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }
    
    console.log('✅ [Channel Auth] Authorization successful - Final Response', {
      channelName,
      socketId: socketId ? socketId.substring(0, 20) + '...' : 'missing',
      responseLength: authResponse.length,
      hasAuth: !!finalResponse.auth,
      authLength: finalResponse.auth?.length,
      authPrefix: finalResponse.auth?.substring(0, 50) + '...',
      hasChannelData: !!finalResponse.channel_data,
      channelDataType: typeof finalResponse.channel_data,
      channelDataLength: typeof finalResponse.channel_data === 'string' ? finalResponse.channel_data.length : 'N/A',
      responseKeys: Object.keys(finalResponse),
      // Log exact response format for debugging
      exactResponse: JSON.stringify(finalResponse),
    })

    // Return with CORS headers - ensure response format is exactly what Pusher expects
    // Status MUST be 200 for Pusher to accept it
    const response = NextResponse.json(finalResponse, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Content-Type', 'application/json')
    
    console.log('🔐 [Channel Auth] Returning response to client', {
      status: 200,
      statusText: 'OK',
      hasAuth: !!finalResponse.auth,
      hasChannelData: !!finalResponse.channel_data,
      contentType: response.headers.get('content-type'),
      corsOrigin: response.headers.get('access-control-allow-origin'),
      responseBody: JSON.stringify(finalResponse),
    })
    
    return response
  } catch (error) {
    // CRITICAL: Never return 401 - use 500 for server errors, 400 for client errors
    console.error('❌❌❌ [Channel Auth] Unhandled error authorizing realtime channel ❌❌❌', {
      error: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorName: error instanceof Error ? error.name : 'unknown',
    })
    
    // Return 500 (Internal Server Error) - NOT 401 (Unauthorized)
    // 401 should only be returned if we explicitly want to reject authentication
    // Here we have a server error, so return 500
    const response = NextResponse.json(
      { 
        error: 'Authorization failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'server_error'
      },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Content-Type', 'application/json')
    return response
  }
}

