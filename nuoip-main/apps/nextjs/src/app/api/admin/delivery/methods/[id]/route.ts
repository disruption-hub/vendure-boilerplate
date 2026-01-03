import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
    return handleCORS()
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    return proxyToBackend(request, `/api/v1/admin/delivery/methods/${params.id}`)
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    return proxyToBackend(request, `/api/v1/admin/delivery/methods/${params.id}`)
}
