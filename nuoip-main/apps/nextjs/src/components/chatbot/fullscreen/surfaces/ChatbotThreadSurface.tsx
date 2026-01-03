'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ChatbotThreadSurfaceProps {
  children: React.ReactNode
  className?: string
}

export function ChatbotThreadSurface({ children, className }: ChatbotThreadSurfaceProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full',
        // FlowBot specific styling
        'chatbot-thread-surface',
        className
      )}
      style={{
        background: 'var(--chatbot-thread-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%))',
      }}
    >
      {/* Background pattern for FlowBot */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 2px, transparent 2px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}




