import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const getBackendUrl = () => {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  return url.replace(/\/+$/, '') // Remove trailing slashes
}

const BACKEND_URL = getBackendUrl()

/**
 * API route to handle Lyra payment failure redirects
 * This route receives POST from Lyra and proxies to the backend redirect endpoint
 * Using frontend domain avoids CSP form-action violations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Build query string for backend
    const queryString = new URLSearchParams(queryParams).toString()
    const backendUrl = `${BACKEND_URL}/api/v1/payments/lyra/redirect/failure${queryString ? `?${queryString}` : ''}`
    
    // Fetch from backend directly (backend returns HTML)
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Backend returns HTML with redirect, so we need to return it as-is
    const html = await response.text()
    
    return new NextResponse(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[Lyra Failure Redirect] Error:', error)
    // Fallback redirect to failure page
    const searchParams = request.nextUrl.searchParams.toString()
    const redirectUrl = `/payments/lyra/browser-failure${searchParams ? `?${searchParams}` : ''}`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse body - Lyra sends form data
    let body: any = {}
    try {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        body = await request.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        body = Object.fromEntries(formData.entries())
      } else {
        // Try to parse as text and then as JSON
        const text = await request.text()
        try {
          body = JSON.parse(text)
        } catch {
          // If not JSON, try to parse as URL-encoded
          const params = new URLSearchParams(text)
          body = Object.fromEntries(params.entries())
        }
      }
    } catch (parseError) {
      console.warn('[Lyra Failure Redirect] Error parsing body:', parseError)
    }

    // Also get query params
    const searchParams = request.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Merge body and query params
    const allParams = { ...queryParams, ...body }

    // Fetch from backend directly (backend returns HTML)
    const response = await fetch(`${BACKEND_URL}/api/v1/payments/lyra/redirect/failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(allParams),
    })

    // Backend returns HTML with redirect, so we need to return it as-is
    const html = await response.text()
    
    return new NextResponse(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[Lyra Failure Redirect] Error:', error)
    // Fallback redirect to failure page
    const searchParams = request.nextUrl.searchParams.toString()
    const redirectUrl = `/payments/lyra/browser-failure${searchParams ? `?${searchParams}` : ''}`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }
}

