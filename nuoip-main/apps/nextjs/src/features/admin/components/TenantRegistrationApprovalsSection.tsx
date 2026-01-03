'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getTenantSignupRequests,
  updateTenantSignupRequest,
  type TenantSignupRequest,
  type TenantSignupRequestStatus,
} from '@/features/admin/api/admin-api'
import { toast } from '@/stores'

type FilterValue = TenantSignupRequestStatus | 'all'

const FILTER_OPTIONS: Array<{ value: FilterValue; label: string }> = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'all', label: 'Todas' },
]

const STATUS_STYLES: Record<FilterValue, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  all: 'bg-gray-100 text-gray-700',
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString()
}

function extractRejectionReason(request: TenantSignupRequest): string | null {
  const metadata = request.metadata as Record<string, unknown> | null | undefined
  const reason = metadata?.rejectionReason
  return typeof reason === 'string' && reason.trim() ? reason.trim() : null
}

export function TenantRegistrationApprovalsSection() {
  const [requests, setRequests] = useState<TenantSignupRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<FilterValue>('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionInFlight, setActionInFlight] = useState<string | null>(null)

  const fetchRequests = useCallback(async (filter: FilterValue) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTenantSignupRequests(filter)
      setRequests(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cargar las solicitudes.'
      setError(message)
      toast.error('Error al cargar solicitudes', message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRequests(statusFilter)
  }, [fetchRequests, statusFilter])

  const handleApprove = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    const companyName = request?.companyName || 'la solicitud'
    
    try {
      setActionInFlight(requestId)
      const updated = await updateTenantSignupRequest(requestId, 'approve')
      setRequests(prev => prev.map(item => (item.id === updated.id ? updated : item)))
      toast.success('Solicitud aprobada', `${companyName} ha sido aprobada exitosamente.`)
    } catch (err) {
      console.error('Error approving request:', err)
      // Extract more detailed error message
      let message = 'No fue posible aprobar la solicitud.'
      if (err instanceof Error) {
        message = err.message || message
        // If message is a JSON string, try to parse it
        if (message.startsWith('{') && message.endsWith('}')) {
          try {
            const parsed = JSON.parse(message)
            message = parsed.message || parsed.error || message
          } catch {
            // Not valid JSON, use as-is
          }
        }
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String(err.message)
      }
      setError(message)
      toast.error('Error al aprobar', message)
    } finally {
      setActionInFlight(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    const companyName = request?.companyName || 'la solicitud'
    
    const reason = window.prompt('Motivo de rechazo (opcional):') || undefined
    if (reason === null) {
      // User cancelled the prompt
      return
    }
    
    try {
      setActionInFlight(requestId)
      const updated = await updateTenantSignupRequest(requestId, 'reject', { reason })
      setRequests(prev => prev.map(item => (item.id === updated.id ? updated : item)))
      toast.success('Solicitud rechazada', `${companyName} ha sido rechazada.`)
    } catch (err) {
      console.error('Error rejecting request:', err)
      // Extract more detailed error message
      let message = 'No fue posible rechazar la solicitud.'
      if (err instanceof Error) {
        message = err.message || message
        // If message is a JSON string, try to parse it
        if (message.startsWith('{') && message.endsWith('}')) {
          try {
            const parsed = JSON.parse(message)
            message = parsed.message || parsed.error || message
          } catch {
            // Not valid JSON, use as-is
          }
        }
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String(err.message)
      }
      setError(message)
      toast.error('Error al rechazar', message)
    } finally {
      setActionInFlight(null)
    }
  }

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') {
      return requests
    }
    return requests.filter(item => item.status === statusFilter)
  }, [requests, statusFilter])

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                <span className="text-sm font-medium text-white">T</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Total Requests</p>
              <p className="text-2xl font-bold text-black">{requests.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500">
                <span className="text-sm font-medium text-white">P</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Pending</p>
              <p className="text-2xl font-bold text-black">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
                <span className="text-sm font-medium text-white">A</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Approved</p>
              <p className="text-2xl font-bold text-black">{approvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Solicitudes de Registro de Tenants</h3>
            <p className="mt-1 text-sm text-gray-600">
              Revisa, aprueba o rechaza las nuevas solicitudes enviadas desde el formulario público.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  statusFilter === option.value
                    ? STATUS_STYLES[option.value]
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => void fetchRequests(statusFilter)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
            No hay solicitudes que coincidan con el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Empresa
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contacto
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subdominio
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Fechas
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRequests.map(request => {
                  const statusStyle = STATUS_STYLES[request.status]
                  const rejectionReason = extractRejectionReason(request)
                  return (
                    <tr key={request.id} className="align-top">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium text-gray-900">{request.companyName}</div>
                        <div className="text-xs text-gray-500">{request.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{request.contactName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-mono text-sm">{request.desiredSubdomain}</div>
                        {request.activationLink ? (
                          <a
                            href={request.activationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Ver enlace de activación
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyle}`}>
                          {request.status === 'pending'
                            ? 'Pendiente'
                            : request.status === 'approved'
                            ? 'Aprobada'
                            : 'Rechazada'}
                        </span>
                        {rejectionReason ? (
                          <p className="mt-1 text-xs text-gray-500">{rejectionReason}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <span className="text-xs font-semibold text-gray-500">Creada:</span>{' '}
                          {formatDateTime(request.createdAt)}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500">Actualizada:</span>{' '}
                          {formatDateTime(request.updatedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {request.status === 'pending' ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => void handleApprove(request.id)}
                              disabled={actionInFlight === request.id}
                              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => void handleReject(request.id)}
                              disabled={actionInFlight === request.id}
                              className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : request.status === 'approved' ? (
                          <div className="text-xs text-gray-500">
                            Token: <span className="font-mono">{request.activationToken}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Sin acciones disponibles.</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
