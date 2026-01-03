import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing asset ID' },
        { status: 400 }
      )
    }

    // Proxy to backend - the backend should have an endpoint to serve tenant assets
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.BACKEND_URL || 
      'https://nuoip-production.up.railway.app'
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
    
    // Try to fetch from backend
    const backendAssetUrl = `${normalizedBackendUrl}/api/v1/public/tenant-assets/logo/${id}`
    
    try {
      const response = await fetch(backendAssetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/png'
        const imageBuffer = await response.arrayBuffer()
        
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
    } catch (backendError) {
      console.error('[Tenant Asset API] Backend fetch failed:', backendError)
    }
    
    // If backend doesn't have the asset, return 404
    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('[Tenant Asset API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

