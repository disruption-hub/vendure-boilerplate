"use client"

import { useEffect, useMemo, useState } from 'react'

import {
  fetchCommunicationConfig,
  updateCommunicationConfigRequest,
  type CommunicationChannel,
  type CommunicationConfigChannel,
  type CommunicationConfigResponse,
  type UpdateCommunicationConfigPayload,
} from '@/features/communications/api/communication-api'

type ChannelForm = {
  isEnabled: boolean
  provider: string
  credentials: Record<string, string>
}

type FormState = {
  loading: boolean
  error: string | null
  saving: boolean
  successMessage: string | null
  name: string
  defaultFromEmail: string
  defaultFromName: string
  defaultReplyToEmail: string
  adminEmail: string
  channels: Record<CommunicationChannel, ChannelForm>
}

const CHANNEL_FIELDS: Record<CommunicationChannel, Array<{ key: string; label: string; type?: 'password' | 'text' }>> = {
  EMAIL: [
    { key: 'apiKey', label: 'API Key', type: 'password' },
    { key: 'senderEmail', label: 'Remitente (email)' },
    { key: 'senderName', label: 'Remitente (nombre)' },
    { key: 'replyToEmail', label: 'Responder a' },
  ],
  SMS: [
    { key: 'username', label: 'Usuario' },
    { key: 'token', label: 'Token', type: 'password' },
    { key: 'senderId', label: 'Sender ID' },
  ],
  TELEGRAM: [
    { key: 'botToken', label: 'Bot Token', type: 'password' },
    { key: 'defaultChatId', label: 'Chat ID por defecto' },
  ],
  WHATSAPP: [
    { key: 'accessToken', label: 'Access Token', type: 'password' },
    { key: 'phoneNumberId', label: 'Phone Number ID' },
    { key: 'businessAccountId', label: 'Business Account ID' },
  ],
  INSTAGRAM: [
    { key: 'accessToken', label: 'Access Token', type: 'password' },
    { key: 'instagramBusinessAccountId', label: 'Instagram Business Account ID' },
  ],
}

const CHANNEL_TITLES: Record<CommunicationChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  TELEGRAM: 'Telegram',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
}

const INITIAL_FORM: FormState = {
  loading: true,
  error: null,
  saving: false,
  successMessage: null,
  name: '',
  defaultFromEmail: '',
  defaultFromName: '',
  defaultReplyToEmail: '',
  adminEmail: '',
  channels: {
    EMAIL: { isEnabled: true, provider: 'BREVO', credentials: {} },
    SMS: { isEnabled: false, provider: 'LABSMOBILE', credentials: {} },
    TELEGRAM: { isEnabled: false, provider: 'TELEGRAM_BOT', credentials: {} },
    WHATSAPP: { isEnabled: false, provider: 'WHATSAPP_CLOUD', credentials: {} },
    INSTAGRAM: { isEnabled: false, provider: 'INSTAGRAM_GRAPH', credentials: {} },
  },
}

function sanitizeCredentialValue(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value.includes('••••') ? '' : value
}

function buildChannelsState(channels: CommunicationConfigChannel[]): Record<CommunicationChannel, ChannelForm> {
  const state: Record<CommunicationChannel, ChannelForm> = { ...INITIAL_FORM.channels }

  channels.forEach(channel => {
    const credentials: Record<string, string> = {}
    const rawCredentials = channel.credentials ?? {}
    for (const [key, value] of Object.entries(rawCredentials)) {
      credentials[key] = sanitizeCredentialValue(value)
    }

    state[channel.channel] = {
      isEnabled: channel.isEnabled,
      provider: channel.provider,
      credentials,
    }
  })

  return state
}

