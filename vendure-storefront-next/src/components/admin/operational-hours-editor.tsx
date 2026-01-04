'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clock } from 'lucide-react'

export interface DayHours {
    open?: string
    close?: string
    closed: boolean
}

export interface OpeningHours {
    mon?: DayHours
    tue?: DayHours
    wed?: DayHours
    thu?: DayHours
    fri?: DayHours
    sat?: DayHours
    sun?: DayHours
}

interface OperationalHoursEditorProps {
    value: OpeningHours
    onChange: (value: OpeningHours) => void
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday'
}

const DEFAULT_DAY_HOURS: DayHours = {
    open: '09:00',
    close: '17:00',
    closed: false
}

export function OperationalHoursEditor({ value, onChange }: OperationalHoursEditorProps) {
    const handleDayChange = (day: keyof OpeningHours, changes: Partial<DayHours>) => {
        const currentDay = value[day] || DEFAULT_DAY_HOURS
        const updatedDay = { ...currentDay, ...changes }

        onChange({
            ...value,
            [day]: updatedDay
        })
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Operational Hours
            </h3>
            <div className="space-y-3 rounded-lg border p-4">
                {DAYS.map((day) => {
                    const dayHours = value[day] || { closed: true, open: '09:00', close: '17:00' }

                    return (
                        <div key={day} className="flex items-center justify-between gap-4">
                            <div className="w-24">
                                <Label className="text-sm font-medium">{DAY_LABELS[day]}</Label>
                            </div>

                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={!dayHours.closed}
                                        onCheckedChange={(checked) =>
                                            handleDayChange(day, { closed: !checked })
                                        }
                                    />
                                    <span className="text-xs text-muted-foreground w-12">
                                        {dayHours.closed ? 'Closed' : 'Open'}
                                    </span>
                                </div>

                                {!dayHours.closed && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={dayHours.open}
                                            onChange={(e) => handleDayChange(day, { open: e.target.value })}
                                            className="w-24 h-8"
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <Input
                                            type="time"
                                            value={dayHours.close}
                                            onChange={(e) => handleDayChange(day, { close: e.target.value })}
                                            className="w-24 h-8"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
