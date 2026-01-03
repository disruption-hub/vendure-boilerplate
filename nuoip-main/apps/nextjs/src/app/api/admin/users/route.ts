import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    const response = await proxyToBackend(request, '/api/v1/admin/users')
    
    // If successful, check response format and normalize it
    if (response.ok) {
      // Clone response to read body without consuming it
      const clonedResponse = response.clone()
      const data = await clonedResponse.json().catch(() => null)
      if (data) {
        // Backend returns array directly, wrap it in { users: [...] }
        if (Array.isArray(data)) {
          console.log('[Users API] Backend returned array, wrapping in users property')
          return NextResponse.json({ users: data, total: data.length })
        }
        // If already has users property, return as-is
        if (data.users && Array.isArray(data.users)) {
          console.log('[Users API] Backend returned object with users property')
          return NextResponse.json(data)
        }
        console.log('[Users API] Unknown response format:', data)
      }
      return response
    }
    
    // Check if backend returned 404 (endpoint doesn't exist)
    if (response.status === 404) {
      // Try to get current user from auth/me endpoint as fallback
      try {
        const authHeader = request.headers.get('Authorization')
        if (authHeader) {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
            process.env.BACKEND_URL || 
            'https://nuoip-production.up.railway.app'
          const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
          
          const meResponse = await fetch(`${normalizedBackendUrl}/api/v1/auth/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            signal: AbortSignal.timeout(5000),
          })
          
          if (meResponse.ok) {
            const currentUser = await meResponse.json()
            // Format as user list response
            return NextResponse.json({
              users: [{
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name || currentUser.email,
                role: currentUser.role || 'admin',
                tenantId: currentUser.tenantId,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }],
              total: 1,
            })
          }
        }
      } catch (meError) {
        console.log('Could not fetch current user:', meError)
      }
      
      return NextResponse.json(
        { users: [], total: 0, message: 'Users endpoint not yet implemented in backend' },
        { status: 200 }
      )
    }
    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/users:', error)
    
    // Try to get current user as fallback
    try {
      const authHeader = request.headers.get('Authorization')
      if (authHeader) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
          process.env.BACKEND_URL || 
          'https://nuoip-production.up.railway.app'
        const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')
        
        const meResponse = await fetch(`${normalizedBackendUrl}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          signal: AbortSignal.timeout(5000),
        })
        
        if (meResponse.ok) {
          const currentUser = await meResponse.json()
          return NextResponse.json({
            users: [{
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name || currentUser.email,
              role: currentUser.role || 'admin',
              tenantId: currentUser.tenantId,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            total: 1,
          })
        }
      }
    } catch (meError) {
      console.log('Could not fetch current user:', meError)
    }
    
    return NextResponse.json(
      { users: [], total: 0, message: 'Users endpoint not yet implemented in backend' },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Users API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    return await proxyToBackend(request, '/api/v1/admin/users', {
      method: 'POST',
      body,
    })
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/users:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The users endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

