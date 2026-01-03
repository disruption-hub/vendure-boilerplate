import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/stores'

type Stage = 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'customer'
type StageFilter = Stage | 'all'

interface DealRow {
  id: string
  company: string
  contact: string
  stage: Stage
  value: number
  probability: number
  owner: string
  lastContact: string
  nextStep: string
  ticketId?: string | null
}

interface TaskRow {
  id: string
  title: string
  owner: string
  dueDate: string
  relatedDeal: string
}

interface IntegrationRow {
  id: string
  title: string
  description: string
  cta: string
}

const CRM_STAGE_FILTERS: Array<{ id: StageFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'lead', label: 'Nuevos leads' },
  { id: 'qualification', label: 'Calificación' },
  { id: 'proposal', label: 'Propuesta' },
  { id: 'negotiation', label: 'Negociación' },
  { id: 'customer', label: 'Clientes activos' },
]

const CRM_STAGE_LABELS: Record<Stage, string> = {
  lead: 'Lead nuevo',
  qualification: 'Calificación',
  proposal: 'Propuesta enviada',
  negotiation: 'Negociación',
  customer: 'Cliente activo',
}

const PIPELINE_DEALS: DealRow[] = [
  {
    id: 'DL-1024',
    company: 'Clínica Andina',
    contact: 'María Zambrano',
    stage: 'qualification',
    value: 3200,
    probability: 0.6,
    owner: 'Rodolfo Espinoza',
    lastContact: '2025-10-29T15:30:00.000Z',
    nextStep: 'Enviar propuesta de soporte extendido',
    ticketId: 'SUP-548',
  },
  {
    id: 'DL-1032',
    company: 'Estudio Rivera & Asociados',
    contact: 'Gustavo Rivera',
    stage: 'proposal',
    value: 4700,
    probability: 0.45,
    owner: 'Valeria Torres',
    lastContact: '2025-10-31T19:10:00.000Z',
    nextStep: 'Revisar contrato con legal',
    ticketId: null,
  },
  {
    id: 'DL-1048',
    company: 'MatMax Wellness',
    contact: 'Fiorella Paredes',
    stage: 'negotiation',
    value: 5900,
    probability: 0.72,
    owner: 'Andrea Cabrera',
    lastContact: '2025-11-01T16:45:00.000Z',
    nextStep: 'Agendar demostración con soporte',
    ticketId: 'SUP-612',
  },
  {
    id: 'DL-1054',
    company: 'ConstruTech Latam',
    contact: 'Luis Salazar',
    stage: 'lead',
    value: 2100,
    probability: 0.25,
    owner: 'Equipo SDR',
    lastContact: '2025-10-30T13:00:00.000Z',
    nextStep: 'Contactar por teléfono y confirmar uso del chatbot',
    ticketId: null,
  },
  {
    id: 'DL-1059',
    company: 'Retail Smart Perú',
    contact: 'Natalia Bustos',
    stage: 'customer',
    value: 6500,
    probability: 0.9,
    owner: 'Carla Gutiérrez',
    lastContact: '2025-10-27T09:20:00.000Z',
    nextStep: 'Configurar onboarding especializado',
    ticketId: 'SUP-630',
  },
]

const CRM_TASKS: TaskRow[] = [
  {
    id: 'task-1',
    title: 'Programar demo con MatMax Wellness',
    owner: 'Andrea Cabrera',
    dueDate: '2025-11-03',
    relatedDeal: 'DL-1048',
  },
  {
    id: 'task-2',
    title: 'Confirmar requerimientos legales con Estudio Rivera',
    owner: 'Valeria Torres',
    dueDate: '2025-11-04',
    relatedDeal: 'DL-1032',
  },
  {
    id: 'task-3',
    title: 'Asignar consultor para Clínica Andina',
    owner: 'Rodolfo Espinoza',
    dueDate: '2025-11-05',
    relatedDeal: 'DL-1024',
  },
]

