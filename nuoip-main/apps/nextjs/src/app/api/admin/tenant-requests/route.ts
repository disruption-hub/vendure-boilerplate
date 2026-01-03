import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const path = queryString ? `/api/v1/admin/tenant-requests?${queryString}` : '/api/v1/admin/tenant-requests'
    const response = await proxyToBackend(request, path)
    
    // Check if backend returned 404 (endpoint doesn't exist)
    if (response.status === 404) {
      return NextResponse.json(
        { success: true, requests: [], message: 'Tenant requests endpoint not yet implemented in backend' },
        { status: 200 }
      )
    }
    
    // If response is successful, check if it has the expected format
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      // If the response doesn't have the expected format, wrap it
      if (Array.isArray(data)) {
        // Backend returned array directly
        return NextResponse.json({ success: true, requests: data })
      } else if (data.requests && !data.success) {
        // Backend returned { requests: [...] } without success
        return NextResponse.json({ success: true, requests: data.requests })
      } else if (data.success === undefined && data.error) {
        // Error response without success field
        return NextResponse.json({ success: false, requests: [], error: data.error })
      } else if (data.success !== undefined) {
        // Already has success field
        return NextResponse.json(data)
      } else {
        // Unknown format, wrap it
        return NextResponse.json({ success: true, requests: data.requests || [] })
      }
    }
    
    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/tenant-requests:', error)
    return NextResponse.json(
      { success: true, requests: [], message: 'Tenant requests endpoint not yet implemented in backend' },
      { status: 200 }
    )
  }
}

