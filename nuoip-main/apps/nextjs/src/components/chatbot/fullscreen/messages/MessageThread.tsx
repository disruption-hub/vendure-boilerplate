'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Message, ChatQuickAction } from '@/components/chatbot/types'
import { renderMessageContent } from '@/lib/chatbot/utils/rich-message-renderer'
import { ClientMemoryService } from '@/lib/ai/memory/client-memory-service'
import { formatPaymentNotificationContent } from '@/hooks/usePaymentNotificationMessages'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle, Reply, Copy, Trash2, ChevronDown } from 'lucide-react'
import { AttachmentsList } from '@/components/chat/AttachmentRenderer'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createChatbotTelemetry } from '@/lib/chatbot/telemetry'

import type { ChatContactLite } from '@/components/chatbot/types'

// Format time label helper function
function formatTimeLabel(date?: Date, locale: string = 'es-PE'): string {
  if (!date) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch (error) {
    console.warn('MessageThread: failed to format time label', error)
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }
}

interface MessageThreadProps {
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  onMessageInfo: (message: Message) => void
  activeContact: ChatContactLite
  onReply?: (message: Message) => void
  onDelete?: (message: Message) => void
  initialScrollTop?: number
  onScrollChange?: (scrollTop: number) => void
  onQuickAction?: (action: ChatQuickAction) => void
  bottomPadding?: number
  onScheduledMessageClick?: (message: Message) => void
}

