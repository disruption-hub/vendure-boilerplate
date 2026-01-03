"use client"

import { useEffect, useMemo, useState } from 'react'

import type { CommunicationMetricsResponse } from '@/features/communications/api/communication-api'
import { fetchCommunicationMetrics } from '@/features/communications/api/communication-api'

interface OverviewState {
  loading: boolean
  error: string | null
  data: CommunicationMetricsResponse | null
}

const INITIAL_STATE: OverviewState = {
  loading: true,
  error: null,
  data: null,
}

export function CommunicationOverview() {
  const [state, setState] = useState<OverviewState>(INITIAL_STATE)

  useEffect(() => {
    let mounted = true

    fetchCommunicationMetrics()
      .then(data => {
        if (!mounted) return
        setState({ loading: false, error: null, data })
      })
      .catch(error => {
        if (!mounted) return
        setState({ loading: false, error: error instanceof Error ? error.message : 'Failed to load metrics', data: null })
      })

    return () => {
      mounted = false
    }
  }, [])

  const charts = useMemo(() => {
    if (!state.data) return []
    return state.data.messageVolume7d.map(row => ({
      date: row.date,
      channels: [
        { label: 'Email', value: row.email },
        { label: 'SMS', value: row.sms },
        { label: 'Telegram', value: row.telegram },
        { label: 'WhatsApp', value: row.whatsapp },
        { label: 'Instagram', value: row.instagram },
      ],
    }))
  }, [state.data])

  if (state.loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
        <span className="text-sm text-slate-500">Cargando métricas...</span>
      </div>
    )
  }

  if (state.error || !state.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-700">No se pudieron cargar las métricas</h3>
        <p className="mt-2 text-sm text-red-600">{state.error ?? 'Ocurrió un error desconocido.'}</p>
      </div>
    )
  }

  const { messagesSent24h, deliveryRate, recentErrors, activeWorkflows, configuredTemplates, systemHealth } = state.data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard title="Mensajes enviados (24h)" value={messagesSent24h.total} description="Total across channels" />
        <OverviewCard title="Entrega Email" value={`${deliveryRate.email ?? 0}%`} description="Últimas 24h" />
        <OverviewCard title="Entrega WhatsApp" value={`${deliveryRate.whatsapp ?? 0}%`} description="Últimas 24h" />
        <OverviewCard title="Salud del sistema" value={`${systemHealth.score.toFixed(1)}%`} description={systemHealth.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Volumen semanal</h3>
          <p className="mt-1 text-sm text-slate-500">Actividad diaria por canal (últimos 7 días)</p>

          <div className="mt-6 space-y-3">
            {charts.map(row => (
              <div key={row.date} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{row.date}</span>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-5">
                  {row.channels.map(channel => (
                    <div key={channel.label} className="rounded-md bg-slate-50 p-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">{channel.label}</div>
                      <div className="text-sm font-semibold text-slate-900">{channel.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Plantillas y flujos</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Plantillas activas</dt>
                <dd className="text-sm font-semibold text-slate-900">{configuredTemplates}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Workflows activos</dt>
                <dd className="text-sm font-semibold text-slate-900">{activeWorkflows}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Eventos recientes</h3>
            <ul className="mt-4 space-y-3">
              {recentErrors.length === 0 && (
                <li className="text-sm text-slate-500">Sin errores reportados.</li>
              )}
              {recentErrors.map(item => (
                <li key={item.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">{item.templateName ?? 'Evento'}</p>
                  <p className="mt-1 text-xs text-red-600">{item.errorMessage ?? 'Error desconocido'}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-red-500">{new Date(item.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

interface OverviewCardProps {
  title: string
  value: number | string
  description?: string
}

function OverviewCard({ title, value, description }: OverviewCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}
