import { NextRequest, NextResponse } from 'next/server'
import { handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId')
    
    // Return empty scheduled messages for now
    return NextResponse.json({ messages: [], contactId: contactId || null }, { status: 200 })
  } catch (error) {
    console.error('Error in chatbot scheduled:', error)
    return NextResponse.json({ messages: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Return success for now
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in chatbot scheduled POST:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

