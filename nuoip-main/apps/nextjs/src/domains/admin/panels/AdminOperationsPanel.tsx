"use client"

import { Suspense, lazy } from 'react'

import type { PanelPlugin } from '@/plugins/panel-plugin'

import type { AdminPanelContext } from './AdminOperationsPanelContent'

const AdminOperationsPanelContent = lazy(() => import('./AdminOperationsPanelContent'))

function AdminPanelFallback() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
    </div>
  )
}

export type { AdminPanelContext } from './AdminOperationsPanelContent'

export const adminPanelPlugin: PanelPlugin<{ admin: AdminPanelContext }> = {
  id: 'admin',
  label: 'Admin',
  title: 'Operaciones Administrativas',
  badge: 'Desktop',
  render: ({ admin }) => (
    <Suspense fallback={<AdminPanelFallback />}>
      <AdminOperationsPanelContent {...admin} />
    </Suspense>
  ),
}
