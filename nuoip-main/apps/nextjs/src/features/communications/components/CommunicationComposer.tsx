"use client"

import { useMemo, useState } from 'react'

import {
  createCommunicationsFacade,
  createHttpCommunicationsGateway,
  type CommunicationChannelType,
  type EnqueueNotificationResult,
} from '@/domains/communications'

const CHANNEL_LABELS: Record<CommunicationChannelType, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  TELEGRAM: 'Telegram',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
}

interface FormState {
  channel: CommunicationChannelType
  recipients: string
  subject: string
  message: string
  sending: boolean
  result: EnqueueNotificationResult | null
  error: string | null
}

const INITIAL_STATE: FormState = {
  channel: 'EMAIL',
  recipients: '',
  subject: '',
  message: '',
  sending: false,
  result: null,
  error: null,
}

export function CommunicationComposer() {
  const [state, setState] = useState<FormState>(INITIAL_STATE)
  const communicationsFacade = useMemo(
    () => createCommunicationsFacade({ gateway: createHttpCommunicationsGateway() }),
    [],
  )

  const requiresSubject = useMemo(() => state.channel === 'EMAIL', [state.channel])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState(prev => ({ ...prev, sending: true, result: null, error: null }))

    const recipients = state.recipients
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)

    if (!recipients.length) {
      setState(prev => ({ ...prev, sending: false, error: 'Agrega al menos un destinatario.' }))
      return
    }

    if (requiresSubject && !state.subject.trim()) {
      setState(prev => ({ ...prev, sending: false, error: 'El asunto es obligatorio para correos.' }))
      return
    }

    try {
      const response = await communicationsFacade.enqueueNotification({
        channel: state.channel,
        recipients,
        subject: requiresSubject ? state.subject.trim() : undefined,
        message: state.message.trim() || undefined,
        text: state.message.trim() || undefined,
        html: state.channel === 'EMAIL' ? state.message.trim() || undefined : undefined,
      })

      setState(prev => ({
        ...prev,
        sending: false,
        result: response,
        error: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        sending: false,
        error: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.',
      }))
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h3 className="text-lg font-semibold text-slate-900">Composer multicanal</h3>
        <p className="text-sm text-slate-500">Envía mensajes rápidos a través de Email, WhatsApp, Telegram, Instagram o SMS.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Canal</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={state.channel}
              onChange={event =>
                setState(prev => ({
                  ...prev,
                  channel: event.target.value as CommunicationChannelType,
                }))
              }
              disabled={state.sending}
            >
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Destinatarios</span>
            <input
              type="text"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Separar con comas"
              value={state.recipients}
              onChange={event => setState(prev => ({ ...prev, recipients: event.target.value }))}
              disabled={state.sending}
            />
          </label>
        </div>

        {requiresSubject && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Asunto</span>
            <input
              type="text"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={state.subject}
              onChange={event => setState(prev => ({ ...prev, subject: event.target.value }))}
              disabled={state.sending}
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-black">Mensaje</span>
          <textarea
            className="min-h-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            value={state.message}
            onChange={event => setState(prev => ({ ...prev, message: event.target.value }))}
            placeholder="Escribe el mensaje..."
            disabled={state.sending}
          />
        </label>

        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

        {state.result && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <p className="font-medium">Mensaje enviado</p>
            <p className="text-xs opacity-80">
              {state.result.summary.success} entregados, {state.result.summary.failed} fallidos de {state.result.summary.total}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={state.sending}
          >
            {state.sending ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </div>
      </form>
    </div>
  )
}
