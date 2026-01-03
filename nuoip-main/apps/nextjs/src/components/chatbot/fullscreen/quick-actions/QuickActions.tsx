'use client'

import React from 'react'
import type { ChatQuickAction } from '@/components/chatbot/types'

interface QuickActionsProps {
  actions: ChatQuickAction[]
  onActionClick: (action: ChatQuickAction) => void
  className?: string
}

export function QuickActions({ actions, onActionClick, className }: QuickActionsProps) {
  if (!actions || actions.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onActionClick(action)}
          className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
  