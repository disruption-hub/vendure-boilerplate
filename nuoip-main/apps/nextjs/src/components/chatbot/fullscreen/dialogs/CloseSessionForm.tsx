"use client"

import { useCallback, useEffect, useState } from 'react'
import {
    Calendar,
    Clock,
    Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Interaction types for close session
export type InteractionType = 'consulta' | 'venta' | 'soporte' | 'reclamo' | 'seguimiento' | 'otro'

export interface CloseSessionFormData {
    annotation: string
    interactionType: InteractionType
    needsFollowUp: boolean
    followUpDate: string
    followUpTime: string
}

export interface CloseSessionFormProps {
    contactId: string
    sessionStartTime?: string | Date
    onCancel: () => void
    onSubmit: (data: {
        annotation: string
        interactionType: InteractionType
        needsFollowUp: boolean
        followUpDate?: string
    }) => void
    isLoading?: boolean
}

export function CloseSessionForm({
    contactId,
    sessionStartTime,
    onCancel,
    onSubmit,
    isLoading: externalLoading = false,
}: CloseSessionFormProps) {
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
    const [aiSummary, setAiSummary] = useState('')
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<CloseSessionFormData>({
        annotation: '',
        interactionType: 'consulta',
        needsFollowUp: false,
        followUpDate: '',
        followUpTime: '',
    })

    // Initial summary generation
    useEffect(() => {
        if (contactId) {
            void handleGenerateSummary()
        }
    }, [contactId])

    const handleGenerateSummary = useCallback(async () => {
        if (!contactId) return

        setIsGeneratingSummary(true)
        try {
            const res = await fetch(`/api/whatsapp/contacts/${contactId}/session/summary-preview`)
            if (!res.ok) throw new Error('Failed to generate summary')

            const data = await res.json()
            if (data) {
                setAiSummary(data.summary || '')
                setForm(prev => ({
                    ...prev,
                    interactionType: (['consulta', 'venta', 'soporte', 'reclamo', 'seguimiento', 'otro'].includes(data.interactionType?.toLowerCase())
                        ? data.interactionType.toLowerCase()
                        : 'otro') as InteractionType
                }))
            }
        } catch (err) {
            console.error('[CloseSessionForm] Error generating summary:', err)
        } finally {
            setIsGeneratingSummary(false)
        }
    }, [contactId])

    const handleConfirm = () => {
        setLoading(true)
        const manualNote = form.annotation.trim()
        const combinedAnnotation = [
            aiSummary ? `[Resumen IA]: ${aiSummary}` : '',
            manualNote ? `[Notas]: ${manualNote}` : ''
        ].filter(Boolean).join('\n\n')

        onSubmit({
            annotation: combinedAnnotation,
            interactionType: form.interactionType,
            needsFollowUp: form.needsFollowUp,
            followUpDate: form.needsFollowUp
                ? (form.followUpDate + (form.followUpTime ? `T${form.followUpTime}` : ''))
                : undefined,
        })
        setLoading(false)
    }

    const isFormLoading = externalLoading || loading || isGeneratingSummary

    return (
        <div className="space-y-6">
            {/* Session Metrics */}
            {sessionStartTime && (
                <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-800">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inicio</span>
                            <div className="font-mono text-sm text-white mt-1">
                                {new Date(sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fin</span>
                            <div className="font-mono text-sm text-white mt-1">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duración</span>
                            <div className="font-mono text-sm text-emerald-400 mt-1">
                                {(() => {
                                    const diff = new Date().getTime() - new Date(sessionStartTime).getTime()
                                    const mins = Math.max(0, Math.round(diff / 60000))
                                    return `${mins} min`
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interaction Type */}
            <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-white mb-3">Tipo de Interacción</legend>
                <div className="grid grid-cols-3 gap-2">
                    {(['consulta', 'venta', 'soporte', 'reclamo', 'seguimiento', 'otro'] as const).map(type => (
                        <button
                            key={type}
                            id={`interaction-${type}`}
                            name="interactionType"
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, interactionType: type }))}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${form.interactionType === type
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span id="ai-summary-label" className="text-sm font-medium text-white">Resumen de la Sesión (IA)</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                        className="h-6 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                    >
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        {isGeneratingSummary ? 'Generando...' : 'Regenerar'}
                    </Button>
                </div>
                <div
                    id="ai-summary-content"
                    role="log"
                    aria-labelledby="ai-summary-label"
                    className="rounded-md bg-slate-800 border border-slate-700 p-3 text-sm text-white min-h-[60px] max-h-[120px] overflow-y-auto whitespace-pre-wrap"
                >
                    {isGeneratingSummary ? (
                        <span className="text-slate-500 italic">Generando resumen...</span>
                    ) : aiSummary ? (
                        aiSummary
                    ) : (
                        <span className="text-slate-500 italic">Sin resumen generado.</span>
                    )}
                </div>
            </div>

            {/* Manual Notes */}
            <div className="space-y-2">
                <label htmlFor="manual-notes" className="text-sm font-medium text-white">Notas manuales</label>
                <Textarea
                    id="manual-notes"
                    name="annotation"
                    value={form.annotation}
                    onChange={e => setForm(prev => ({ ...prev, annotation: e.target.value }))}
                    placeholder="Ingrese notas adicionales..."
                    className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-[100px] resize-none focus:ring-emerald-500/20 focus:border-emerald-500/50"
                />
            </div>

            {/* Follow-up Toggle */}
            <div className="rounded-lg bg-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                    <span id="follow-up-toggle-label" className="text-sm font-medium text-white">¿Requiere seguimiento?</span>
                    <button
                        id="follow-up-toggle"
                        name="needsFollowUp"
                        type="button"
                        aria-labelledby="follow-up-toggle-label"
                        onClick={() => setForm(prev => {
                            const newValue = !prev.needsFollowUp
                            return {
                                ...prev,
                                needsFollowUp: newValue,
                                followUpDate: newValue ? prev.followUpDate : '',
                                followUpTime: newValue ? new Date().toTimeString().slice(0, 5) : ''
                            }
                        })}
                        className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 ${form.needsFollowUp ? 'bg-emerald-500' : 'bg-slate-600'
                            }`}
                    >
                        <span
                            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200"
                            style={{ left: form.needsFollowUp ? '28px' : '4px' }}
                        />
                    </button>
                </div>

                {form.needsFollowUp && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'Mañana', days: 1 },
                                { label: 'En 3 días', days: 3 },
                                { label: 'En 1 semana', days: 7 },
                            ].map(opt => {
                                const targetDate = new Date()
                                targetDate.setDate(targetDate.getDate() + opt.days)
                                const dateStr = targetDate.toISOString().split('T')[0]
                                const isSelected = form.followUpDate === dateStr
                                return (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, followUpDate: dateStr }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isSelected
                                            ? 'bg-amber-500 border-amber-400 text-white'
                                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label htmlFor="follow-up-date" className="mb-1 block text-xs text-slate-400">Fecha:</label>
                                <div className="relative">
                                    <Input
                                        id="follow-up-date"
                                        name="followUpDate"
                                        type="date"
                                        value={form.followUpDate}
                                        onChange={e => setForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="bg-slate-700 border-slate-600 text-white cursor-pointer pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="w-1/3">
                                <label htmlFor="follow-up-time" className="mb-1 block text-xs text-slate-400">Hora:</label>
                                <div className="relative">
                                    <Input
                                        id="follow-up-time"
                                        name="followUpTime"
                                        type="time"
                                        value={form.followUpTime}
                                        onChange={e => setForm(prev => ({ ...prev, followUpTime: e.target.value }))}
                                        className="bg-slate-700 border-slate-600 text-white cursor-pointer pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    />
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="flex-1 h-11 px-6 border border-white bg-transparent text-white hover:bg-white/10"
                    disabled={isFormLoading}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 h-11 px-8 bg-emerald-600 text-white hover:bg-emerald-500 font-medium shadow-lg shadow-emerald-900/20"
                    disabled={isFormLoading || (form.needsFollowUp && !form.followUpDate)}
                >
                    {isFormLoading ? (
                        <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        'Confirmar Cierre'
                    )}
                </Button>
            </div>
        </div>
    )
}
