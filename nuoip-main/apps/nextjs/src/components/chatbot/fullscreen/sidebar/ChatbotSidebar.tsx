import { memo, useState, useEffect } from 'react'
import { CirclePlus, MoreVertical, Search } from 'lucide-react'

import { FlowBotIcon } from '@/components/ui/FlowBotIcon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import type { SidebarEntry } from '@/components/chatbot/types'

interface ChatbotSidebarProps {
  entries: SidebarEntry[]
  filteredEntries: SidebarEntry[] | null | undefined
  activeEntry: SidebarEntry
  flowbotEntry: SidebarEntry
  loading: boolean
  query: string
  onQueryChange: (value: string) => void
  onSelectContact: (contactId: string) => void
  onOpenSettings: () => void
  formatLastActivity: (date?: Date) => string
  className?: string // Allow custom className for mobile usage
}

function resolveInitials(name: string | undefined): string {
  if (!name) {
    return 'XX'
  }
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) {
    return 'XX'
  }
  return parts
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .padEnd(2, 'X')
}

function SessionStatusBadge({ startTime }: { startTime: Date | string }) {
  const [isOverLimit, setIsOverLimit] = useState(false)

  useEffect(() => {
    if (!startTime) return

    const start = new Date(startTime).getTime()
    const LIMIT = 3 * 60 * 1000 // 3 minutes

    const check = () => {
      const now = Date.now()
      setIsOverLimit(now - start > LIMIT)
    }

    check() // Initial check
    const interval = setInterval(check, 10000) // Check every 10s is enough
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <span
      className={cn(
        "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
        isOverLimit
          ? "border-red-600 bg-red-600 text-white"
          : "border-red-500 bg-red-500 text-white"
      )}
    >
      Abierto
    </span>
  )
}

export const ChatbotSidebar = memo(function ChatbotSidebar({
  entries,
  filteredEntries,
  activeEntry,
  flowbotEntry,
  loading,
  query,
  onQueryChange,
  onSelectContact,
  onOpenSettings,
  formatLastActivity,
  className,
}: ChatbotSidebarProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'whatsapp'>('all')

  const listEntries = (filteredEntries ?? entries).filter(entry => {
    // Always include FlowBot in all tabs
    if (entry.isFlowbot) return true

    // Apply tab filtering only to non-FlowBot contacts
    if (activeTab === 'all') return true
    if (activeTab === 'users') return entry.type === 'TENANT_USER'
    if (activeTab === 'whatsapp') return entry.type !== 'TENANT_USER'
    return true
  })

  return (
    <aside className={cn('chatbot-sidebar flex w-full flex-col', className ?? 'hidden md:flex md:w-[360px]')}>
      <div className="chatbot-sidebar-topbar flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="chatbot-sidebar-avatar h-10 w-10 shrink-0 rounded-full">
            <AvatarImage src={flowbotEntry.avatarUrl ?? undefined} alt="FlowBot" />
            <AvatarFallback
              className="flex items-center justify-center rounded-full text-sm font-semibold"
              style={{ color: 'var(--chat-sidebar-accent)' }}
            >
              <FlowBotIcon variant="glyph" size={28} style={{ color: 'var(--chat-sidebar-accent)' }} />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold" style={{ color: '#f8fafc' }}>FlowBot Workspace</span>
            <span className="chatbot-sidebar-secondary text-xs" style={{ color: 'rgba(203, 213, 225, 0.95)' }}>
              {loading ? 'Sincronizando…' : `${entries.length} chats`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectContact(flowbotEntry.id)}
            className="chatbot-sidebar-pill inline-flex h-9 w-9 items-center justify-center rounded-full shadow"
            aria-label="Iniciar chat con FlowBot"
          >
            <CirclePlus className="h-4 w-4" style={{ color: 'inherit' }} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="chatbot-sidebar-pill-secondary inline-flex h-9 w-9 items-center justify-center rounded-full shadow"
            aria-label="Abrir configuración"
          >
            <MoreVertical className="h-4 w-4" style={{ color: 'inherit' }} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="chatbot-sidebar-search px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'rgba(203, 213, 225, 0.95)' }}
          />
          <input
            type="search"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder="Buscar o iniciar un chat"
            aria-label="Buscar chats"
            className="chatbot-sidebar-search-input h-9 w-full rounded-full px-4 pl-9 text-sm outline-none"
          />
        </div>
      </div>
      <div className="chatbot-sidebar-list flex-1 overflow-y-auto px-3 pb-4">
        {loading && listEntries.length === 0 ? (
          <div
            className="mt-6 rounded-2xl px-4 py-6 text-center text-sm shadow-sm"
            style={{
              background: 'var(--chat-sidebar-hover)',
              color: 'rgba(203, 213, 225, 0.95)',
            }}
          >
            Cargando chats…
          </div>
        ) : listEntries.length ? (
          <div className="space-y-1.5">
            {listEntries
              .filter(entry => entry && entry.id && entry.name)
              .map(entry => {
                if (!entry || !entry.id || !entry.name) {
                  return null
                }
                const isActive = entry.id === activeEntry.id

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectContact(entry.id)}
                    className={cn(
                      'chatbot-sidebar-item flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left active:scale-95 transition-transform',
                      isActive && 'is-active',
                    )}
                  >
                    <Avatar className="chatbot-sidebar-avatar h-11 w-11 shrink-0 rounded-full">
                      {entry.avatarUrl ? (
                        <AvatarImage src={entry.avatarUrl} alt={entry.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback
                        className="flex items-center justify-center rounded-full text-sm font-semibold"
                        style={{
                          color: entry.isFlowbot
                            ? 'var(--chat-sidebar-accent)'
                            : '#f8fafc',
                        }}
                      >
                        {entry.isFlowbot ? (
                          <FlowBotIcon variant="glyph" size={24} style={{ color: 'var(--chat-sidebar-accent)' }} />
                        ) : (
                          resolveInitials(entry.name)
                        )}
                      </AvatarFallback>
                      {entry.isOnline && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#111b21]" />
                      )}
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-semibold",
                            isActive ? "text-[length:inherit] !text-[var(--chat-sidebar-text-active)]" : "!text-[var(--chat-sidebar-text)]"
                          )}
                        >
                          {entry.name}
                        </span>
                        {entry.sessionStatus === 'open' && entry.sessionStartTime && (
                          <SessionStatusBadge startTime={entry.sessionStartTime} />
                        )}
                        {entry.lastActivity ? (
                          <div className="flex flex-col items-end gap-0.5 ml-auto shrink-0">
                            <span
                              className={cn(
                                "text-xs",
                                isActive ? "!text-[var(--chat-sidebar-time-active)]" : "!text-[var(--chat-sidebar-time)]"
                              )}
                            >
                              {formatLastActivity(entry.lastActivity)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={cn(
                            "chatbot-sidebar-secondary flex-1 truncate text-xs",
                            isActive ? "!text-[var(--chat-sidebar-preview-active)]" : "!text-[var(--chat-sidebar-preview)]"
                          )}
                        >
                          {entry.lastMessage || 'Sin mensajes todavía'}
                        </span>
                        {entry.assignee ? (
                          <div
                            className="flex shrink-0 items-center justify-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                            title={`Asignado a: ${entry.assignee.name}`}
                          >
                            {resolveInitials(entry.assignee.name)}
                          </div>
                        ) : null}
                        {entry.unreadCount && entry.unreadCount > 0 ? (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                            {entry.unreadCount > 99 ? '99+' : entry.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })
              .filter(Boolean)}
          </div>
        ) : (
          <div
            className="mt-6 rounded-2xl px-4 py-6 text-center text-sm shadow-sm"
            style={{
              background: 'var(--chat-sidebar-hover)',
              color: 'rgba(203, 213, 225, 0.95)',
            }}
          >
            No encontramos conversaciones con ese criterio.
          </div>
        )}
      </div>
    </aside>
  )
})