const CRM_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'integration-support',
    title: 'Sincronizar con HelpDesk',
    description: 'Empuja los tickets activos al módulo de soporte para seguimiento 24/7.',
    cta: 'Sincronizar soporte',
  },
  {
    id: 'integration-calendar',
    title: 'Calendario de asesores',
    description: 'Reserva automáticamente una reunión con el ejecutivo asignado.',
    cta: 'Agendar disponibilidad',
  },
  {
    id: 'integration-payments',
    title: 'Activar recordatorios de cobro',
    description: 'Genera enlaces de pago recurrentes para clientes en seguimiento.',
    cta: 'Configurar recordatorios',
  },
]

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' })

const formatCurrency = (value: number): string => currencyFormatter.format(value)

const formatDate = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : dateFormatter.format(date)
}

export function CRMManagementSection() {
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

  const filteredDeals = useMemo(() => {
    if (stageFilter === 'all') {
      return PIPELINE_DEALS
    }
    return PIPELINE_DEALS.filter(deal => deal.stage === stageFilter)
  }, [stageFilter])

  const metrics = useMemo(() => {
    const relevantDeals = stageFilter === 'all' ? PIPELINE_DEALS : filteredDeals
    const pipelineValue = relevantDeals.reduce((sum, deal) => sum + deal.value, 0)
    const warmLeads = relevantDeals.filter(deal => deal.stage === 'lead' || deal.stage === 'qualification').length
    const tickets = relevantDeals.filter(deal => Boolean(deal.ticketId)).length

    return {
      pipelineValue,
      warmLeads,
      tickets,
    }
  }, [filteredDeals, stageFilter])

  const handleSyncCrm = () => {
    toast.success('CRM sincronizado', 'Actualizamos la bandeja con la última actividad del chatbot.')
  }

  const handleSendToSupport = (dealId: string) => {
    toast.success('Ticket escalado', `El negocio ${dealId} fue enviado al equipo de soporte.`)
  }

  const handleScheduleMeeting = (company: string) => {
    toast.success('Seguimiento programado', `Se agendó un recordatorio para contactar a ${company}.`)
  }

  const handleCompleteTask = (taskId: string) => {
    toast.success('Tarea completada', `Marcaste como completada la tarea ${taskId}.`)
  }

  const handleIntegration = (integrationId: string) => {
    toast.success('Integración iniciada', `Procesaremos la acción ${integrationId} en segundo plano.`)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg admin-card p-5">
          <p className="text-sm text-[color:var(--admin-card-muted-text)]">Valor del pipeline</p>
          <p className="mt-2 text-3xl font-semibold text-[color:var(--admin-card-header-text)]">
            {formatCurrency(metrics.pipelineValue)}
          </p>
          <span className="text-xs text-[color:var(--admin-card-muted-text)]">Filtrado por etapa seleccionada</span>
        </div>
        <div className="rounded-lg admin-card p-5">
          <p className="text-sm text-[color:var(--admin-card-muted-text)]">Leads en calor</p>
          <p className="mt-2 text-3xl font-semibold text-[color:var(--admin-card-header-text)]">
            {metrics.warmLeads}
          </p>
          <span className="text-xs text-[color:var(--admin-card-muted-text)]">En fase de lead o calificación</span>
        </div>
        <div className="rounded-lg admin-card p-5">
          <p className="text-sm text-[color:var(--admin-card-muted-text)]">Tickets vinculados</p>
          <p className="mt-2 text-3xl font-semibold text-[color:var(--admin-card-header-text)]">
            {metrics.tickets}
          </p>
          <span className="text-xs text-[color:var(--admin-card-muted-text)]">Casos activos desde el chatbot</span>
        </div>
      </div>

      <div className="rounded-lg admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--admin-card-header-text)]">
              Negocios en curso
            </h3>
            <p className="text-sm text-[color:var(--admin-card-muted-text)]">
              Gestiona leads creados por el chatbot, asigna tickets y coordina seguimientos comerciales.
            </p>
          </div>
          <Button variant="outline" onClick={handleSyncCrm} className="rounded-full px-5">
            Sincronizar CRM
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CRM_STAGE_FILTERS.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStageFilter(option.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--admin-navigation-active-indicator)] focus-visible:ring-offset-[color:var(--admin-card-background)]',
                stageFilter === option.id
                  ? 'bg-[color:var(--admin-navigation-active-background)] text-[color:var(--admin-navigation-active-text)] shadow-sm'
                  : 'bg-[color:var(--admin-surface-alt)] text-[color:var(--admin-card-muted-text)] hover:text-[color:var(--admin-navigation-active-text)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)]">
          <table className="min-w-full divide-y divide-[color:var(--admin-border-muted)]">
            <thead className="bg-[color:var(--admin-surface)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-card-muted-text)]">
                  Negocio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-card-muted-text)]">
                  Etapa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-card-muted-text)]">
                  Responsable
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-card-muted-text)]">
                  Último contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-card-muted-text)]">
                  Próximo paso
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-card-muted-text)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--admin-border-muted)]">
              {filteredDeals.map(deal => (
                <tr key={deal.id} className="bg-[color:var(--admin-card-background)]">
                  <td className="px-4 py-3 text-sm text-[color:var(--admin-card-header-text)]">
                    <div className="font-semibold">{deal.company}</div>
                    <div className="text-xs text-[color:var(--admin-card-muted-text)]">{deal.contact}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      variant="outline"
                      className="border-transparent bg-[color:var(--admin-navigation-active-background)]/25 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--admin-navigation-active-text)]"
                    >
                      {CRM_STAGE_LABELS[deal.stage]}
                    </Badge>
                    <div className="mt-1 text-xs text-[color:var(--admin-card-muted-text)]">
                      Probabilidad {Math.round(deal.probability * 100)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[color:var(--admin-card-header-text)]">
                    <div className="font-semibold">{deal.owner}</div>
                    {deal.ticketId ? (
                      <div className="text-xs text-[color:var(--admin-card-muted-text)]">Ticket {deal.ticketId}</div>
                    ) : (
                      <div className="text-xs text-[color:var(--admin-card-muted-text)]">Sin ticket activo</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[color:var(--admin-card-header-text)]">
                    <div>{formatDate(deal.lastContact)}</div>
                    <div className="text-xs text-[color:var(--admin-card-muted-text)]">Valor {formatCurrency(deal.value)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[color:var(--admin-card-muted-text)]">
                    {deal.nextStep}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendToSupport(deal.id)}
                        className="h-8 rounded-full px-3 text-xs font-semibold"
                      >
                        Escalar ticket
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScheduleMeeting(deal.company)}
                        className="h-8 rounded-full px-3 text-xs font-semibold"
                      >
                        Agendar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg admin-card p-6">
          <h3 className="text-lg font-semibold text-[color:var(--admin-card-header-text)]">Próximas acciones</h3>
          <p className="text-sm text-[color:var(--admin-card-muted-text)]">
            Controla las tareas coordinadas entre el chatbot y el equipo comercial.
          </p>
          <ul className="mt-4 space-y-3">
            {CRM_TASKS.map(task => (
              <li
                key={task.id}
                className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--admin-card-header-text)]">{task.title}</p>
                    <p className="text-xs text-[color:var(--admin-card-muted-text)]">
                      Responsable {task.owner} · Vence {formatDate(task.dueDate)}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--admin-card-muted-text)]">Relacionado: {task.relatedDeal}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteTask(task.id)}
                    className="h-8 rounded-full px-3 text-xs font-semibold"
                  >
                    Completar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg admin-card p-6">
          <h3 className="text-lg font-semibold text-[color:var(--admin-card-header-text)]">Integraciones rápidas</h3>
          <p className="text-sm text-[color:var(--admin-card-muted-text)]">
            Activa herramientas adicionales para sincronizar soporte, pagos y agendamientos.
          </p>
          <div className="mt-4 space-y-3">
            {CRM_INTEGRATIONS.map(integration => (
              <div
                key={integration.id}
                className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-4 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--admin-card-header-text)]">{integration.title}</p>
                    <p className="text-xs text-[color:var(--admin-card-muted-text)]">{integration.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIntegration(integration.id)}
                    className="h-8 rounded-full px-3 text-xs font-semibold"
                  >
                    {integration.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