export function MessageThread({
  messages,
  isLoading,
  isStreaming,
  onMessageInfo,
  activeContact,
  onReply,
  onDelete,
  initialScrollTop,
  onScrollChange,
  onQuickAction,
  bottomPadding,
  onScheduledMessageClick,
}: MessageThreadProps) {
  console.log('🖼️ [MessageThread] Rendering', {
    messageCount: messages.length,
    activeContactId: activeContact?.id,
    lastMessageId: messages[messages.length - 1]?.id,
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false)
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [actionsOpen, setActionsOpen] = useState<boolean>(false)
  const lastMessageIdRef = useRef<string | null>(null)
  const telemetry = createChatbotTelemetry(activeContact?.id ?? 'mobile-chat')

  // Group messages by day for date separators
  const MAX_VISIBLE = 200
  const [showAll, setShowAll] = useState(false)
  const visibleMessages = useMemo(() => {
    if (showAll) return messages
    const start = Math.max(0, messages.length - MAX_VISIBLE)
    return messages.slice(start)
  }, [messages, showAll])

  const sections = useMemo(() => {
    const byDay = new Map<string, Message[]>()
    const formatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })

    for (const msg of visibleMessages) {
      const key = formatter.format(new Date(msg.timestamp))
      const bucket = byDay.get(key)
      if (bucket) {
        bucket.push(msg)
      } else {
        byDay.set(key, [msg])
      }
    }

    return Array.from(byDay.entries()).map(([dateLabel, items]) => ({ dateLabel, items }))
  }, [visibleMessages])

  // First unread assistant message id for inline separator
  const firstUnreadId = useMemo(() => {
    const idx = messages.findIndex(m => m.role === 'assistant' && !m.readAt)
    return idx >= 0 ? messages[idx].id : null
  }, [messages])

  // Track scroll position to show the FAB when not at bottom
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollToBottom(distanceFromBottom > 200)
      if (onScrollChange) onScrollChange(el.scrollTop)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    // Initialize
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [onScrollChange])

  // Restore initial scroll position on mount or when it changes
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    if (typeof initialScrollTop === 'number' && initialScrollTop >= 0) {
      el.scrollTop = Math.min(initialScrollTop, el.scrollHeight)
    }
  }, [initialScrollTop])

  const scrollToBottom = () => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    telemetry.log('scroll_to_bottom')
  }

  const maybeStickToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  // Auto-scroll on new messages, prioritising mobile viewports.
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || messages.length === 0) {
      lastMessageIdRef.current = null
      return
    }

    const latestMessage = messages[messages.length - 1]
    const currentId = latestMessage?.id ?? null
    const previousId = lastMessageIdRef.current

    const isMobileViewport =
      typeof window !== 'undefined' ? window.matchMedia('(max-width: 1024px)').matches : false

    const hasNewMessage = currentId !== previousId
    if (!hasNewMessage) {
      return
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isNearBottom = distanceFromBottom < 200
    const shouldAutoScroll = isMobileViewport || isNearBottom || latestMessage.role === 'user'

    if (shouldAutoScroll) {
      maybeStickToBottom(previousId ? 'smooth' : 'auto')
    }

    lastMessageIdRef.current = currentId
  }, [messages])

  // Ensure the streaming indicator stays visible on mobile.
  useEffect(() => {
    if (!isStreaming) return
    const isMobileViewport =
      typeof window !== 'undefined' ? window.matchMedia('(max-width: 1024px)').matches : false
    if (isMobileViewport) {
      maybeStickToBottom('smooth')
    }
  }, [isStreaming])

  // Stick to bottom when the mobile keyboard opens (visual viewport shrinks)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const viewport = window.visualViewport
    if (!viewport) return

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null

    const handleViewportChange = () => {
      const el = scrollContainerRef.current
      if (!el) return

      const layoutHeight = window.innerHeight
      const visualHeight = viewport.height
      const heightDiff = layoutHeight - visualHeight
      const keyboardOpen = heightDiff > 100

      if (keyboardOpen) {
        // Clear any pending scroll
        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }

        // Wait for keyboard animation to complete, then scroll
        // Use multiple attempts to ensure scroll happens after viewport stabilizes
        const attemptScroll = (attempt = 0) => {
          if (attempt > 3) return // Max 3 attempts

          requestAnimationFrame(() => {
            const currentHeight = window.visualViewport?.height ?? visualHeight
            const currentDiff = window.innerHeight - currentHeight
            const stillOpen = currentDiff > 100

            if (stillOpen) {
              // Scroll immediately to keep message visible
              el.scrollTo({ top: el.scrollHeight, behavior: 'auto' })

              // Try again after a short delay to account for keyboard animation
              if (attempt < 3) {
                scrollTimeout = setTimeout(() => attemptScroll(attempt + 1), 100)
              }
            }
          })
        }

        attemptScroll()
      }
    }

    viewport.addEventListener('resize', handleViewportChange)
    viewport.addEventListener('scroll', handleViewportChange, { passive: true })

    // Also listen to focus events on input fields to catch keyboard opening
    const handleFocus = () => {
      setTimeout(() => {
        const el = scrollContainerRef.current
        if (el) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'auto' })
        }
      }, 300) // Wait for keyboard animation
    }

    // Listen for focus on any input/textarea in the document
    document.addEventListener('focusin', handleFocus)

    // Initial check
    handleViewportChange()

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      viewport.removeEventListener('resize', handleViewportChange)
      viewport.removeEventListener('scroll', handleViewportChange)
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500">Cargando mensajes...</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            No hay mensajes aún
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeContact?.name
              ? `Comienza una conversación con ${activeContact.name}`
              : 'Selecciona un contacto para comenzar a chatear'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pt-4 space-y-4 relative"
        style={
          typeof bottomPadding === 'number'
            ? {
              paddingBottom: `${bottomPadding}px`,
              scrollPaddingBottom: `${bottomPadding}px`,
            }
            : undefined
        }
      >
        {!showAll && messages.length > visibleMessages.length && (
          <div className="flex justify-center">
            <button
              type="button"
              className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => setShowAll(true)}
            >
              Cargar mensajes anteriores
            </button>
          </div>
        )}
        {sections.map(section => (
          <div key={section.dateLabel}>
            {/* Date Separator */}
            <div className="sticky top-2 z-10 mb-2 flex justify-center">
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {section.dateLabel}
              </span>
            </div>
            <div className="space-y-5 sm:space-y-6">
              {section.items.map((message) => {
                const isUser = message.role === 'user'
                const isTenantUserContact = activeContact?.type === 'tenant_user'
                const scheduledDate = message.scheduledFor ?? (message.scheduledForRaw ? new Date(message.scheduledForRaw) : null)

                // Show delivery status for ALL user messages (outgoing messages)
                // This applies to chatbot messages, WhatsApp outgoing messages, and tenant user outgoing messages
                const showDeliveryMeta = isUser
                const showTimestamp = !isUser // Show timestamp for incoming messages

                // Status determination
                let StatusIcon = null
                let statusLabel = null
                let iconClass = ''
                let labelClass = ''

                if (showDeliveryMeta) {
                  // User messages - show delivery status
                  if (message.deliveryStatus === 'scheduled' || message.status === 'scheduled') {
                    StatusIcon = Clock
                    statusLabel = scheduledDate
                      ? `Programado · ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Programado'
                    iconClass = 'text-amber-500'
                    labelClass = 'text-amber-600 dark:text-amber-400'
                  } else {
                    const normalizedStatus = message.status || message.deliveryStatus || (message.readAt ? 'read' : message.deliveredAt ? 'delivered' : 'sent')
                    if (normalizedStatus === 'sending') {
                      StatusIcon = Clock
                      statusLabel = 'Enviando...'
                      iconClass = 'text-blue-100 dark:text-blue-200'
                      labelClass = 'text-blue-100 dark:text-blue-200'
                    } else if (normalizedStatus === 'sent') {
                      StatusIcon = Check // Single check for sent
                      statusLabel = `Enviado · ${formatTimeLabel(message.timestamp)}`
                      iconClass = 'text-blue-100 dark:text-blue-200'
                      labelClass = 'text-blue-100 dark:text-blue-200'
                    } else if (normalizedStatus === 'delivered') {
                      StatusIcon = CheckCheck // Double check for delivered
                      statusLabel = `Entregado · ${formatTimeLabel(message.deliveredAt ?? message.timestamp)}`
                      iconClass = 'text-blue-100 dark:text-blue-200'
                      labelClass = 'text-blue-100 dark:text-blue-200'
                    } else if (normalizedStatus === 'read') {
                      StatusIcon = CheckCheck // Double check for read (blue)
                      statusLabel = `Leído · ${formatTimeLabel(message.readAt ?? message.timestamp)}`
                      iconClass = 'text-blue-300 dark:text-blue-400' // Brighter blue for read
                      labelClass = 'text-blue-100 dark:text-blue-200'
                    } else {
                      // Default: show sent status with time if no specific status
                      StatusIcon = Check
                      statusLabel = `Enviado · ${formatTimeLabel(message.timestamp)}`
                      iconClass = 'text-blue-100 dark:text-blue-200'
                      labelClass = 'text-blue-100 dark:text-blue-200'
                    }
                  }
                } else if (showTimestamp) {
                  // Incoming messages (assistant role) - just show timestamp
                  statusLabel = formatTimeLabel(message.timestamp)
                  labelClass = 'text-gray-500 dark:text-gray-400'
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex w-full mobile-slide-up',
                      isUser ? 'justify-end' : 'justify-start'
                    )}
                    onTouchStart={() => {
                      // Don't trigger long press for scheduled messages on click
                      if (message.deliveryStatus === 'scheduled' || message.status === 'scheduled') {
                        return
                      }
                      const timer = window.setTimeout(() => {
                        setSelectedMessage(message)
                        setActionsOpen(true)
                      }, 450)
                      setLongPressTimer(timer)
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer) window.clearTimeout(longPressTimer)
                      setLongPressTimer(null)
                      // Handle click for scheduled messages
                      if ((message.deliveryStatus === 'scheduled' || message.status === 'scheduled') && onScheduledMessageClick) {
                        onScheduledMessageClick(message)
                      }
                    }}
                    onTouchMove={() => {
                      if (longPressTimer) window.clearTimeout(longPressTimer)
                      setLongPressTimer(null)
                    }}
                    onMouseDown={(e) => {
                      // Only for primary button
                      if (e.button !== 0) return
                      // Don't trigger long press for scheduled messages on click
                      if (message.deliveryStatus === 'scheduled' || message.status === 'scheduled') {
                        return
                      }
                      const timer = window.setTimeout(() => {
                        setSelectedMessage(message)
                        setActionsOpen(true)
                      }, 500)
                      setLongPressTimer(timer)
                    }}
                    onMouseUp={() => {
                      if (longPressTimer) window.clearTimeout(longPressTimer)
                      setLongPressTimer(null)
                      // Handle click for scheduled messages
                      if ((message.deliveryStatus === 'scheduled' || message.status === 'scheduled') && onScheduledMessageClick) {
                        onScheduledMessageClick(message)
                      }
                    }}
                    onMouseLeave={() => {
                      if (longPressTimer) window.clearTimeout(longPressTimer)
                      setLongPressTimer(null)
                    }}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm chatbot-bubble',
                        isUser
                          ? 'chatbot-user-bubble'
                          : 'chatbot-assistant-bubble',
                        (message.deliveryStatus === 'scheduled' || message.status === 'scheduled') && 'cursor-pointer hover:opacity-90 transition-opacity',
                      )}
                      onClick={(e) => {
                        // Handle click for scheduled messages
                        if ((message.deliveryStatus === 'scheduled' || message.status === 'scheduled') && onScheduledMessageClick) {
                          e.stopPropagation()
                          onScheduledMessageClick(message)
                        }
                      }}
                    >
                      {/* Unread separator */}
                      {firstUnreadId && message.id === firstUnreadId && (
                        <div className="-mt-2 mb-2 flex items-center gap-2 text-center">
                          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
                          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Nuevos mensajes
                          </span>
                          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
                        </div>
                      )}
                      {/* Message Content */}
                      <div className="text-sm leading-relaxed">
                        {message.role === 'assistant' && message.type === 'payment_notification' && message.paymentNotification
                          ? formatPaymentNotificationContent(message.paymentNotification.payload, 'es-PE')
                          : renderMessageContent(message.content, message.id)}
                      </div>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3">
                          <AttachmentsList attachments={message.attachments} />
                        </div>
                      )}

                      {/* Quick Actions for FlowBot */}
                      {message.quickActions && message.quickActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.quickActions.map((action) => (
                            <button
                              key={`${message.id}-${action.action}`}
                              type="button"
                              className={cn(
                                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                isUser
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              )}
                              onClick={() => {
                                if (onQuickAction) {
                                  onQuickAction(action)
                                }
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message Status */}
                      {statusLabel && (
                        <div className={cn(
                          'mt-2 flex items-center gap-1.5 text-xs',
                          isUser ? 'justify-end' : 'justify-start'
                        )}>
                          {StatusIcon && (
                            <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', iconClass || 'text-gray-400 dark:text-gray-500')} />
                          )}
                          <span className={cn('shrink-0', labelClass || (isUser ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'))}>{statusLabel}</span>
                        </div>
                      )}

                      {/* Edited indicator */}
                      {message.editedAt && (
                        <div className="mt-1 text-xs opacity-70 italic">
                          editado
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* Message Actions Bottom Sheet */}
      <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
        <SheetContent
          side="bottom"
          title="Acciones del mensaje"
          aria-label="Acciones del mensaje"
          className="h-auto max-h-[50vh] bg-white dark:bg-slate-900"
        >
          <div className="flex flex-col gap-2 py-2">
            <div className="mb-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {selectedMessage?.role === 'user' ? 'Tu mensaje' : 'Mensaje recibido'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedMessage && onReply) onReply(selectedMessage)
                  setActionsOpen(false)
                }}
                className="flex items-center justify-center gap-2"
              >
                <Reply className="h-4 w-4" />
                Responder
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    if (selectedMessage?.content) {
                      await navigator.clipboard.writeText(selectedMessage.content)
                    }
                  } catch (err) {
                    // noop
                  }
                  setActionsOpen(false)
                }}
                className="flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedMessage && onDelete) onDelete(selectedMessage)
                  setActionsOpen(false)
                }}
                className="flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setActionsOpen(false)}
              className="mt-2"
            >
              Cancelar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

