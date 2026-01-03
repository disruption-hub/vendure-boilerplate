"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createCommunicationTemplate,
  deleteCommunicationTemplateRequest,
  listCommunicationTemplates,
  updateCommunicationTemplateRequest,
  type CommunicationChannel,
  type CommunicationTemplateRecord,
  type CommunicationTemplateTranslation,
} from '@/features/communications/api/communication-api'

interface TemplatesState {
  loading: boolean
  error: string | null
  templates: CommunicationTemplateRecord[]
  page: number
  totalPages: number
}

const INITIAL_STATE: TemplatesState = {
  loading: true,
  error: null,
  templates: [],
  page: 1,
  totalPages: 1,
}

type ModalState =
  | { mode: 'create'; template: null }
  | { mode: 'edit'; template: CommunicationTemplateRecord }
  | null

const CHANNEL_OPTIONS: Array<{ value: CommunicationChannel; label: string }> = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
]

export function CommunicationTemplatesManager() {
  const [state, setState] = useState<TemplatesState>(INITIAL_STATE)
  const [modal, setModal] = useState<ModalState>(null)

  const loadTemplates = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await listCommunicationTemplates(state.page)
      setState(prev => ({
        ...prev,
        loading: false,
        templates: response.templates,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'No se pudieron cargar las plantillas.',
      }))
    }
  }, [state.page])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  async function handleDelete(template: CommunicationTemplateRecord) {
    if (!confirm(`¿Eliminar la plantilla “${template.name}”?`)) {
      return
    }

    try {
      await deleteCommunicationTemplateRequest(template.id)
      await loadTemplates()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'No se pudo eliminar la plantilla.',
      }))
    }
  }

  const tableRows = useMemo(() => state.templates, [state.templates])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Plantillas</h3>
          <p className="text-sm text-slate-500">Gestiona contenidos reutilizables para cada canal.</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create', template: null })}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Nueva plantilla
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Canal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Clave</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.loading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                  Cargando plantillas...
                </td>
              </tr>
            )}

            {!state.loading && tableRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                  No hay plantillas registradas.
                </td>
              </tr>
            )}

            {tableRows.map(template => (
              <tr key={template.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{template.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{template.channel}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{template.templateKey}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="inline-flex gap-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-500"
                      onClick={() => setModal({ mode: 'edit', template })}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-500"
                      onClick={() => handleDelete(template)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TemplatesPagination
        page={state.page}
        totalPages={state.totalPages}
        onPageChange={page => setState(prev => ({ ...prev, page }))}
      />

      {state.error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</div>}

      {modal && (
        <TemplateModal
          mode={modal.mode}
          template={modal.template ?? undefined}
          onClose={() => setModal(null)}
          onSave={async values => {
            if (modal.mode === 'create') {
              await createCommunicationTemplate(values)
            } else if (modal.template) {
              await updateCommunicationTemplateRequest(modal.template.id, values)
            }
            setModal(null)
            await loadTemplates()
          }}
        />
      )}
    </div>
  )
}

interface TemplateModalProps {
  mode: 'create' | 'edit'
  template?: CommunicationTemplateRecord
  onClose: () => void
  onSave: (payload: {
    templateKey: string
    name: string
    channel: CommunicationChannel
    description?: string | null
    translations: CommunicationTemplateTranslation[]
  }) => Promise<void>
}

function TemplateModal({ mode, template, onClose, onSave }: TemplateModalProps) {
  const initialTranslation = template?.translations[0]
  const [form, setForm] = useState({
    templateKey: template?.templateKey ?? '',
    name: template?.name ?? '',
    channel: template?.channel ?? 'EMAIL',
    description: template?.description ?? '',
    language: initialTranslation?.language ?? 'es',
    subject: initialTranslation?.subject ?? '',
    content: initialTranslation?.content ?? '',
    saving: false,
    error: '',
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setForm(prev => ({ ...prev, saving: true, error: '' }))

    if (!form.templateKey.trim() || !form.name.trim()) {
      setForm(prev => ({ ...prev, saving: false, error: 'Completa los campos obligatorios.' }))
      return
    }

    try {
      await onSave({
        templateKey: form.templateKey.trim(),
        name: form.name.trim(),
        channel: form.channel,
        description: form.description.trim() || null,
        translations: [
          {
            id: initialTranslation?.id ?? 0,
            language: form.language,
            subject: form.subject.trim() || null,
            content: form.content,
            createdAt: initialTranslation?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      })
    } catch (error) {
      setForm(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar la plantilla.',
      }))
      return
    }

    setForm(prev => ({ ...prev, saving: false }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{mode === 'create' ? 'Nueva plantilla' : 'Editar plantilla'}</h3>
            <p className="text-sm text-slate-500">Define contenido y traducción principal.</p>
          </div>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-black">Clave</span>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.templateKey}
                onChange={event => setForm(prev => ({ ...prev, templateKey: event.target.value }))}
                disabled={form.saving || mode === 'edit'}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-black">Nombre</span>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.name}
                onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                disabled={form.saving}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-black">Canal</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.channel}
                onChange={event => setForm(prev => ({ ...prev, channel: event.target.value as CommunicationChannel }))}
                disabled={form.saving}
              >
                {CHANNEL_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-black">Idioma</span>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={form.language}
                onChange={event => setForm(prev => ({ ...prev, language: event.target.value }))}
                disabled={form.saving}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Descripción</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.description}
              onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
              disabled={form.saving}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Asunto</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.subject}
              onChange={event => setForm(prev => ({ ...prev, subject: event.target.value }))}
              disabled={form.saving}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">Contenido HTML / Markdown</span>
            <textarea
              className="min-h-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={form.content}
              onChange={event => setForm(prev => ({ ...prev, content: event.target.value }))}
              disabled={form.saving}
            />
          </label>

          {form.error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{form.error}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600" onClick={onClose} disabled={form.saving}>
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              disabled={form.saving}
            >
              {form.saving ? 'Guardando…' : 'Guardar plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface TemplatesPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function TemplatesPagination({ page, totalPages, onPageChange }: TemplatesPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
      <button
        className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button
        className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Siguiente
      </button>
    </div>
  )
}
