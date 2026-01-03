import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await proxyToBackend(request, `/api/v1/admin/schedule/${id}`)
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/schedule/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await proxyToBackend(request, `/api/v1/admin/schedule/${id}`)
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/schedule/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await proxyToBackend(request, `/api/v1/admin/schedule/${id}`)
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/schedule/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule template' },
      { status: 500 }
    )
  }
}