export function CommunicationSettingsPanel() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  useEffect(() => {
    let mounted = true

    fetchCommunicationConfig()
      .then(response => {
        if (!mounted) return
        applyConfigResponse(response)
      })
      .catch(error => {
        if (!mounted) return
        setForm(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'No se pudo cargar la configuración.' }))
      })

    return () => {
      mounted = false
    }
  }, [])

  function applyConfigResponse(response: CommunicationConfigResponse) {
    const config = response.config
    setForm(prev => ({
      ...prev,
      loading: false,
      error: null,
      name: config.name ?? '',
      defaultFromEmail: config.defaultFromEmail ?? '',
      defaultFromName: config.defaultFromName ?? '',
      defaultReplyToEmail: config.defaultReplyToEmail ?? '',
      adminEmail: config.adminEmail ?? '',
      channels: buildChannelsState(config.channels),
    }))
  }

  const channelEntries = useMemo(() => Object.entries(form.channels) as Array<[CommunicationChannel, ChannelForm]>, [form.channels])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setForm(prev => ({ ...prev, saving: true, successMessage: null, error: null }))

    const payload: UpdateCommunicationConfigPayload = {
      name: form.name.trim() || null,
      defaultFromEmail: form.defaultFromEmail.trim() || null,
      defaultFromName: form.defaultFromName.trim() || null,
      defaultReplyToEmail: form.defaultReplyToEmail.trim() || null,
      adminEmail: form.adminEmail.trim() || null,
      channels: channelEntries.map(([channel, channelForm]) => {
        const credentials: Record<string, string | null> = {}
        for (const [key, value] of Object.entries(channelForm.credentials)) {
          if (value === '') {
            credentials[key] = null
          } else {
            credentials[key] = value
          }
        }

        return {
          channel,
          provider: channelForm.provider,
          isEnabled: channelForm.isEnabled,
          credentials,
        }
      }),
    }

    try {
      const response = await updateCommunicationConfigRequest(payload)
      applyConfigResponse(response)
      setForm(prev => ({ ...prev, saving: false, successMessage: 'Configuración guardada correctamente.' }))
    } catch (error) {
      setForm(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar la configuración.',
      }))
    }
  }

  if (form.loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
        <span className="text-sm text-slate-500">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Remitente predeterminado</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Nombre interno</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              disabled={form.saving}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Admin email</span>
            <input
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.adminEmail}
              onChange={event => setForm(prev => ({ ...prev, adminEmail: event.target.value }))}
              disabled={form.saving}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Email remitente</span>
            <input
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.defaultFromEmail}
              onChange={event => setForm(prev => ({ ...prev, defaultFromEmail: event.target.value }))}
              disabled={form.saving}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Nombre remitente</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.defaultFromName}
              onChange={event => setForm(prev => ({ ...prev, defaultFromName: event.target.value }))}
              disabled={form.saving}
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Responder a</span>
            <input
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.defaultReplyToEmail}
              onChange={event => setForm(prev => ({ ...prev, defaultReplyToEmail: event.target.value }))}
              disabled={form.saving}
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {channelEntries.map(([channel, channelForm]) => (
          <ChannelSettingsCard
            key={channel}
            channel={channel}
            form={channelForm}
            saving={form.saving}
            onChange={next =>
              setForm(prev => ({
                ...prev,
                channels: {
                  ...prev.channels,
                  [channel]: next,
                },
              }))
            }
          />
        ))}
      </div>

      {form.error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{form.error}</div>}
      {form.successMessage && <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{form.successMessage}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          disabled={form.saving}
        >
          {form.saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

interface ChannelSettingsCardProps {
  channel: CommunicationChannel
  form: ChannelForm
  saving: boolean
  onChange: (next: ChannelForm) => void
}

function ChannelSettingsCard({ channel, form, saving, onChange }: ChannelSettingsCardProps) {
  const fields = CHANNEL_FIELDS[channel] ?? []

  function updateCredential(key: string, value: string) {
    onChange({
      ...form,
      credentials: {
        ...form.credentials,
        [key]: value,
      },
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{CHANNEL_TITLES[channel]}</h4>
          <p className="text-sm text-slate-500">Configura credenciales y activa el canal.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-black">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={form.isEnabled}
            onChange={event => onChange({ ...form, isEnabled: event.target.checked })}
            disabled={saving}
          />
          Activo
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map(field => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-black">{field.label}</span>
            <input
              type={field.type === 'password' ? 'password' : 'text'}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.credentials[field.key] ?? ''}
              onChange={event => updateCredential(field.key, event.target.value)}
              placeholder={field.type === 'password' ? '••••••••' : ''}
              disabled={saving}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
