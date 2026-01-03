"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ScheduleTemplate, ScheduleTemplateInput, ScheduleSlotInput, ScheduleRecurringType } from '@/features/admin/api/admin-api'

interface SlotFormState {
  id: string
  startTime: string
  endTime: string
  duration: string
  bufferTime: string
  maxBookings: string
  priority: string
}

interface ScheduleTemplateFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: ScheduleTemplateInput) => Promise<void> | void
  isSaving?: boolean
  error?: string | null
  template?: ScheduleTemplate | null
  tenantId?: string
}

const WEEKDAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const TIMEZONE_OPTIONS = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (ET) - UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (CT) - UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - UTC-8/-7' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT) - UTC-9/-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT) - UTC-10' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZT) - UTC-7 (no DST)' },
  { value: 'America/Mexico_City', label: 'Mexico City - UTC-6/-5' },
  { value: 'America/Guatemala', label: 'Guatemala - UTC-6' },
  { value: 'America/Bogota', label: 'Bogota - UTC-5' },
  { value: 'America/Lima', label: 'Lima - UTC-5' },
  { value: 'America/Caracas', label: 'Caracas - UTC-4' },
  { value: 'America/Sao_Paulo', label: 'São Paulo - UTC-3/-2' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires - UTC-3' },
  { value: 'America/Santiago', label: 'Santiago - UTC-4/-3' },
  { value: 'America/Halifax', label: 'Atlantic Time (AT) - UTC-4/-3' },
  { value: 'America/St_Johns', label: 'Newfoundland Time (NT) - UTC-3.5/-2.5' },

  // Europe
  { value: 'Europe/London', label: 'London - UTC+0/+1 (BST)' },
  { value: 'Europe/Paris', label: 'Paris - UTC+1/+2 (CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin - UTC+1/+2 (CEST)' },
  { value: 'Europe/Rome', label: 'Rome - UTC+1/+2 (CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid - UTC+1/+2 (CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam - UTC+1/+2 (CEST)' },
  { value: 'Europe/Brussels', label: 'Brussels - UTC+1/+2 (CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich - UTC+1/+2 (CEST)' },
  { value: 'Europe/Vienna', label: 'Vienna - UTC+1/+2 (CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm - UTC+1/+2 (CEST)' },
  { value: 'Europe/Oslo', label: 'Oslo - UTC+1/+2 (CEST)' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen - UTC+1/+2 (CEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki - UTC+2/+3 (EEST)' },
  { value: 'Europe/Warsaw', label: 'Warsaw - UTC+1/+2 (CEST)' },
  { value: 'Europe/Prague', label: 'Prague - UTC+1/+2 (CEST)' },
  { value: 'Europe/Budapest', label: 'Budapest - UTC+1/+2 (CEST)' },
  { value: 'Europe/Bucharest', label: 'Bucharest - UTC+2/+3 (EEST)' },
  { value: 'Europe/Sofia', label: 'Sofia - UTC+2/+3 (EEST)' },
  { value: 'Europe/Athens', label: 'Athens - UTC+2/+3 (EEST)' },
  { value: 'Europe/Istanbul', label: 'Istanbul - UTC+3 (no DST)' },
  { value: 'Europe/Moscow', label: 'Moscow - UTC+3' },
  { value: 'Europe/Kiev', label: 'Kyiv - UTC+2/+3 (EEST)' },

  // Asia
  { value: 'Asia/Dubai', label: 'Dubai - UTC+4' },
  { value: 'Asia/Kolkata', label: 'India (IST) - UTC+5.5' },
  { value: 'Asia/Dhaka', label: 'Dhaka - UTC+6' },
  { value: 'Asia/Bangkok', label: 'Bangkok - UTC+7' },
  { value: 'Asia/Singapore', label: 'Singapore - UTC+8' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST) - UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST) - UTC+9' },
  { value: 'Asia/Seoul', label: 'Seoul (KST) - UTC+9' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT) - UTC+8' },
  { value: 'Asia/Taipei', label: 'Taipei (CST) - UTC+8' },
  { value: 'Asia/Manila', label: 'Manila (PST) - UTC+8' },
  { value: 'Asia/Jakarta', label: 'Jakarta - UTC+7' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur - UTC+8' },
  { value: 'Australia/Perth', label: 'Perth - UTC+8' },
  { value: 'Australia/Darwin', label: 'Darwin - UTC+9.5' },
  { value: 'Australia/Adelaide', label: 'Adelaide - UTC+9.5/+10.5' },
  { value: 'Australia/Brisbane', label: 'Brisbane - UTC+10' },
  { value: 'Australia/Sydney', label: 'Sydney - UTC+10/+11' },
  { value: 'Australia/Melbourne', label: 'Melbourne - UTC+10/+11' },
  { value: 'Pacific/Auckland', label: 'Auckland - UTC+12/+13' },
  { value: 'Pacific/Fiji', label: 'Fiji - UTC+12/+13' },

  // Africa
  { value: 'Africa/Cairo', label: 'Cairo - UTC+2/+3 (EEST)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg - UTC+2' },
  { value: 'Africa/Lagos', label: 'Lagos - UTC+1' },
  { value: 'Africa/Nairobi', label: 'Nairobi - UTC+3' },
  { value: 'Africa/Casablanca', label: 'Casablanca - UTC+1/+0 (WET)' },

  // Other
  { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
  { value: 'GMT', label: 'GMT - Greenwich Mean Time' },
]

function createSlot(seed?: Partial<ScheduleSlotInput>, idSeed?: string): SlotFormState {
  const uid = idSeed ?? `slot-${Math.random().toString(36).slice(2, 10)}`
  return {
    id: uid,
    startTime: seed?.startTime ?? '09:00',
    endTime: seed?.endTime ?? '17:00',
    duration: seed?.duration != null ? String(seed.duration) : '60',
    bufferTime: seed?.bufferTime != null ? String(seed.bufferTime) : '15',
    maxBookings: seed?.maxBookings == null ? '' : String(seed.maxBookings),
    priority: seed?.priority != null ? String(seed.priority) : '1',
  }
}

function parseMonthlyDays(value: string): number[] {
  return value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter(day => Number.isFinite(day) && day >= 1 && day <= 31)
}

export function ScheduleTemplateFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving = false,
  error,
  template,
  tenantId,
}: ScheduleTemplateFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [recurringType, setRecurringType] = useState<ScheduleRecurringType>('weekly')
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [monthlyDaysText, setMonthlyDaysText] = useState('')
  const [timeZone, setTimeZone] = useState('America/Mexico_City')
  const [slots, setSlots] = useState<SlotFormState[]>([createSlot()])
  const [formError, setFormError] = useState<string | null>(null)

  const resolvedTenantId = useMemo(() => template?.tenantId ?? tenantId ?? '', [template?.tenantId, tenantId])

  useEffect(() => {
    if (!isOpen) return

    if (template) {
      setName(template.name)
      setDescription(template.description ?? '')
      setIsActive(Boolean(template.isActive))
      setRecurringType(template.recurringType)
      setRecurringDays(Array.isArray(template.recurringDays) ? [...template.recurringDays] : [])
      setMonthlyDaysText(template.recurringType === 'monthly' ? template.recurringDays.join(', ') : '')
      setTimeZone(template.timeZone || 'America/Mexico_City')
      const templateSlots = (template.slots ?? []).map(slot =>
        createSlot(
          {
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
            bufferTime: slot.bufferTime,
            maxBookings: slot.maxBookings ?? undefined,
            priority: slot.priority,
          },
          slot.id,
        ),
      )
      setSlots(templateSlots.length ? templateSlots : [createSlot()])
    } else {
      setName('')
      setDescription('')
      setIsActive(true)
      setRecurringType('weekly')
      setRecurringDays([1, 2, 3, 4, 5])
      setMonthlyDaysText('')
      setTimeZone('America/Mexico_City')
      setSlots([
        createSlot({ startTime: '09:00', endTime: '12:00' }),
        createSlot({ startTime: '13:00', endTime: '17:00' }),
      ])
    }
    setFormError(null)
  }, [isOpen, template])

  if (!isOpen) return null

  const handleToggleWeeklyDay = (value: number) => {
    setRecurringDays(prev => {
      if (prev.includes(value)) {
        return prev.filter(day => day !== value)
      }
      return [...prev, value]
    })
  }

  const handleSlotChange = (id: string, field: keyof SlotFormState, value: string) => {
    setSlots(prev => prev.map(slot => (slot.id === id ? { ...slot, [field]: value } : slot)))
  }

  const handleAddSlot = () => {
    setSlots(prev => [...prev, createSlot({ startTime: '09:00', endTime: '17:00' })])
  }

  const handleRemoveSlot = (id: string) => {
    setSlots(prev => (prev.length > 1 ? prev.filter(slot => slot.id !== id) : prev))
  }

  const buildPayload = (): ScheduleTemplateInput | null => {
    if (!name.trim()) {
      setFormError('Name is required.')
      return null
    }

    if (!slots.length) {
      setFormError('At least one slot is required.')
      return null
    }

    const computedRecurringDays = (() => {
      if (recurringType === 'daily') {
        return []
      }
      if (recurringType === 'weekly') {
        return [...recurringDays].sort((a, b) => a - b)
      }
      return parseMonthlyDays(monthlyDaysText)
    })()

    if (recurringType !== 'daily' && computedRecurringDays.length === 0) {
      setFormError('Please select at least one day for the recurring schedule.')
      return null
    }

    const sanitizedSlots: ScheduleSlotInput[] = []
    for (const slot of slots) {
      const start = slot.startTime.trim()
      const end = slot.endTime.trim()
      if (!start || !end) {
        setFormError('Each slot requires a start and end time.')
        return null
      }

      sanitizedSlots.push({
        startTime: start,
        endTime: end,
        duration: Number.isFinite(Number(slot.duration)) ? Number(slot.duration) : 60,
        bufferTime: Number.isFinite(Number(slot.bufferTime)) ? Number(slot.bufferTime) : 15,
        maxBookings:
          slot.maxBookings.trim() === '' ? undefined : Number.isFinite(Number(slot.maxBookings)) ? Number(slot.maxBookings) : undefined,
        priority: Number.isFinite(Number(slot.priority)) ? Number(slot.priority) : 1,
      })
    }

    const payload: ScheduleTemplateInput = {
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      tenantId: resolvedTenantId.trim() ? resolvedTenantId.trim() : undefined,
      isActive,
      recurringType,
      recurringDays: computedRecurringDays,
      timeZone: timeZone.trim() || 'America/Mexico_City',
      slots: sanitizedSlots,
    }

    return payload
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const payload = buildPayload()
    if (!payload) return

    try {
      await onSubmit(payload)
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message || 'Failed to save schedule template'
          : 'Failed to save schedule template'
      setFormError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mobile-scroll w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-lg sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {template ? 'Edit Schedule Template' : 'Create Schedule Template'}
              </h2>
              <p className="text-sm text-gray-600">Define recurring availability for bookings.</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={event => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Active
              </label>
            </div>
          </div>

          {(formError || error) && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError || error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Name</Label>
              <Input
                id="schedule-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Standard Business Hours"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-timezone">Time Zone</Label>
              <Select value={timeZone} onValueChange={setTimeZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="schedule-description">Description</Label>
              <Textarea
                id="schedule-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Provide a short description"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Recurring Pattern</Label>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {(['daily', 'weekly', 'monthly'] as ScheduleRecurringType[]).map(type => (
                  <label key={type} className="flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      name="recurring-type"
                      value={type}
                      checked={recurringType === type}
                      onChange={() => setRecurringType(type)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {type === 'daily' && 'Daily'}
                    {type === 'weekly' && 'Weekly'}
                    {type === 'monthly' && 'Monthly'}
                  </label>
                ))}
              </div>
            </div>

            {recurringType === 'weekly' && (
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="flex flex-wrap gap-3 text-sm">
                  {WEEKDAY_OPTIONS.map(day => (
                    <label key={day.value} className="flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={recurringDays.includes(day.value)}
                        onChange={() => handleToggleWeeklyDay(day.value)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {recurringType === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="schedule-monthly-days">Days of Month</Label>
                <Input
                  id="schedule-monthly-days"
                  value={monthlyDaysText}
                  onChange={event => setMonthlyDaysText(event.target.value)}
                  placeholder="e.g. 1, 15, 30"
                />
                <p className="text-xs text-gray-500">Enter comma-separated day numbers (1-31).</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Time Slots</Label>
                <p className="text-xs text-gray-500">Define one or more availability windows for this template.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSlot}>
                Add Slot
              </Button>
            </div>

            <div className="space-y-3">
              {slots.map(slot => (
                <div key={slot.id} className="rounded-md border border-gray-200 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <div className="space-y-2">
                      <Label htmlFor={`start-${slot.id}`}>Start</Label>
                      <Input
                        id={`start-${slot.id}`}
                        type="time"
                        value={slot.startTime}
                        onChange={event => handleSlotChange(slot.id, 'startTime', event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-${slot.id}`}>End</Label>
                      <Input
                        id={`end-${slot.id}`}
                        type="time"
                        value={slot.endTime}
                        onChange={event => handleSlotChange(slot.id, 'endTime', event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`duration-${slot.id}`}>Duration (min)</Label>
                      <Input
                        id={`duration-${slot.id}`}
                        type="number"
                        min={15}
                        step={5}
                        value={slot.duration}
                        onChange={event => handleSlotChange(slot.id, 'duration', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`buffer-${slot.id}`}>Buffer (min)</Label>
                      <Input
                        id={`buffer-${slot.id}`}
                        type="number"
                        min={0}
                        step={5}
                        value={slot.bufferTime}
                        onChange={event => handleSlotChange(slot.id, 'bufferTime', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`priority-${slot.id}`}>Priority</Label>
                      <Input
                        id={`priority-${slot.id}`}
                        type="number"
                        min={1}
                        value={slot.priority}
                        onChange={event => handleSlotChange(slot.id, 'priority', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`max-${slot.id}`}>Max Bookings (optional)</Label>
                      <Input
                        id={`max-${slot.id}`}
                        type="number"
                        min={1}
                        value={slot.maxBookings}
                        onChange={event => handleSlotChange(slot.id, 'maxBookings', event.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveSlot(slot.id)}
                        disabled={slots.length === 1}
                      >
                        Remove Slot
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
