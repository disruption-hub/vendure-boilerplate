"use client"

import { memo, useMemo } from 'react'
import type { PanelPlugin } from '@/plugins/panel-plugin'

interface PanelHostProps<TContext> {
  plugins: PanelPlugin<TContext>[]
  activePluginId: string
  onChange: (id: string) => void
  context: TContext
}

function PanelHostComponent<TContext>({ plugins, activePluginId, onChange, context }: PanelHostProps<TContext>) {
  const activePlugin = useMemo(() => {
    const found = plugins.find(plugin => plugin.id === activePluginId) ?? plugins[0]
    console.log('[PanelHost] Plugins:', plugins.length, 'Active ID:', activePluginId, 'Found:', !!found)
    return found
  }, [plugins, activePluginId])

  if (!activePlugin) {
    console.warn('[PanelHost] No active plugin found, returning null')
    return null
  }

  if (!context) {
    console.warn('[PanelHost] Context is null/undefined, returning null')
    return null
  }

  const hasMultiplePlugins = plugins.length > 1

  return (
    <aside
      className="chatbot-panel hidden lg:flex lg:flex-col lg:overflow-hidden lg:flex-shrink-0"
      style={{
        width: '360px',
        minWidth: '360px',
        maxWidth: '360px',
        background: 'var(--chatbot-sidebar-topbar-bg)',
        borderLeft: '1px solid var(--chatbot-sidebar-border)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: 'var(--chatbot-sidebar-border)' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#f8fafc' }}>
          {activePlugin.title}
        </span>
        {activePlugin.badge ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: 'var(--chatbot-sidebar-pill-bg)',
              color: 'rgba(203, 213, 225, 0.95)',
            }}
          >
            {activePlugin.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5" style={{ minWidth: 0, width: '100%' }}>
        {hasMultiplePlugins ? (
          <div className="flex gap-2" style={{ width: '100%' }}>
            {plugins.map(plugin => (
              <button
                key={plugin.id}
                type="button"
                onClick={() => onChange(plugin.id)}
                className="flex-1 min-w-0 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 text-center"
                style={{
                  borderColor: 'var(--chatbot-sidebar-border)',
                  background: plugin.id === activePlugin.id ? 'var(--chatbot-sidebar-pill-bg)' : 'transparent',
                  color:
                    plugin.id === activePlugin.id
                      ? '#f8fafc'
                      : 'rgba(203, 213, 225, 0.95)',
                  boxShadow:
                    plugin.id === activePlugin.id ? '0 16px 32px -28px rgba(15,23,42,0.55)' : undefined,
                  flex: '1 1 0',
                  minWidth: 0,
                }}
              >
                <span className="truncate block">{plugin.label}</span>
              </button>
            ))}
          </div>
        ) : null}
        {(() => {
          try {
            const rendered = activePlugin.render(context)
            if (rendered === null || rendered === undefined) {
              console.warn('[PanelHost] Plugin render returned null/undefined')
              return <div className="text-sm text-gray-500">No content available</div>
            }
            return rendered
          } catch (error) {
            console.error('[PanelHost] Error rendering plugin:', error)
            return <div className="text-sm text-red-500">Error rendering panel</div>
          }
        })()}
      </div>
    </aside >
  )
}

export const PanelHost = memo(PanelHostComponent) as typeof PanelHostComponent
