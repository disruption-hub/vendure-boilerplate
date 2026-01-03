import type { ReactNode } from 'react'

export interface PanelPlugin<TContext = unknown> {
  id: string
  label: string
  title: string
  badge?: string
  render: (context: TContext) => ReactNode
}
