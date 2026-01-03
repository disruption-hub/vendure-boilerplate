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
    const path = queryString ? `/api/v1/admin/calibration/report?${queryString}` : '/api/v1/admin/calibration/report'
    return await proxyToBackend(request, path)
  } catch (error) {
    console.error('Error proxying calibration report:', error)
    // Return empty report if endpoint doesn't exist
    return NextResponse.json({
      sessions: [],
      aggregatedReport: {
        observed: [],
        missingFromChart: [],
        unobservedChartTransitions: [],
        statistics: {
          totalObserved: 0,
          bySource: {},
        },
      },
    }, { status: 200 })
  }
}


