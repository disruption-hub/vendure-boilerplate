import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Get backend URL from environment variable
    // Default to Railway production URL, then localhost for development
    const backendUrl = 
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.BACKEND_URL || 
      'https://nuoip-production.up.railway.app'
    
    const apiUrl = `${backendUrl}/api/v1/auth/admin/login`

    console.log('Attempting to connect to backend:', apiUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON response from backend:', text)
        return NextResponse.json(
          { error: 'Invalid response from authentication service' },
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      if (!response.ok) {
        // If backend returns 404, it means the backend service is not found/deployed
        // Return 503 (Service Unavailable) instead of 404 to indicate the route exists
        // but the backend service is unavailable
        const statusCode = response.status === 404 ? 503 : response.status
        const errorMessage = response.status === 404 
          ? 'Authentication service is not available. The backend may not be deployed or is currently unavailable.'
          : (data.message || data.error || 'Login failed')
        
        return NextResponse.json(
          { error: errorMessage },
          { 
            status: statusCode,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Return the token and user data
      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Backend API error:', fetchError)
      
      let errorMessage = 'Unable to connect to authentication service. Please try again later.'
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout. The authentication service is taking too long to respond.'
        } else if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
          errorMessage = `Cannot reach authentication service at ${backendUrl}. The backend may not be deployed or is currently unavailable. Please ensure the Railway backend is running.`
        } else {
          errorMessage = `Connection error: ${fetchError.message}`
        }
      }
      
      // Log the full error for debugging
      console.error('Full fetch error details:', {
        error: fetchError,
        backendUrl,
        apiUrl,
      })
      
      return NextResponse.json(
        { error: errorMessage },
        { 
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
