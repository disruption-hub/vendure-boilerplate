'use client'

import { useMemo, useState } from 'react'
import {
  addMinutes,
  addWeeks,
  eachDayOfInterval,
  format,
  setHours,
  setMinutes,
  startOfWeek,
} from 'date-fns'
import type { ScheduleTemplate } from '@/features/admin/api/admin-api'
import { createScheduleException, deleteScheduleException } from '@/features/admin/api/admin-api'

interface ScheduleCalendarProps {
  templates: ScheduleTemplate[]
  loading?: boolean
  error?: string | null
  onRefresh: () => Promise<void> | void
}

interface DaySchedule {
  dateKey: string
  label: string
  slots: Array<{
    slotId: string
    templateId: string
    templateName: string
    startTime: string
    endTime: string
    displayRange: string
    isBlocked: boolean
    exceptionId?: string
    date: string
  }>
}

function buildSlotKey(slot: DaySchedule['slots'][number]) {
  return `${slot.templateId}-${slot.slotId}-${slot.date}-${slot.startTime}-${slot.endTime}`
}

export function ScheduleCalendar({ templates, loading, error, onRefresh }: ScheduleCalendarProps) {
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const [processingSlotKey, setProcessingSlotKey] = useState<string | null>(null)

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates],
  )

  const baseWeekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const currentWeekStart = useMemo(
    () => addWeeks(baseWeekStart, weekOffset),
    [baseWeekStart, weekOffset],
  )

  const handleBlockSlot = async (slot: DaySchedule['slots'][number]) => {
    try {
      setProcessingSlotKey(buildSlotKey(slot))
      setActionError(null)
      await createScheduleException({
        templateId: slot.templateId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        exceptionType: 'blocked',
      })
      await onRefresh()
    } catch (err) {
      console.error('Failed to block schedule slot', err)
      const message = err instanceof Error ? err.message || 'Failed to block schedule slot' : 'Failed to block schedule slot'
      setActionError(message)
    } finally {
      setProcessingSlotKey(null)
    }
  }

  const handleUnblockSlot = async (slot: DaySchedule['slots'][number]) => {
    if (!slot.exceptionId) return
    try {
      setProcessingSlotKey(buildSlotKey(slot))
      setActionError(null)
      await deleteScheduleException(slot.exceptionId)
      await onRefresh()
    } catch (err) {
      console.error('Failed to restore schedule slot', err)
      const message = err instanceof Error ? err.message || 'Failed to restore schedule slot' : 'Failed to restore schedule slot'
      setActionError(message)
    } finally {
      setProcessingSlotKey(null)
    }
  }

  const weekDays = useMemo(() => {
    const days = eachDayOfInterval({ start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })
    return days.slice(0, 7)
  }, [currentWeekStart])

  const daySchedules = useMemo<DaySchedule[]>(() => {
    const schedulesMap = new Map<string, DaySchedule>()

    for (const day of weekDays) {
      const dateKey = day.toISOString().slice(0, 10)
      schedulesMap.set(dateKey, {
        dateKey,
        label: `${format(day, 'EEEE')} · ${format(day, 'MMM d')}`,
        slots: [],
      })
    }

    for (const template of sortedTemplates) {
      const templateDays = daySchedulesForTemplate(template, weekDays)
      for (const [dateKey, slots] of templateDays) {
        const schedule = schedulesMap.get(dateKey)
        if (!schedule) continue
        schedule.slots.push(...slots)
      }
    }

    const result = Array.from(schedulesMap.values())
    for (const day of result) {
      day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return result
  }, [sortedTemplates, weekDays])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Active Schedule Calendar</h3>
          <p className="text-sm text-gray-600">Review weekly availability and block or restore individual time slots.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-2 text-sm font-medium text-gray-700">
            {weekOffset === 0 ? 'Current week' : 'Next week'} · Week of {format(currentWeekStart, 'MMM d, yyyy')}
          </div>
          {weekOffset === 0 ? (
            <button
              type="button"
              onClick={() => setWeekOffset(1)}
              className="touch-target rounded-md border border-blue-200 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
            >
              Looking for next week?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="touch-target rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Back to this week
            </button>
          )}
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="touch-target rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading schedules…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="overflow-x-auto">
        <div className="min-w-[720px] rounded-lg border border-gray-200 bg-white shadow">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
            {daySchedules.map(day => (
              <div key={day.dateKey} className="border-l border-gray-200 px-3 py-2 first:border-l-0">
                {day.label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daySchedules.map(day => (
              <div key={day.dateKey} className="border-l border-gray-200 p-3 first:border-l-0">
                {day.slots.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
                    No active slots
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {day.slots.map(slot => {
                      const template = sortedTemplates.find(t => t.id === slot.templateId)
                      if (!template || !template.isActive) return null

                      const slotKey = buildSlotKey(slot)
                      const isProcessing = processingSlotKey === slotKey

                      return (
                        <li
                          key={slotKey}
                          className={`rounded-md border px-3 py-2 ${
                            slot.isBlocked
                              ? 'border-amber-300 bg-amber-100 text-amber-800'
                              : 'border-blue-200 bg-blue-50 text-blue-900'
                          }`}
                        >
                          <p className="font-semibold">{template.name}</p>
                          <p>{slot.displayRange}</p>
                          {slot.isBlocked ? (
                            <span className="mt-1 inline-block rounded bg-amber-200 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              Blocked for this day
                            </span>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {slot.isBlocked ? (
                              <button
                                type="button"
                                onClick={() => void handleUnblockSlot(slot)}
                                className={`inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-200 ${isProcessing ? 'opacity-50' : ''}`}
                                disabled={isProcessing}
                              >
                                Restore slot
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleBlockSlot(slot)}
                                className={`inline-flex items-center rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-200 ${isProcessing ? 'opacity-50' : ''}`}
                                disabled={isProcessing}
                              >
                                Block slot for this day
                              </button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function daySchedulesForTemplate(template: ScheduleTemplate, weekDays: Date[]) {
  const entries: Map<string, DaySchedule['slots']> = new Map()

  if (!template.isActive) {
    return entries
  }

  const appliesToDay = (day: Date) => {
    const dayOfWeek = day.getDay()
    if (template.recurringType === 'daily') return true
    if (template.recurringType === 'weekly') {
      return template.recurringDays.includes(dayOfWeek)
    }
    return template.recurringDays.includes(day.getDate())
  }

  for (const day of weekDays) {
    if (!appliesToDay(day)) continue
    const dateKey = day.toISOString().slice(0, 10)
    const existing = entries.get(dateKey) ?? []

    for (const slot of template.slots) {
      if (!slot.isActive) continue

      const slotOccurrences = buildSlotOccurrences(day, slot)

      for (const occurrence of slotOccurrences) {
        const matchingException = findMatchingException(
          template.exceptions ?? [],
          dateKey,
          occurrence.startTime,
          occurrence.endTime,
        )

        existing.push({
          slotId: slot.id,
          templateId: template.id,
          templateName: template.name,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          displayRange: occurrence.displayRange,
          isBlocked: Boolean(matchingException),
          exceptionId: matchingException?.id,
          date: dateKey,
        })
      }
    }

    entries.set(dateKey, existing)
  }

  return entries
}

function findMatchingException(
  exceptions: ScheduleTemplate['exceptions'],
  dateKey: string,
  startTime: string,
  endTime: string,
) {
  return exceptions.find(exception => {
    if (exception.exceptionType !== 'blocked') return false
    const exceptionDateKey = new Date(exception.date).toISOString().slice(0, 10)
    if (exceptionDateKey !== dateKey) return false

    const effectiveStart = exception.startTime ?? startTime
    const effectiveEnd = exception.endTime ?? endTime

    return effectiveStart === startTime && effectiveEnd === endTime
  })
}

function buildSlotOccurrences(day: Date, slot: ScheduleTemplate['slots'][number]) {
  const occurrences: Array<{ startTime: string; endTime: string; displayRange: string }> = []

  const duration = slot.duration ?? 60
  const buffer = slot.bufferTime ?? 0

  const startMinutes = parseTimeToMinutes(slot.startTime)
  const endMinutes = parseTimeToMinutes(slot.endTime)

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || startMinutes >= endMinutes) {
    return occurrences
  }

  let current = startMinutes

  while (current + duration <= endMinutes) {
    const meetingStart = minutesToTimeString(current)
    const meetingEnd = minutesToTimeString(current + duration)

    occurrences.push({
      startTime: meetingStart,
      endTime: meetingEnd,
      displayRange: formatTimeRange(day, current, current + duration),
    })

    current += duration + buffer
  }

  return occurrences
}

function parseTimeToMinutes(value: string) {
  const [hoursStr, minutesStr] = value.split(':')
  const hours = Number.parseInt(hoursStr ?? '', 10)
  const minutes = Number.parseInt(minutesStr ?? '', 10)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.NaN
  }

  return hours * 60 + minutes
}

function minutesToTimeString(value: number) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatTimeRange(day: Date, startMinutes: number, endMinutes: number) {
  const startDate = setMinutes(setHours(day, 0), 0)
  const startDateTime = addMinutes(startDate, startMinutes)
  const endDateTime = addMinutes(startDate, endMinutes)

  return `${format(startDateTime, 'hh:mm a')} - ${format(endDateTime, 'hh:mm a')}`
}
