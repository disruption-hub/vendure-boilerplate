"use client"

import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getCalibrationSessions,
  getFlowCalibrationReport,
  type CalibrationReportResponse,
  type CalibrationSessionSummary,
  type FlowCalibrationReportParams,
} from '@/features/admin/api/admin-api'
import type { FlowCalibrationReportEdge } from '@/lib/chatbot/analysis/flow-calibration-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react'

type AssessmentMode = NonNullable<FlowCalibrationReportParams['mode']>
type GroupingMode = NonNullable<FlowCalibrationReportParams['grouping']>
type IndividualReportEntries = NonNullable<CalibrationReportResponse['individualReports']>

export function FlowCalibrationPanel(): React.JSX.Element {
  const [sessions, setSessions] = useState<CalibrationSessionSummary[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [report, setReport] = useState<CalibrationReportResponse | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const [includeUnobserved, setIncludeUnobserved] = useState(true)
  const [summarizeWithLLM, setSummarizeWithLLM] = useState(false)
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('session')
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('individual')
  const [targetDate, setTargetDate] = useState<string>('')
  const [rangeStart, setRangeStart] = useState<string>('')
  const [rangeEnd, setRangeEnd] = useState<string>('')
  const [lastRunUsedLLM, setLastRunUsedLLM] = useState(false)

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true)
      setSessionsError(null)
      const items = await getCalibrationSessions(15)
      setSessions(items)
      if (assessmentMode === 'session' && !selectedSession && items.length > 0) {
        setSelectedSession(items[0]!.sessionId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar la lista de sesiones'
      setSessionsError(message)
    } finally {
      setSessionsLoading(false)
    }
  }, [assessmentMode, selectedSession])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (assessmentMode === 'session') {
      if (!selectedSession && sessions.length > 0) {
        setSelectedSession(sessions[0]!.sessionId)
      }
    } else if (selectedSession) {
      setSelectedSession('')
    }
  }, [assessmentMode, sessions, selectedSession])

  useEffect(() => {
    if (assessmentMode === 'session' && groupingMode === 'group') {
      setGroupingMode('individual')
    }
  }, [assessmentMode, groupingMode])

  const runCalibration = useCallback(async () => {
    const payload: FlowCalibrationReportParams = {
      mode: assessmentMode,
      grouping: groupingMode,
      includeUnobservedExpected: includeUnobserved,
      summarizeWithLLM,
    }

    if (assessmentMode === 'session') {
      if (!selectedSession) {
        setReportError('Selecciona una sesión para evaluar')
        setReport(null)
        setLastRunUsedLLM(false)
        return
      }
      const sessionMeta = sessions.find(item => item.sessionId === selectedSession)
      payload.sessionId = selectedSession
      if (sessionMeta?.tenantId) {
        payload.tenantId = sessionMeta.tenantId
      }
    }

    if (assessmentMode === 'date') {
      if (!targetDate) {
        setReportError('Define una fecha para evaluar')
        setReport(null)
        setLastRunUsedLLM(false)
        return
      }
      payload.targetDate = targetDate
    }

    if (assessmentMode === 'range') {
      if (!rangeStart && !rangeEnd) {
        setReportError('Define al menos una fecha para el rango')
        setReport(null)
        setLastRunUsedLLM(false)
        return
      }
      if (rangeStart) {
        payload.startDate = rangeStart
      }
      if (rangeEnd) {
        payload.endDate = rangeEnd
      }
    }

    try {
      setReportLoading(true)
      setReportError(null)
      const data = await getFlowCalibrationReport(payload)
      setReport(data)
      setLastRunUsedLLM(Boolean(payload.summarizeWithLLM))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el reporte'
      setReportError(message)
      setLastRunUsedLLM(false)
    } finally {
      setReportLoading(false)
    }
  }, [assessmentMode, groupingMode, includeUnobserved, rangeEnd, rangeStart, selectedSession, sessions, summarizeWithLLM, targetDate])

  useEffect(() => {
    if (assessmentMode === 'session' && selectedSession) {
      void runCalibration()
    }
  }, [assessmentMode, selectedSession, runCalibration])

  const aggregatedReport = report?.aggregatedReport
  const observedEdges = useMemo(() => sortEdges(aggregatedReport?.observed ?? []), [aggregatedReport])
  const missingEdges = useMemo(() => sortEdges(aggregatedReport?.missingFromChart ?? []), [aggregatedReport])
  const unobservedEdges = useMemo(() => sortEdges(aggregatedReport?.unobservedChartTransitions ?? []), [aggregatedReport])
  const individualReports = report?.individualReports

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <CardTitle className="text-black">Calibración del flujo</CardTitle>
              </div>
              <CardDescription className="text-black">
              Compara las transiciones observadas en memoria con el diagrama Mermaid actual para detectar desviaciones o rutas faltantes.
              </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
              <Button
              type="button"
              onClick={() => void loadSessions()}
                variant="outline"
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
              disabled={sessionsLoading}
            >
                {sessionsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando…
                  </>
                ) : (
                  'Actualizar sesiones'
                )}
              </Button>
              <Button
              type="button"
              onClick={() => void runCalibration()}
                className="bg-green-600 text-white border-green-600 hover:bg-green-700"
              disabled={reportLoading || (assessmentMode === 'session' && !selectedSession)}
            >
                {reportLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando…
                  </>
                ) : (
                  'Ejecutar calibración'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-white">
          <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
                  <label className="text-sm font-medium text-black" htmlFor="calibration-mode">
                Modo de análisis
              </label>
              <select
                id="calibration-mode"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
                value={assessmentMode}
                onChange={event => setAssessmentMode(event.target.value as AssessmentMode)}
              >
                <option value="session">Sesión específica</option>
                <option value="latest">Última sesión registrada</option>
                <option value="date">Fecha determinada</option>
                <option value="range">Rango de fechas</option>
              </select>
            </div>

            <div className="space-y-2">
                  <label className="text-sm font-medium text-black" htmlFor="calibration-group">
                Tipo de evaluación
              </label>
              <select
                id="calibration-group"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
                value={groupingMode}
                onChange={event => setGroupingMode(event.target.value as GroupingMode)}
                disabled={assessmentMode === 'session'}
              >
                <option value="individual">Individual</option>
                <option value="group">Grupal</option>
              </select>
            </div>

            {assessmentMode === 'session' && (
              <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="calibration-session">
                  Sesión a evaluar
                </label>
                <select
                  id="calibration-session"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
                  value={selectedSession}
                  onChange={event => setSelectedSession(event.target.value)}
                  disabled={sessionsLoading}
                >
                  {sessions.length === 0 && <option value="">No hay sesiones recientes</option>}
                  {sessions.map(item => (
                    <option key={item.sessionId} value={item.sessionId}>
                      {item.sessionId} · {item.tenantId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assessmentMode === 'date' && (
              <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="calibration-date">
                  Fecha a evaluar
                </label>
                <input
                  id="calibration-date"
                  type="date"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
                  value={targetDate}
                  onChange={event => setTargetDate(event.target.value)}
                />
              </div>
            )}

            {assessmentMode === 'range' && (
              <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="calibration-range-start">
                  Rango de fechas
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    id="calibration-range-start"
                    type="date"
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
                    value={rangeStart}
                    onChange={event => setRangeStart(event.target.value)}
                  />
                  <input
                    id="calibration-range-end"
                    type="date"
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
                    value={rangeEnd}
                    onChange={event => setRangeEnd(event.target.value)}
                  />
                </div>
                    <p className="text-xs text-gray-600">Puedes dejar una fecha en blanco para que el rango cubra siete días alrededor de la otra.</p>
              </div>
            )}

            <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-black">
                <input
                  type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                  checked={includeUnobserved}
                  onChange={event => setIncludeUnobserved(event.target.checked)}
                />
                Incluir transiciones esperadas no observadas
              </label>
                  <label className="flex items-center gap-2 text-sm text-black">
                <input
                  type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                  checked={summarizeWithLLM}
                  onChange={event => setSummarizeWithLLM(event.target.checked)}
                />
                Pedir resumen a OpenRouter (puede generar costo)
              </label>
            </div>

                <Alert className="bg-white border-gray-200">
                  <AlertDescription className="text-black">
                    {sessionsLoading ? 'Cargando sesiones…' : sessionsError ?? `${sessions.length} sesiones listadas`}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

          <div className="space-y-4">
            <StatsSummary report={report} loading={reportLoading} error={reportError} />
            <AnalystSummarySection
              aggregatedSummary={aggregatedReport?.llmSummary}
              individualReports={individualReports}
              showEmptyNotice={lastRunUsedLLM}
            />
          </div>
        </div>
        </CardContent>
      </Card>

      <EdgeSection
        title="Transiciones observadas"
        description="Métricas calculadas a partir de ejecución real o pruebas automatizadas."
        edges={observedEdges}
        emptyMessage="Aún no se han registrado transiciones para esta sesión."
      />

      <EdgeSection
        title="Transiciones fuera del diagrama"
        description="Rutas detectadas en la conversación pero ausentes en el Mermaid actual."
        edges={missingEdges}
        emptyMessage="No se encontraron divergencias con el diagrama." 
      />

      {includeUnobserved && (
        <EdgeSection
          title="Transiciones del diagrama sin observación"
          description="Rutas definidas en la configuración pero que no aparecieron en la sesión analizada."
          edges={unobservedEdges}
          emptyMessage="Todas las transiciones configuradas fueron ejecutadas en la sesión."
        />
      )}

      {report?.individualReports && report.individualReports.length > 0 && (
        <IndividualReportsSummary reports={report.individualReports} />
      )}
    </div>
  )
}

interface StatsSummaryProps {
  report: CalibrationReportResponse | null
  loading: boolean
  error: string | null
}

function StatsSummary({ report, loading, error }: StatsSummaryProps) {
  if (loading) {
    return (
      <Alert className="bg-white border-gray-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="text-black">Calculando discrepancias…</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    )
  }

  if (!report) {
    return (
      <Alert className="bg-white border-gray-200">
        <AlertDescription className="text-black">Selecciona una sesión para generar el reporte.</AlertDescription>
      </Alert>
    )
  }

  const { statistics } = report.aggregatedReport
  const observed = statistics.totalObserved
  const fromTests = statistics.bySource.test ?? 0
  const fromLive = statistics.bySource.live ?? 0
  const sessionCount = report.sessions.length

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <StatCard label="Transiciones registradas" value={observed} />
      <StatCard label="Generadas en pruebas" value={fromTests} />
      <StatCard label="Generadas en producción" value={fromLive} />
      <StatCard label="Sesiones incluidas" value={sessionCount} />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-black">{value}</p>
      </CardContent>
    </Card>
  )
}

interface AnalystSummarySectionProps {
  aggregatedSummary?: string | null
  individualReports?: IndividualReportEntries
  showEmptyNotice: boolean
}

function AnalystSummarySection({ aggregatedSummary, individualReports, showEmptyNotice }: AnalystSummarySectionProps) {
  const trimmedAggregated = aggregatedSummary?.trim() ?? ''
  const reportsWithSummary = (individualReports ?? [])
    .map(item => {
      const summary = item.report.llmSummary?.trim() ?? ''
      if (!summary) {
        return null
      }
      return {
        session: item.session,
        summary,
      }
    })
    .filter((entry): entry is { session: CalibrationSessionSummary; summary: string } => entry !== null)

  if (!trimmedAggregated && reportsWithSummary.length === 0) {
    if (!showEmptyNotice) {
      return null
    }
    return (
      <Alert className="bg-white border-gray-200 border-dashed">
        <AlertDescription className="text-black">
          <h4 className="mb-2 font-semibold text-black">Resumen del analista</h4>
        <p>OpenRouter no generó un resumen para esta ejecución.</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {trimmedAggregated && (
        <Card className="border-gray-200 bg-gray-50 border-dashed">
          <CardContent className="p-4">
            <h4 className="mb-2 font-semibold text-black">Resumen del analista</h4>
            <p className="whitespace-pre-wrap leading-relaxed text-black">{trimmedAggregated}</p>
          </CardContent>
        </Card>
      )}

      {reportsWithSummary.length > 0 && (
        <Card className="border-gray-200 bg-gray-50 border-dashed">
          <CardContent className="p-4">
            <h4 className="mb-2 font-semibold text-black">Resúmenes individuales</h4>
          <div className="space-y-3">
            {reportsWithSummary.map(item => (
                <Card
                key={item.session.sessionId}
                  className="border-gray-200 bg-white"
              >
                  <CardContent className="p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                  <span>Sesión: {item.session.sessionId}</span>
                  <span>Tenant: {item.session.tenantId}</span>
                </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-black">{item.summary}</p>
                  </CardContent>
                </Card>
            ))}
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface IndividualReportsSummaryProps {
  reports: IndividualReportEntries
}

function IndividualReportsSummary({ reports }: IndividualReportsSummaryProps) {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="bg-white">
        <CardTitle className="text-black">Resultados individuales</CardTitle>
        <CardDescription className="text-black">Detalle por sesión dentro del alcance seleccionado.</CardDescription>
      </CardHeader>
      <CardContent className="bg-white">
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <HeaderCell>Sesión</HeaderCell>
              <HeaderCell>Transiciones</HeaderCell>
              <HeaderCell>Fuera del diagrama</HeaderCell>
              <HeaderCell>Sin observar</HeaderCell>
              <HeaderCell>Última transición</HeaderCell>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
            {reports.map(item => {
              const observed = item.report.statistics.totalObserved
              const missing = item.report.missingFromChart.length
              const unobserved = item.report.unobservedChartTransitions.length
              const lastTransition = item.session.lastTransitionAt
                ? new Date(item.session.lastTransitionAt).toLocaleString()
                : 'n/d'
              return (
                  <tr key={item.session.sessionId} className="text-sm text-black">
                  <DataCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{item.session.sessionId}</span>
                        <span className="text-xs text-gray-600">{item.session.tenantId}</span>
                    </div>
                  </DataCell>
                  <DataCell>{observed}</DataCell>
                  <DataCell>{missing}</DataCell>
                  <DataCell>{unobserved}</DataCell>
                  <DataCell>{lastTransition}</DataCell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </CardContent>
    </Card>
  )
}

interface EdgeSectionProps {
  title: string
  description: string
  edges: FlowCalibrationReportEdge[]
  emptyMessage: string
}

function EdgeSection({ title, description, edges, emptyMessage }: EdgeSectionProps) {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="bg-white">
        <CardTitle className="text-black">{title}</CardTitle>
        <CardDescription className="text-black">{description}</CardDescription>
      </CardHeader>
      <CardContent className="bg-white">
      {edges.length === 0 ? (
          <Alert className="bg-gray-50 border-gray-200 border-dashed">
            <AlertDescription className="text-black">{emptyMessage}</AlertDescription>
          </Alert>
      ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <HeaderCell>Transición</HeaderCell>
                <HeaderCell>Intención</HeaderCell>
                <HeaderCell>Veces</HeaderCell>
                <HeaderCell>Origen</HeaderCell>
                <HeaderCell>Motivos</HeaderCell>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
              {edges.map(edge => (
                  <tr key={edge.key} className="text-sm text-black">
                  <DataCell className="font-medium">{edge.from} → {edge.to}</DataCell>
                  <DataCell>{edge.intent}</DataCell>
                  <DataCell>{edge.count}</DataCell>
                  <DataCell>{edge.sources.length ? edge.sources.join(', ') : 'n/d'}</DataCell>
                  <DataCell>{edge.reasons.length ? edge.reasons.join(', ') : 'n/d'}</DataCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </CardContent>
    </Card>
  )
}

function HeaderCell({ children }: { children: ReactNode }) {
  return <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</th>
}

function DataCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>
}

function sortEdges(edges: FlowCalibrationReportEdge[]): FlowCalibrationReportEdge[] {
  return [...edges].sort((a, b) => b.count - a.count)
}
