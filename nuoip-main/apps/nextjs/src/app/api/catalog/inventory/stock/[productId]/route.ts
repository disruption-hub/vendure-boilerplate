import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
    return handleCORS()
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ productId: string }> }
) {
    const params = await props.params
    return proxyToBackend(request, `/api/v1/catalog/inventory/stock/${params.productId}`)
}
