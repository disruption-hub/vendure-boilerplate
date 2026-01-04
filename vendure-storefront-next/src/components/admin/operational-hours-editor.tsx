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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 rounded-lg border p-4 bg-muted/20">
                {DAYS.map((day) => {
                    const dayHours = value[day] || { closed: true, open: '09:00', close: '17:00' }

                    return (
                        <div key={day} className="flex items-center justify-between gap-2 py-1 border-b border-muted/30 last:border-0 md:border-b-0">
                            <div className="w-20">
                                <Label className="text-xs font-semibold uppercase">{DAY_LABELS[day].slice(0, 3)}</Label>
                            </div>

                            <div className="flex items-center gap-3 flex-1 justify-end">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={!dayHours.closed}
                                        onCheckedChange={(checked) =>
                                            handleDayChange(day, { closed: !checked })
                                        }
                                    />
                                </div>

                                {!dayHours.closed ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="time"
                                            value={dayHours.open}
                                            onChange={(e) => handleDayChange(day, { open: e.target.value })}
                                            className="w-20 h-7 text-[10px] px-1"
                                        />
                                        <span className="text-[10px] text-muted-foreground">-</span>
                                        <Input
                                            type="time"
                                            value={dayHours.close}
                                            onChange={(e) => handleDayChange(day, { close: e.target.value })}
                                            className="w-20 h-7 text-[10px] px-1"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground italic w-[100px] text-right">Closed (No Ops)</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
