import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantKey = searchParams.get('key') || searchParams.get('subdomain') || searchParams.get('id')
    
    if (!tenantKey) {
      return NextResponse.json(
        { error: 'Missing tenant key (key, subdomain, or id parameter required)' },
        { status: 400 }
      )
    }

    console.log('[Tenant Lookup API] Looking up tenant with key:', tenantKey)
    
    // Use public backend API endpoint (more reliable in serverless)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.BACKEND_URL || 
      'https://nuoip-production.up.railway.app'
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
    
    // Try public backend endpoint first
    try {
      const response = await fetch(`${normalizedBackendUrl}/api/v1/admin/tenants/lookup?key=${encodeURIComponent(tenantKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.tenant) {
          console.log('[Tenant Lookup API] Tenant found via backend:', {
            id: data.tenant.id,
            name: data.tenant.name,
            hasLogo: !!data.tenant.logoUrl,
          })
          
          return NextResponse.json({
            success: true,
            tenant: data.tenant,
          })
        }
      } else {
        console.log('[Tenant Lookup API] Backend returned status:', response.status)
      }
    } catch (backendError) {
      console.error('[Tenant Lookup API] Backend fetch failed:', backendError)
    }
    
    // Fallback: Try Prisma if available (for local development)
    try {
      const { getTenantBySubdomain } = await import('@/lib/services/admin')
      const tenant = await getTenantBySubdomain(tenantKey)
      
      if (tenant) {
        console.log('[Tenant Lookup API] Tenant found via Prisma:', {
          id: tenant.id,
          name: tenant.name,
          hasLogo: !!tenant.logoUrl,
        })
        
        return NextResponse.json({
          success: true,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            logoUrl: tenant.logoUrl || null,
            subdomain: tenant.subdomain,
            domain: tenant.domain,
          },
        })
      }
    } catch (prismaError) {
      console.log('[Tenant Lookup API] Prisma lookup failed (expected in production):', prismaError instanceof Error ? prismaError.message : 'Unknown')
    }
    
    console.log('[Tenant Lookup API] Tenant not found for key:', tenantKey)
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('[Tenant Lookup API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: String(error),
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

