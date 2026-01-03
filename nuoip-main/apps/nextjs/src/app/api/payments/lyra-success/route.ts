import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

/**
 * Handle POST requests from Lyra after successful payment
 * Instead of redirecting, return HTML that does client-side redirect
 * This works around Vercel's routing limitations
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body
    const rawBody = await request.text().catch(() => '')
    const contentType = request.headers.get('content-type') || ''
    
    let searchParams = new URLSearchParams()
    
    // Parse body based on content type
    if (contentType.includes('application/x-www-form-urlencoded') && rawBody) {
      const params = new URLSearchParams(rawBody)
      for (const [key, value] of params.entries()) {
        searchParams.append(key, value)
      }
    } else if (contentType.includes('application/json') && rawBody) {
      try {
        const body = JSON.parse(rawBody)
        for (const [key, value] of Object.entries(body)) {
          if (typeof value === 'string') {
            searchParams.append(key, value)
          } else {
            searchParams.append(key, JSON.stringify(value))
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    } else if (rawBody) {
      try {
        const params = new URLSearchParams(rawBody)
        for (const [key, value] of params.entries()) {
          searchParams.append(key, value)
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Also check URL search params
    const urlParams = request.nextUrl.searchParams
    for (const [key, value] of urlParams.entries()) {
      searchParams.append(key, value)
    }
    
    // Build redirect URL
    const redirectUrl = `/payments/lyra/browser-success?${searchParams.toString()}`
    
    // Return HTML that does client-side redirect
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href="${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting to payment success page... <a href="${redirectUrl}">Click here if not redirected</a></p>
</body>
</html>`
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[lyra-success API] Error:', error)
    // Fallback: redirect anyway
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/payments/lyra/browser-success">
  <script>window.location.href="/payments/lyra/browser-success";</script>
</head>
<body>
  <p>Redirecting... <a href="/payments/lyra/browser-success">Click here</a></p>
</body>
</html>`
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}

/**
 * Handle GET requests (fallback or direct access)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString()
  const redirectUrl = searchParams 
    ? `/payments/lyra/browser-success?${searchParams}`
    : '/payments/lyra/browser-success'
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href="${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting... <a href="${redirectUrl}">Click here</a></p>
</body>
</html>`
  
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
