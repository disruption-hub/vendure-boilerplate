'use client'

import React from 'react'
import { useToastStore } from '@/stores'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-green-50 border-green-300 text-black',
  error: 'bg-red-50 border-red-300 text-black',
  warning: 'bg-amber-50 border-amber-300 text-black',
  info: 'bg-blue-50 border-blue-300 text-black',
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        const colorClass = colors[toast.type]

        return (
          <div
            key={toast.id}
            className={`${colorClass} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-5 fade-in-0`}
          >
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5 text-black" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-black">{toast.title}</div>
              {toast.description && (
                <div className="text-sm mt-1 text-black">{toast.description}</div>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 text-xs font-medium text-black underline hover:no-underline hover:text-black"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-black hover:text-black transition-opacity"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

