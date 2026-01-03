'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { useAuthStore } from '@/stores'
import { authenticatedFetch } from '@/features/admin/api/admin-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, MessageSquare, Users, Clock, ArrowUpRight, ArrowDownRight, Minus, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/stores'

import dynamic from 'next/dynamic'

const ChartLoadingState = () => (
  <div className="flex h-full items-center justify-center text-sm text-gray-600">
    Cargando visualizaciones…
  </div>
)

const TimelineChart = dynamic(() => import('./charts/WhatsAppTimelineChart'), {
  ssr: false,
  loading: ChartLoadingState,
})

const StatusChart = dynamic(() => import('./charts/WhatsAppStatusChart'), {
  ssr: false,
  loading: ChartLoadingState,
})

const HourlyChart = dynamic(() => import('./charts/WhatsAppHourlyChart'), {
  ssr: false,
  loading: ChartLoadingState,
})

type TimelinePoint = {
  iso: string
  sent: number
  received: number
  total: number
}

type StatusPoint = {
  status: string
  count: number
  percentage: number
}

type HourlyPoint = {
  hour: number
  sent: number
  received: number
  total: number
}

type AnalyticsResponse = {
  success: boolean
  totalMessages: number
  sentMessages: number
  receivedMessages: number
  sentPercentage: number
  receivedPercentage: number
  activeContacts: number
  flowbotMessages: number
  flowbotPercentage: number
  avgResponseTime: number | null
  timeRange: string
  startDate: string
  endDate: string
  messagesChange: number | null
  sentChange: number | null
  receivedChange: number | null
  timeline: TimelinePoint[]
  hourlyDistribution: HourlyPoint[]
  statusBreakdown: StatusPoint[]
  peakHour: number | null
  peakHourVolume: number
}

const statusColors: Record<string, string> = {
  PENDING: '#6366F1',
  SENT: '#22C55E',
  DELIVERED: '#0EA5E9',
  READ: '#F97316',
  FAILED: '#F43F5E',
}

const numberFormatter = new Intl.NumberFormat('es-ES')

