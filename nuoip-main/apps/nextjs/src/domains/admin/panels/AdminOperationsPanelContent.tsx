"use client"

import { Building2, ChartBar, ChevronRight, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface AdminPanelContext {
  displayName: string
  roleLabel: string
  tenantLabel: string
  lastLoginLabel?: string | null
  hasAccess: boolean
  metrics: Array<{ label: string; value: string }>
  onOpenOverview: () => void
  onOpenCrm: () => void
  onOpenCommunications: () => void
  onOpenSettings: () => void
}

export default function AdminOperationsPanelContent({
  displayName,
  roleLabel,
  tenantLabel,
  lastLoginLabel,
  hasAccess,
  metrics,
  onOpenOverview,
  onOpenCrm,
  onOpenCommunications,
  onOpenSettings,
}: AdminPanelContext) {
  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-2xl border px-4 py-5 text-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderColor: 'var(--chatbot-sidebar-border)',
            color: 'var(--chatbot-sidebar-secondary)',
          }}
        >
          Necesitas permisos de administrador para acceder al panel interno. Solicita acceso a un supervisor.
        </div>
        <Button
          type="button"
          onClick={onOpenOverview}
          className="w-full justify-between rounded-full bg-slate-900 text-white hover:bg-slate-800"
        >
          Abrir panel de métricas
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section
        className="rounded-2xl border p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'var(--chatbot-sidebar-border)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
              Sesión administrativa
            </p>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
              {displayName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="border-transparent bg-white/10 text-white/90">
                {roleLabel}
              </Badge>
              <span style={{ color: 'var(--chatbot-sidebar-secondary)' }}>{tenantLabel}</span>
            </div>
            {lastLoginLabel ? (
              <p className="mt-2 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                Último acceso: {lastLoginLabel}
              </p>
            ) : null}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {metrics.map(metric => (
            <div key={metric.label} className="rounded-xl bg-white/5 p-3">
              <dt className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                {metric.label}
              </dt>
              <dd className="mt-1 text-base font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'var(--chatbot-sidebar-border)',
        }}
      >
        <h4 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
          <Building2 className="h-4 w-4" />
          Navegación rápida
        </h4>
        <div className="mt-3 space-y-2">
          <Button
            type="button"
            onClick={onOpenOverview}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Panel general
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onOpenCrm}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            CRM Hub
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onOpenCommunications}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Communication Hub
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onOpenSettings}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Configuración del sistema
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'var(--chatbot-sidebar-border)',
        }}
      >
        <h4 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
          <ChartBar className="h-4 w-4" />
          Consejos rápidos
        </h4>
        <ul className="mt-3 space-y-2 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          <li>• Cierra el chatbot para seguir en el panel administrativo.</li>
          <li>• Sincroniza clientes desde CRM antes de programar campañas.</li>
          <li>• Revisa las notificaciones de pago para evitar duplicados.</li>
        </ul>
      </section>
    </div>
  )
}
