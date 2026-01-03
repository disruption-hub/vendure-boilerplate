"use client"

import { useMemo, useState } from 'react'

import { CommunicationComposer } from './CommunicationComposer'
import { CommunicationOverview } from './CommunicationOverview'
import { CommunicationSettingsPanel } from './CommunicationSettingsPanel'
import { CommunicationTemplatesManager } from './CommunicationTemplatesManager'
import { CommunicationTemplateStudio } from './CommunicationTemplateStudio'

type HubView = 'overview' | 'composer' | 'templates' | 'studio' | 'settings'

const NAV_GROUPS: Array<{
  title: string
  items: Array<{ id: HubView; label: string; description: string }>
}> = [
  {
    title: 'Paneles',
    items: [
      { id: 'overview', label: 'Resumen ejecutivo', description: 'Indicadores en tiempo real' },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { id: 'composer', label: 'Composer multi-canal', description: 'Envía mensajes inmediatos' },
      { id: 'templates', label: 'Plantillas y contenidos', description: 'Gestiona experiencias' },
      { id: 'studio', label: 'Template Studio', description: 'Arma layouts con componentes' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { id: 'settings', label: 'Conectores & credenciales', description: 'Canales y proveedores' },
    ],
  },
]

export function CommunicationHubPanel() {
  const [view, setView] = useState<HubView>('overview')

  const activeTitle = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const match = group.items.find(item => item.id === view)
      if (match) return match.label
    }
    return ''
  }, [view])

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
      <nav className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comunication Hub</h3>
        <p className="mt-1 text-sm text-slate-500">Orquesta canales unificados.</p>

        <div className="mt-4 space-y-4">
          {NAV_GROUPS.map(group => (
            <details key={group.title} className="group" open>
              <summary className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <span>{group.title}</span>
                <svg className="h-4 w-4 text-slate-400 transition group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <ul className="mt-2 space-y-1">
                {group.items.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => setView(item.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                        view === item.id
                          ? 'bg-indigo-50 font-semibold text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div>{item.label}</div>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </nav>

      <section className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">{activeTitle}</h2>
          <p className="text-sm text-slate-500">Gestiona tus canales omnicanal desde un único panel.</p>
        </header>

        {view === 'overview' && <CommunicationOverview />}
        {view === 'composer' && <CommunicationComposer />}
        {view === 'templates' && <CommunicationTemplatesManager />}
        {view === 'studio' && <CommunicationTemplateStudio />}
        {view === 'settings' && <CommunicationSettingsPanel />}
      </section>
    </div>
  )
}
