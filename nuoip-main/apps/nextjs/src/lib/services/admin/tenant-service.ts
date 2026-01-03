// Tenant service - proxies to backend for all data access
// Following the architecture: Next.js does NOT access database directly

export async function getTenantBySubdomain(subdomainOrId: string) {
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
    const response = await fetch(`${normalizedBackendUrl}/api/v1/admin/tenants/lookup?key=${encodeURIComponent(subdomainOrId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000), // Increased to 8s for better reliability
    })

    if (!response.ok) {
      console.warn(`[getTenantBySubdomain] Backend returned ${response.status}`)
      return null
    }

    const data = await response.json()
    // Backend returns { success: boolean, tenant?: any }
    if (data.success && data.tenant) {
      return data.tenant
    }
    return null
  } catch (error) {
    // Don't log timeout errors as errors - they're expected when backend is slow
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn('[getTenantBySubdomain] Backend timeout - will rely on client-side fetch')
    } else {
      console.warn('[getTenantBySubdomain] Error fetching from backend:', error)
    }
    return null
  }
}

export async function getTenantCustomization(tenantIdOrKey: string): Promise<{ customization: any } | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')

    // First, resolve tenant ID if a key (subdomain/domain) was provided
    let tenantId = tenantIdOrKey

    // If it looks like a Prisma ID (starts with 'cm'), use it directly
    // Otherwise, try to resolve it via lookup
    if (!tenantIdOrKey.startsWith('cm')) {
      const lookupResponse = await fetch(`${normalizedBackendUrl}/api/v1/admin/tenants/lookup?key=${encodeURIComponent(tenantIdOrKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(2000), // Reduced to 2s
      })

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json()
        if (lookupData.success && lookupData.tenant?.id) {
          tenantId = lookupData.tenant.id
        } else {
          return null
        }
      } else {
        return null
      }
    }

    // Now fetch customization using the dedicated endpoint
    const response = await fetch(`${normalizedBackendUrl}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/customization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(2000), // Reduced to 2s
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { customization: null }
      }
      return null
    }

    const data = await response.json()
    // Backend returns { customization: any }
    return data
  } catch (error) {
    console.error('[getTenantCustomization] Error:', error)
    return null
  }
}

export async function getRootDomainConfig(): Promise<string> {
  // Use environment variable directly - no database access from Next.js
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || 'flowcast.chat'
}