export function WhatsAppAnalyticsView() {
  const { user } = useAuthStore()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<string>('7d')

  useEffect(() => {
    loadSessions()
  }, [user])

  useEffect(() => {
    if (selectedSessionId) {
      loadAnalytics()
    }
  }, [selectedSessionId, timeRange])

  const loadSessions = async () => {
    try {
      const response = await authenticatedFetch('/api/whatsapp/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        if (data.sessions?.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data.sessions[0].sessionId)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'No se pudieron cargar las sesiones')
      }
    } catch (error) {
      console.error('Failed to load sessions', error)
      toast.error('Error', 'Error al cargar las sesiones de WhatsApp')
    }
  }

  const loadAnalytics = async () => {
    if (!selectedSessionId) return

    setLoading(true)
    try {
      const response = await authenticatedFetch(
        `/api/whatsapp/analytics?sessionId=${selectedSessionId}&timeRange=${timeRange}`
      )
      if (response.ok) {
        const data: AnalyticsResponse = await response.json()
        if (data.success) {
          setAnalytics(data)
          toast.success('Analíticas cargadas', 'Datos actualizados correctamente')
        } else {
          setAnalytics(null)
          toast.warning('Sin datos', 'No hay datos de analíticas disponibles para este período')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'No se pudieron cargar las analíticas')
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Failed to load analytics', error)
      toast.error('Error', 'Error al cargar las analíticas')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }


  if (loading && !analytics) {
    return (
      <Alert className="bg-white border-gray-200">
        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        <AlertDescription className="text-black">Cargando analíticas...</AlertDescription>
      </Alert>
    )
  }

  const renderChange = (change?: number | null) => {
    if (change === undefined) {
      return null
    }
    if (change === null) {
      return <span className="text-xs text-white/70">Sin datos previos</span>
    }
    if (change === 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-white/80">
          <Minus className="h-3 w-3" />
          0%
        </span>
      )
    }
    const positive = change > 0
    const Icon = positive ? ArrowUpRight : ArrowDownRight
    return (
      <span
        className={`flex items-center gap-1 text-xs font-medium ${
          positive ? 'text-emerald-200' : 'text-rose-200'
        }`}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(change)}%
      </span>
    )
  }

  const formatTimelineTick = (iso: string) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    if (timeRange === '24h') {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit' })
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  const formatTimelineTooltip = (iso: string) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    if (timeRange === '24h') {
      return date.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  const hourlyData = useMemo(() => {
    if (!analytics) {
      return []
    }
    const map = new Map<number, HourlyPoint>()
    analytics.hourlyDistribution.forEach(entry => {
      map.set(entry.hour, entry)
    })
    return Array.from({ length: 24 }, (_, hour) => {
      const item = map.get(hour)
      return {
        hour,
        sent: item?.sent ?? 0,
        received: item?.received ?? 0,
        total: item?.total ?? 0,
      }
    })
  }, [analytics])

  const peakHourLabel = useMemo(() => {
    if (!analytics || analytics.peakHour === null) {
      return 'Sin datos'
    }
    const hour = analytics.peakHour
    return `${hour.toString().padStart(2, '0')}:00`
  }, [analytics])

  type SummaryCard = {
    key: string
    title: string
    icon: ComponentType<{ className?: string }>
    accent: string
    value: number | string
    helper?: string
    change?: number | null
  }

  const summaryCards = useMemo<SummaryCard[]>(() => {
    if (!analytics) {
      return []
    }

    return [
      {
        key: 'total',
        title: 'Mensajes totales',
        icon: MessageSquare,
        accent: 'from-sky-500 via-sky-600 to-sky-700',
        value: numberFormatter.format(analytics.totalMessages || 0),
        helper: 'Vs período anterior',
        change: analytics.messagesChange,
      },
      {
        key: 'sent',
        title: 'Mensajes enviados',
        icon: TrendingUp,
        accent: 'from-emerald-500 via-emerald-600 to-emerald-700',
        value: numberFormatter.format(analytics.sentMessages || 0),
        helper: `${analytics.sentPercentage ?? 0}% del total`,
        change: analytics.sentChange,
      },
      {
        key: 'received',
        title: 'Mensajes recibidos',
        icon: MessageSquare,
        accent: 'from-indigo-500 via-indigo-600 to-indigo-700',
        value: numberFormatter.format(analytics.receivedMessages || 0),
        helper: `${analytics.receivedPercentage ?? 0}% del total`,
        change: analytics.receivedChange,
      },
      {
        key: 'contacts',
        title: 'Contactos activos',
        icon: Users,
        accent: 'from-cyan-500 via-cyan-600 to-cyan-700',
        value: numberFormatter.format(analytics.activeContacts || 0),
        helper: 'Conversaciones con actividad',
      },
      {
        key: 'flowbot',
        title: 'Mensajes por FlowBot',
        icon: Activity,
        accent: 'from-fuchsia-500 via-fuchsia-600 to-fuchsia-700',
        value: numberFormatter.format(analytics.flowbotMessages || 0),
        helper: `${analytics.flowbotPercentage ?? 0}% automatizados`,
      },
      {
        key: 'response',
        title: 'Hora pico de actividad',
        icon: Clock,
        accent: 'from-amber-500 via-amber-600 to-amber-700',
        value: peakHourLabel,
        helper:
          analytics.peakHourVolume > 0
            ? `${numberFormatter.format(analytics.peakHourVolume)} mensajes en esa franja`
            : 'Sin actividad registrada',
      },
    ]
  }, [analytics, peakHourLabel])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-black">Analíticas</h2>
          </div>
          <p className="text-gray-600 mt-1">Métricas y estadísticas de uso de WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-[200px] bg-white text-black border-gray-300">
              <SelectValue placeholder="Seleccionar sesión" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {sessions.map(sessionItem => (
                <SelectItem key={sessionItem.sessionId} value={sessionItem.sessionId} className="text-black">
                  {sessionItem.name || sessionItem.sessionId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] bg-white text-black border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="24h" className="text-black">Últimas 24h</SelectItem>
              <SelectItem value="7d" className="text-black">Últimos 7 días</SelectItem>
              <SelectItem value="30d" className="text-black">Últimos 30 días</SelectItem>
              <SelectItem value="90d" className="text-black">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {summaryCards.map(card => {
              const Icon = card.icon
              return (
                <Card
                  key={card.key}
                  className={`relative overflow-hidden border-none shadow-lg text-white bg-gradient-to-br ${card.accent}`}
                >
                  <div className="absolute inset-0 opacity-20 mix-blend-soft-light bg-[radial-gradient(circle_at_top,_#fff_0,_rgba(255,255,255,0)_60%)]" />
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/90">{card.title}</CardTitle>
                    <Icon className="h-5 w-5 text-white/80" />
                  </CardHeader>
                  <CardContent className="relative space-y-3">
                    <div className="text-3xl font-semibold tracking-tight">
                      {card.value}
                    </div>
                    {card.helper && <p className="text-xs text-white/80">{card.helper}</p>}
                    {renderChange(card.change)}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2 bg-white border-gray-200">
              <CardHeader className="bg-white">
                <CardTitle className="text-black">Volumen de mensajes</CardTitle>
              </CardHeader>
              <CardContent className="h-72 bg-white">
                {analytics.timeline.length > 0 ? (
                  <TimelineChart
                    data={analytics.timeline}
                    formatTick={formatTimelineTick}
                    formatTooltip={formatTimelineTooltip}
                    formatValue={value => numberFormatter.format(value)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-600">
                    Sin datos suficientes para este período
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader className="bg-white">
                <CardTitle className="text-black">Estados de mensajes</CardTitle>
              </CardHeader>
              <CardContent className="h-72 bg-white">
                {analytics.statusBreakdown.length > 0 ? (
                  <StatusChart
                    data={analytics.statusBreakdown}
                    statusColors={statusColors}
                    formatValue={value => numberFormatter.format(value)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-600">
                    Sin información de estados disponible
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader className="bg-white">
                <CardTitle className="text-black">Distribución por hora</CardTitle>
              </CardHeader>
              <CardContent className="h-72 bg-white">
                {hourlyData.some(item => item.total > 0) ? (
                  <HourlyChart
                    data={hourlyData}
                    formatLabel={value => `${String(value).padStart(2, '0')}:00`}
                    formatTick={value => `${String(value).padStart(2, '0')}h`}
                    formatValue={value => numberFormatter.format(value)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-600">
                    Aún no hay actividad registrada en este rango
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6 bg-white">
            <div className="text-center text-gray-600">
              <Activity className="mx-auto h-12 w-12 mb-4 opacity-40 text-gray-400" />
              <p className="text-black">No hay datos de analíticas disponibles para esta sesión</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
