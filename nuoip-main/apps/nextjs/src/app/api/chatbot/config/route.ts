import { NextRequest, NextResponse } from 'next/server'
import { handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    // Return empty config for now - this endpoint may not be needed
    return NextResponse.json({ config: null }, { status: 200 })
  } catch (error) {
    console.error('Error in chatbot config:', error)
    return NextResponse.json({ config: null }, { status: 200 })
  }
}

