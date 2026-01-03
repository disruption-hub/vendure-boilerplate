import { NextRequest, NextResponse } from 'next/server'

function getBackendUrl(): string {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  // Remove trailing slash if present
  return backendUrl.replace(/\/$/, '')
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Logo Upload API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tenantId = formData.get('tenantId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PNG, JPG, WEBP, or SVG logo.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload a logo smaller than 5MB.' },
        { status: 400 }
      )
    }

    // Create FormData for backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    if (tenantId) {
      backendFormData.append('tenantId', tenantId)
    }

    const backendUrl = getBackendUrl()
    const url = tenantId 
      ? `${backendUrl}/api/v1/admin/tenants/${tenantId}/logo`
      : `${backendUrl}/api/v1/admin/tenants/logo`

    console.log('[Logo Upload API] Uploading to:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: backendFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Logo Upload API] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Upload failed' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('[Logo Upload API] Upload successful:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Logo Upload API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

