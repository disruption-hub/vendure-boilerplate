import { NextRequest, NextResponse } from 'next/server'
import { handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(request: NextRequest) {
  try {
    // Return success for now
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in chatbot scheduled dispatch:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

