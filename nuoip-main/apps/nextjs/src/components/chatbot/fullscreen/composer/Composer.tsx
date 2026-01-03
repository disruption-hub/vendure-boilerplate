'use client'

import React, { forwardRef, useImperativeHandle, useRef, KeyboardEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Paperclip, Loader2, CalendarClock, X } from 'lucide-react'
import { FileUpload } from '@/components/chat/FileUpload'
import { FileValidator } from '@/lib/utils/file-validator'
import { toast } from '@/stores'
import { cn } from '@/lib/utils'

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder: string
  disabled: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  selectedFiles: File[]
  setSelectedFiles: (files: File[]) => void
  isUploadingFiles: boolean
  className?: string
  onSchedule?: () => void
  scheduleLabel?: string
  scheduledAt?: Date | null
  onClearSchedule?: () => void
}

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(
  ({
    value,
    onChange,
    onKeyDown,
    placeholder,
    disabled,
    onSubmit,
    selectedFiles,
    setSelectedFiles,
    isUploadingFiles,
    className,
    onSchedule,
    scheduleLabel = 'Programar recordatorio',
    scheduledAt,
    onClearSchedule,
  }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => internalRef.current!, [])

    // Remove blue focus indicators on mount and when textarea is focused
    useEffect(() => {
      const textarea = internalRef.current
      const form = formRef.current
      const container = containerRef.current

      if (!textarea) return

      const removeFocusStyles = () => {
        // Remove from textarea
        if (textarea) {
          textarea.style.outline = 'none'
          textarea.style.outlineColor = 'transparent'
          textarea.style.outlineWidth = '0'
          textarea.style.outlineOffset = '0'
          textarea.style.border = 'none'
          textarea.style.borderColor = 'transparent'
          textarea.style.boxShadow = 'none'
          textarea.setAttribute('data-focus-ring', 'false')
        }

        // Remove from form
        if (form) {
          form.style.outline = 'none'
          form.style.outlineColor = 'transparent'
          form.style.outlineWidth = '0'
          form.style.border = 'none'
          form.style.boxShadow = 'none'
        }

        // Remove from container
        if (container) {
          container.style.outline = 'none'
          container.style.outlineColor = 'transparent'
          container.style.outlineWidth = '0'
          container.style.borderColor = 'rgba(0, 0, 0, 0.15)'
        }
      }

      const handleFocus = () => {
        removeFocusStyles()
        // Use requestAnimationFrame to ensure styles are applied after browser default
        requestAnimationFrame(() => {
          removeFocusStyles()
        })
      }

      const handleFocusIn = (e: FocusEvent) => {
        removeFocusStyles()
        requestAnimationFrame(() => {
          removeFocusStyles()
        })
      }

      textarea.addEventListener('focus', handleFocus)
      textarea.addEventListener('focusin', handleFocusIn)
      form?.addEventListener('focusin', handleFocusIn)
      container?.addEventListener('focusin', handleFocusIn)

      // Initial removal
      removeFocusStyles()

      return () => {
        textarea.removeEventListener('focus', handleFocus)
        textarea.removeEventListener('focusin', handleFocusIn)
        form?.removeEventListener('focusin', handleFocusIn)
        container?.removeEventListener('focusin', handleFocusIn)
      }
    }, [])

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        const fileArray = Array.from(files)
        const validation = FileValidator.validateFiles(fileArray)
        if (validation.valid) {
          setSelectedFiles(fileArray)
        } else {
          toast.error('Error al seleccionar archivos', validation.error || 'Archivos inválidos')
        }
      }
      // Reset input
      event.target.value = ''
    }

    const openFilePicker = () => {
      if (isUploadingFiles) {
        return
      }
      fileInputRef.current?.click()
    }

    const handleSchedule = () => {
      if (!onSchedule) return
      onSchedule()
    }

    const handleClearSchedule = () => {
      if (onClearSchedule) {
        onClearSchedule()
      }
    }

    const isSendDisabled = isUploadingFiles || (value.trim().length === 0 && selectedFiles.length === 0)

    const formatScheduledTime = (date: Date) => {
      const now = new Date()
      const diffMs = date.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 60) {
        return `en ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
      } else if (diffHours < 24) {
        return `en ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
      } else if (diffDays < 7) {
        return `en ${diffDays} día${diffDays !== 1 ? 's' : ''}`
      } else {
        return date.toLocaleString('es-PE', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    }

    return (
      <div className={cn('w-full', className)}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        {/* Scheduled Message Indicator */}
        {scheduledAt && (
          <div className="mb-2 px-4">
            <div className="flex items-center gap-2 rounded-lg bg-amber-600 border border-amber-700 px-3 py-2 dark:bg-amber-950/80 dark:border-amber-800">
              <CalendarClock className="h-4 w-4 text-white dark:text-white shrink-0" />
              <span className="flex-1 text-xs font-semibold text-white dark:text-white">
                Mensaje programado para {formatScheduledTime(scheduledAt)}
              </span>
              {onSchedule && (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  className="shrink-0 p-1 rounded-full hover:bg-amber-700 dark:hover:bg-amber-900/50 transition-colors"
                  aria-label="Cancelar programación"
                >
                  <X className="h-3.5 w-3.5 text-white dark:text-white" />
                </button>
              )}
            </div>
          </div>
        )}
        {/* File Upload Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-2 px-4">
            <FileUpload
              onFilesSelected={setSelectedFiles}
              onFilesCleared={() => setSelectedFiles([])}
              selectedFiles={selectedFiles}
              disabled={isUploadingFiles}
            />
          </div>
        )}

        {/* Composer Form */}
        <form 
          ref={formRef}
          onSubmit={onSubmit} 
          className="px-4 focus-within:outline-none focus-within:ring-0" 
          name="chat-message-form"
          style={{
            outline: 'none',
            outlineColor: 'transparent',
            outlineWidth: 0,
            outlineOffset: 0,
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = 'none'
            e.currentTarget.style.outlineColor = 'transparent'
            e.currentTarget.style.border = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div
            ref={containerRef}
            className={cn(
              'chatbot-composer flex w-full items-end gap-2 rounded-[28px] border border-transparent bg-white/95 px-3 py-2 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.75)] backdrop-blur-sm transition-all focus-within:ring-0 focus-within:border-transparent focus-within:outline-none dark:bg-slate-900/85 sm:px-4 sm:py-3',
              disabled && 'ring-1 ring-inset ring-slate-200 dark:ring-slate-700',
            )}
            style={{
              outline: 'none',
              outlineColor: 'transparent',
              outlineWidth: 0,
              outlineOffset: 0,
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none'
              e.currentTarget.style.outlineColor = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'
              e.currentTarget.style.boxShadow = '0 14px 32px -24px rgba(15,23,42,0.75)'
            }}
          >
            {/* File Attachment Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'h-11 w-11 shrink-0 rounded-full text-slate-500 transition hover:text-slate-900 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none dark:text-slate-300 dark:hover:text-white',
                selectedFiles.length > 0 && 'text-blue-500',
              )}
              onClick={openFilePicker}
              disabled={isUploadingFiles}
              aria-label="Adjuntar archivos"
              title="Adjuntar archivos"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            {/* Text Input */}
            <div className="relative flex-1">
              <textarea
                ref={internalRef}
                value={value}
                onChange={(e) => {
                  // Use onChange for React state management
                  onChange(e.target.value)
                }}
                onInput={(e) => {
                  // Handle both height adjustment and ensure autocomplete works
                  const target = e.currentTarget
                  target.style.height = 'auto'
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`

                  // Ensure the value is synced for iOS autocomplete
                  if (target.value !== value) {
                    onChange(target.value)
                  }
                }}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={cn(
                  'chatbot-composer-textarea w-full resize-none bg-transparent text-[15px] leading-[1.45] text-slate-900 placeholder:text-slate-500 placeholder:text-sm focus:outline-none focus:ring-0 focus:border-transparent border-none dark:text-slate-100 dark:placeholder:text-slate-400/80 sm:text-base',
                  disabled && 'cursor-text',
                )}
                rows={1}
                style={{
                  WebkitAppearance: 'none', // Remove iOS styling
                  appearance: 'none',
                  outline: 'none',
                  outlineColor: 'transparent',
                  outlineWidth: 0,
                  outlineOffset: 0,
                  border: 'none',
                  borderColor: 'transparent',
                  boxShadow: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'text', // Enable text selection for iOS
                  userSelect: 'text',
                  pointerEvents: 'auto', // Ensure input is always interactive
                }}
                onFocus={(e) => {
                  const target = e.currentTarget
                  target.style.outline = 'none'
                  target.style.outlineColor = 'transparent'
                  target.style.outlineWidth = '0'
                  target.style.outlineOffset = '0'
                  target.style.border = 'none'
                  target.style.borderColor = 'transparent'
                  target.style.boxShadow = 'none'
                  // Force remove focus ring
                  requestAnimationFrame(() => {
                    target.style.outline = 'none'
                    target.style.outlineColor = 'transparent'
                    target.style.border = 'none'
                    target.style.boxShadow = 'none'
                  })
                }}
                onBlur={(e) => {
                  // Keep styles removed even on blur
                  const target = e.currentTarget
                  target.style.outline = 'none'
                  target.style.outlineColor = 'transparent'
                  target.style.border = 'none'
                  target.style.boxShadow = 'none'
                }}
                aria-label="Escribe un mensaje"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck="true"
                name="message"
                inputMode="text"
                disabled={disabled}
              />

              {/* Character counter for mobile */}
              {value.length > 100 && (
                <div className="absolute -top-5 right-2 text-xs text-slate-400 dark:text-slate-500">
                  {value.length}
                </div>
              )}
            </div>

            {/* Scheduler Button */}
            {onSchedule && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full text-slate-500 transition hover:text-slate-900 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none dark:text-slate-300 dark:hover:text-white"
                onClick={handleSchedule}
                disabled={isUploadingFiles}
                aria-label={scheduleLabel}
                title={scheduleLabel}
              >
                <CalendarClock className="h-5 w-5" />
              </Button>
            )}

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={isSendDisabled}
              className="h-11 w-11 shrink-0 rounded-full bg-emerald-500 text-white shadow-md transition hover:bg-emerald-600 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Enviar mensaje"
              title="Enviar mensaje"
            >
              {isUploadingFiles ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    )
  }
)

Composer.displayName = 'Composer'


