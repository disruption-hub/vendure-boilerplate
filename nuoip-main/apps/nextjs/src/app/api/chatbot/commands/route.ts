import { NextRequest, NextResponse } from 'next/server'
import { handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    // Return empty commands array for now
    return NextResponse.json({ commands: [] }, { status: 200 })
  } catch (error) {
    console.error('Error in chatbot commands:', error)
    return NextResponse.json({ commands: [] }, { status: 200 })
  }
}

