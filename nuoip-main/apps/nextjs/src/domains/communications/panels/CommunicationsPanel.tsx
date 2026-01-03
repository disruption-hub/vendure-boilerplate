"use client"

import { Suspense, lazy } from 'react'

import type { PanelPlugin } from '@/plugins/panel-plugin'

import type { CommunicationsPanelContext } from './CommunicationsPanelContent'

const CommunicationsPanelContent = lazy(() => import('./CommunicationsPanelContent'))

function CommunicationsPanelFallback() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
    </div>
  )
}

export type { CommunicationsBroadcastSummary, CommunicationsPanelContext } from './CommunicationsPanelContent'

export const communicationsPanelPlugin: PanelPlugin<{ communications: CommunicationsPanelContext }> = {
  id: 'communications',
  label: 'Comunicaciones',
  title: 'Communication Hub',
  badge: 'Desktop',
  render: ({ communications }) => (
    <Suspense fallback={<CommunicationsPanelFallback />}>
      <CommunicationsPanelContent {...communications} />
    </Suspense>
  ),
}
