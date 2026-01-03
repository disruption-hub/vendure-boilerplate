'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, addWeeks, format, parseISO, startOfDay, subDays, subMonths, subWeeks } from 'date-fns'
import type {
  AdminCalendarEvent,
  AdminLeadRecord,
} from '@/features/admin/api/admin-api'
import {
  getAdminCalendarEvents,
  getAdminLeads,
} from '@/features/admin/api/admin-api'

type CalendarView = 'day' | 'week' | 'month'

function safeParseISO(value: string) {
  try {
    return parseISO(value)
  } catch {
    return null
  }
}

function adjustDate(base: Date, view: CalendarView, direction: 'next' | 'previous'): Date {
  const multiplier = direction === 'next' ? 1 : -1

  if (view === 'day') {
    return (multiplier === 1 ? addDays : subDays)(base, 1)
  }

  if (view === 'week') {
    return (multiplier === 1 ? addWeeks : subWeeks)(base, 1)
  }

  return (multiplier === 1 ? addMonths : subMonths)(base, 1)
}

function formatHeader(date: Date, view: CalendarView): string {
  if (view === 'day') {
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  if (view === 'month') {
    return format(date, 'MMMM yyyy')
  }

  const weekStart = startOfDay(subDays(date, date.getDay() === 0 ? 6 : date.getDay() - 1))
  const weekEnd = addDays(weekStart, 6)
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
}

function formatEventTime(event: AdminCalendarEvent): string {
  if (!event.start) {
    return 'All day'
  }

  try {
    const start = parseISO(event.start)
    const end = event.end ? parseISO(event.end) : null
    const formattedStart = format(start, 'p')
    if (!end) {
      return formattedStart
    }
    const formattedEnd = format(end, 'p')
    return `${formattedStart} - ${formattedEnd}`
  } catch {
    return 'All day'
  }
}

interface GroupedEvents {
  dateKey: string
  label: string
  events: AdminCalendarEvent[]
}

export function AppointmentsDashboard() {
  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [events, setEvents] = useState<AdminCalendarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [leads, setLeads] = useState<AdminLeadRecord[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsError, setLeadsError] = useState<string | null>(null)

  const groupedEvents = useMemo<GroupedEvents[]>(() => {
    const groups = new Map<string, GroupedEvents>()

    for (const event of events) {
      if (!event.start) {
        continue
      }

      const parsedStart = safeParseISO(event.start)
      if (!parsedStart) {
        continue
      }

      const key = format(parsedStart, 'yyyy-MM-dd')
      if (!groups.has(key)) {
        groups.set(key, {
          dateKey: key,
          label: format(parsedStart, 'EEEE, MMM d'),
          events: [],
        })
      }

      groups.get(key)!.events.push(event)
    }

    const result = Array.from(groups.values())
    result.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
    for (const group of result) {
      group.events.sort((left, right) => {
        const leftParsed = left.start ? safeParseISO(left.start) : null
        const rightParsed = right.start ? safeParseISO(right.start) : null
        const leftDate = leftParsed ? leftParsed.getTime() : 0
        const rightDate = rightParsed ? rightParsed.getTime() : 0
        return leftDate - rightDate
      })
    }
    return result
  }, [events])

  const refreshEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)
    try {
      const response = await getAdminCalendarEvents({
        view,
        date: currentDate.toISOString(),
      })
      setEvents(response.events ?? [])
    } catch (error) {
      console.error('Failed to load admin calendar events', error)
      setEventsError('Failed to load calendar events.')
    } finally {
      setEventsLoading(false)
    }
  }, [view, currentDate])

  const refreshLeads = useCallback(async () => {
    setLeadsLoading(true)
    setLeadsError(null)
    try {
      const response = await getAdminLeads(25)
      setLeads(response.leads ?? [])
    } catch (error) {
      console.error('Failed to load lead requests', error)
      setLeadsError('Failed to load lead requests.')
    } finally {
      setLeadsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshEvents()
  }, [refreshEvents])

  useEffect(() => {
    void refreshLeads()
  }, [refreshLeads])

  const handleViewChange = (nextView: CalendarView) => {
    setView(nextView)
  }

  const handleNavigate = (direction: 'next' | 'previous') => {
    setCurrentDate(prev => adjustDate(prev, view, direction))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Appointments Calendar</h2>
              <p className="text-sm text-gray-500">View booked appointments by day, week, or month.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-gray-200 p-1">
                {(['day', 'week', 'month'] as CalendarView[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleViewChange(option)}
                    className={`touch-target rounded px-2 py-1 text-sm font-medium capitalize ${
                      view === option
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('previous')}
                  className="touch-target rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="touch-target rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('next')}
                  className="touch-target rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
              <button
                type="button"
                onClick={() => void refreshEvents()}
                className="touch-target rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">{formatHeader(currentDate, view)}</h3>
            {eventsLoading && <span className="text-sm text-gray-500">Loading events…</span>}
          </div>

          {eventsError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{eventsError}</div>
          )}

          {!eventsError && groupedEvents.length === 0 && !eventsLoading && (
            <div className="rounded-md border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              No appointments scheduled for this period.
            </div>
          )}

          <div className="space-y-4">
            {groupedEvents.map(group => (
              <div key={group.dateKey} className="rounded-md border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  {group.label}
                </div>
                <ul className="divide-y divide-gray-100">
                  {group.events.map(event => (
                    <li key={`${group.dateKey}-${event.id}`} className="px-4 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
                          {event.location && (
                            <p className="text-xs text-gray-500">Location: {event.location}</p>
                          )}
                        </div>
                        {event.attendees.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Attendees:{' '}
                            {event.attendees
                              .map(attendee => attendee.displayName || attendee.email)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Information Requests</h2>
              <p className="text-sm text-gray-500">Recent leads requesting more information.</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshLeads()}
              className="touch-target rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {leadsLoading && <p className="text-sm text-gray-500">Loading leads…</p>}
          {leadsError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{leadsError}</div>
          )}

          {!leadsError && leads.length === 0 && !leadsLoading && (
            <div className="rounded-md border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              No recent information requests found.
            </div>
          )}

          {leads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Phone
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{lead.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-blue-600">{lead.email}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{lead.phone}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm capitalize text-gray-700">{lead.status.replace(/_/g, ' ')}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                        {(() => {
                          const parsed = safeParseISO(lead.createdAt)
                          return parsed ? format(parsed, 'MMM d, yyyy p') : '—'
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
