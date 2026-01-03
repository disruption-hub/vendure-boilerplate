"use client"

import { Megaphone, MessageCircle, Palette, Settings } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface CommunicationsBroadcastSummary {
  id: string
  title: string
  channel: string
  timestampLabel: string
  statusLabel?: string
}

export interface CommunicationsPanelContext {
  unreadCount: number
  recentBroadcasts: CommunicationsBroadcastSummary[]
  onOpenComposer: () => void
  onOpenTemplates: () => void
  onOpenStudio: () => void
  onOpenSettings: () => void
}

export default function CommunicationsPanelContent({
  unreadCount,
  recentBroadcasts,
  onOpenComposer,
  onOpenTemplates,
  onOpenStudio,
  onOpenSettings,
}: CommunicationsPanelContext) {
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
              Centro omnicanal
            </p>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
              Communication Hub
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
              Gestiona campañas y plantillas para email, SMS y WhatsApp.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg">
            <Megaphone className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <Badge variant="outline" className="border-transparent bg-white/10 text-white/90">
            {unreadCount > 0 ? `${unreadCount} pendientes` : 'Sin campañas pendientes'}
          </Badge>
          <span style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
            Sincroniza clientes antes de enviar campañas masivas.
          </span>
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
          <MessageCircle className="h-4 w-4" />
          Últimas campañas
        </h4>
        {recentBroadcasts.length === 0 ? (
          <p className="mt-3 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
            Aún no hay campañas recientes. Usa el composer para programar una nueva difusión.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {recentBroadcasts.map(broadcast => (
              <li key={broadcast.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                      {broadcast.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                      {broadcast.channel}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                    {broadcast.timestampLabel}
                  </span>
                </div>
                {broadcast.statusLabel ? (
                  <div className="mt-2 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                    {broadcast.statusLabel}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'var(--chatbot-sidebar-border)',
        }}
      >
        <h4 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
          Accesos directos
        </h4>
        <div className="mt-3 space-y-2">
          <Button
            type="button"
            onClick={onOpenComposer}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Abrir composer multicanal
            <Megaphone className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onOpenTemplates}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Gestionar plantillas
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onOpenStudio}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Abrir Template Studio
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={onOpenSettings}
            className="w-full justify-between rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
          >
            Conectores & credenciales
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
