'use client'

import React, { useEffect, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SchedulePreset {
  label: string
  iso: string
}

interface ScheduleBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (scheduledAt: Date | null) => void
  sessionToken?: string | null
  messageContent?: string
  hasFiles?: boolean
}

export function ScheduleBottomSheet({
  open,
  onOpenChange,
  onSelect,
  sessionToken,
  messageContent = '',
  hasFiles = false,
}: ScheduleBottomSheetProps) {
  const [presets, setPresets] = useState<SchedulePreset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  // Helper function to get current date and time in the correct format
  // Pre-loads time at least 1 minute in the future to avoid validation errors
  const getCurrentDateTime = () => {
    const now = new Date()
    const futureTime = new Date(now.getTime() + 60000) // Add 1 minute
    const date = futureTime.toISOString().split('T')[0]
    const time = `${String(futureTime.getHours()).padStart(2, '0')}:${String(futureTime.getMinutes()).padStart(2, '0')}`
    return { date, time }
  }

  useEffect(() => {
    if (open) {
      // Pre-load current date and time when opening
      const { date, time } = getCurrentDateTime()
      setCustomDate(date)
      setCustomTime(time)
      
      if (sessionToken) {
        loadPresets()
      }
    } else {
      // Reset state when closed
      setPresets([])
      setError(null)
      setSelectedPreset(null)
      setCustomDate('')
      setCustomTime('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionToken])

  const loadPresets = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {}
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`
      }

      const response = await fetch('/api/schedule/presets', { headers })
      if (!response.ok) {
        throw new Error('Failed to load schedule presets')
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.presets)) {
        setPresets(data.presets)
      } else {
        setPresets([])
      }
    } catch (err) {
      console.error('[ScheduleBottomSheet] Failed to load presets', err)
      setError(err instanceof Error ? err.message : 'Failed to load schedule options')
      setPresets([])
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (iso: string) => {
    setSelectedPreset(iso)
    setCustomDate('')
    setCustomTime('')
  }

  const handleCustomSchedule = () => {
    if (!customDate || !customTime) {
      setError('Por favor selecciona fecha y hora')
      return
    }

    // Validate that there's message content
    const hasContent = (messageContent?.trim().length ?? 0) > 0 || hasFiles
    if (!hasContent) {
      setError('No se puede programar un mensaje vacío. Escribe un mensaje o adjunta archivos.')
      return
    }

    const dateTime = new Date(`${customDate}T${customTime}`)
    const now = new Date()
    const minDateTime = new Date(now.getTime() + 60000) // At least 1 minute in the future
    
    if (isNaN(dateTime.getTime()) || dateTime < minDateTime) {
      setError('La fecha y hora deben ser al menos 1 minuto en el futuro')
      return
    }

    onSelect(dateTime)
    onOpenChange(false)
  }

  const handlePresetConfirm = () => {
    if (!selectedPreset) return

    // Validate that there's message content
    const hasContent = (messageContent?.trim().length ?? 0) > 0 || hasFiles
    if (!hasContent) {
      setError('No se puede programar un mensaje vacío. Escribe un mensaje o adjunta archivos.')
      return
    }

    const dateTime = new Date(selectedPreset)
    if (isNaN(dateTime.getTime())) {
      setError('Fecha inválida seleccionada')
      return
    }

    onSelect(dateTime)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onSelect(null)
    onOpenChange(false)
  }

  // Get minimum date (today) and time for custom input
  // Use future time (1 minute ahead) to match pre-loaded values
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const futureTime = new Date(now.getTime() + 60000) // Add 1 minute
  const currentTime = `${String(futureTime.getHours()).padStart(2, '0')}:${String(futureTime.getMinutes()).padStart(2, '0')}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[85vh] overflow-y-auto pb-safe" 
        title="Programar mensaje"
      >
        <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
          <Calendar className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Programar mensaje</h2>
        </div>

        <div className="mt-4 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">Cargando opciones de horario...</p>
            </div>
          ) : error && presets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Error al cargar horarios</p>
              <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">{error}</p>
              <Button variant="outline" size="sm" onClick={loadPresets} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              {/* Presets Section */}
              {presets.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Horarios disponibles
                  </h3>
                  <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handlePresetSelect(preset.iso)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                          selectedPreset === preset.iso
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                        )}
                      >
                        <Clock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {preset.label}
                        </span>
                        {selectedPreset === preset.iso && (
                          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Date/Time Section */}
              <div className="space-y-2 sm:space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Fecha y hora personalizada
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-900 dark:text-gray-100">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value)
                        setSelectedPreset(null)
                      }}
                      min={today}
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-900 dark:text-gray-100">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value)
                        setSelectedPreset(null)
                      }}
                      min={customDate === today ? currentTime : undefined}
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border-2 border-red-300 p-3 dark:bg-red-950/50 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-row gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 pb-2">
                <Button 
                  onClick={handleCancel} 
                  className="flex-1 font-medium bg-red-500 hover:bg-red-600 text-white"
                >
                  Cancelar
                </Button>
                {selectedPreset ? (
                  <Button 
                    onClick={handlePresetConfirm} 
                    className="flex-1 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Enviar
                  </Button>
                ) : customDate && customTime ? (
                  <Button 
                    onClick={handleCustomSchedule} 
                    className="flex-1 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Enviar
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="flex-1 font-semibold bg-gray-400 text-white cursor-not-allowed"
                  >
                    Enviar
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

