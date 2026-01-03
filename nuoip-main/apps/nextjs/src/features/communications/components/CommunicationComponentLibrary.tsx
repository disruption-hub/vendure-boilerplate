"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/stores'
import { Edit, Trash2, Plus, Search, Eye, EyeOff } from 'lucide-react'
import { renderTemplate } from '@/lib/communication/template-renderer'
import type { CommunicationChannelType } from '@/lib/communication/enums'

import {
  createComponentRequest,
  updateComponentRequest,
  listComponentCategoriesRequest,
  listComponentsRequest,
  type CommunicationComponentCategorySummary,
  type CommunicationComponentSummary,
} from '@/features/communications/api/communication-api'

interface ComponentFormState {
  open: boolean
  mode: 'create' | 'edit'
  componentId: number | null
  componentKey: string
  name: string
  description: string
  componentType: string
  channel: CommunicationChannelType | null
  categoryId: number | null
  markup: string
  isActive: boolean
  variablesJson: string
  metadataJson: string
}

const INITIAL_FORM: ComponentFormState = {
  open: false,
  mode: 'create',
  componentId: null,
  componentKey: '',
  name: '',
  description: '',
  componentType: 'content_block',
  channel: null,
  categoryId: null,
  markup: '',
  isActive: true,
  variablesJson: '{}',
  metadataJson: '{}',
}

export function CommunicationComponentLibrary() {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<CommunicationComponentCategorySummary[]>([])
  const [components, setComponents] = useState<CommunicationComponentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [form, setForm] = useState<ComponentFormState>(INITIAL_FORM)
  const [previewMode, setPreviewMode] = useState<'structure' | 'render'>('structure')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const [categoriesData, componentsData] = await Promise.all([
          listComponentCategoriesRequest(),
          listComponentsRequest(),
        ])
        if (!mounted) return
        setCategories(categoriesData)
        setComponents(componentsData)
      } catch (error) {
        console.error('Failed to load component library', error)
        toast.error('No se pudo cargar la biblioteca de componentes')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [])

  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      if (categoryFilter !== 'all' && component.categoryId !== categoryFilter) {
        return false
      }
      if (channelFilter !== 'all' && component.channel !== channelFilter) {
        return false
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase()
        return (
          component.name.toLowerCase().includes(query) ||
          component.componentKey.toLowerCase().includes(query) ||
          (component.description?.toLowerCase().includes(query) ?? false)
        )
      }
      return true
    })
  }, [categoryFilter, channelFilter, components, search])

  const parsedVariables = useMemo(() => {
    try {
      return form.variablesJson.trim() ? JSON.parse(form.variablesJson) : {}
    } catch {
      return null
    }
  }, [form.variablesJson])

  const parsedMetadata = useMemo(() => {
    try {
      return form.metadataJson.trim() ? JSON.parse(form.metadataJson) : {}
    } catch {
      return null
    }
  }, [form.metadataJson])

  const handleOpenCreate = useCallback(() => {
    setForm({ ...INITIAL_FORM, open: true, mode: 'create' })
  }, [])

  const handleOpenEdit = useCallback((component: CommunicationComponentSummary) => {
    setForm({
      open: true,
      mode: 'edit',
      componentId: component.id,
      componentKey: component.componentKey,
      name: component.name,
      description: component.description ?? '',
      componentType: component.componentType,
      channel: component.channel ?? null,
      categoryId: component.categoryId ?? null,
      markup: component.markup ?? '',
      isActive: component.isActive,
      variablesJson: JSON.stringify(component.variables ?? {}, null, 2),
      metadataJson: JSON.stringify(component.metadata ?? {}, null, 2),
    })
  }, [])

  const handleClose = useCallback(() => {
    setForm(INITIAL_FORM)
  }, [])

  const handleFieldChange = useCallback(<K extends keyof ComponentFormState>(field: K, value: ComponentFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.componentKey.trim()) {
      toast.error('El nombre y la clave son obligatorios')
      return
    }

    if (parsedVariables === null || parsedMetadata === null) {
      toast.error('Revisa el formato JSON de variables y metadatos')
      return
    }

    try {
      if (form.mode === 'create') {
        const component = await createComponentRequest({
          name: form.name.trim(),
          componentKey: form.componentKey.trim(),
          componentType: form.componentType.trim(),
          markup: form.markup.trim() || '<div>Nuevo componente</div>',
          description: form.description.trim() || null,
          categoryId: form.categoryId ?? null,
          channel: form.channel ?? null,
          isActive: form.isActive,
          variables: parsedVariables,
          metadata: parsedMetadata,
        })
        setComponents(prev => [...prev, component])
        toast.success('Componente creado correctamente')
      } else {
        const updated = await updateComponentRequest(form.componentId!, {
          name: form.name.trim(),
          componentKey: form.componentKey.trim(),
          componentType: form.componentType.trim(),
          markup: form.markup.trim(),
          description: form.description.trim() || null,
          categoryId: form.categoryId ?? null,
          channel: form.channel ?? null,
          isActive: form.isActive,
          variables: parsedVariables,
          metadata: parsedMetadata,
        })
        setComponents(prev => prev.map(c => (c.id === updated.id ? updated : c)))
        toast.success('Componente actualizado correctamente')
      }
      handleClose()
    } catch (error) {
      console.error('Failed to save component', error)
      toast.error('No se pudo guardar el componente')
    }
  }, [form, parsedVariables, parsedMetadata, handleClose])

  const previewMarkup = useMemo(() => {
    if (!form.markup) {
      return '<p class="text-gray-500">No hay markup</p>'
    }

    if (previewMode === 'render') {
      if (parsedVariables === null) {
        return '<p class="text-red-500">El JSON de variables no es válido.</p>'
      }

      try {
        return renderTemplate(form.markup, { variables: parsedVariables })
      } catch (error) {
        console.error('Failed to render template', error)
        return '<p class="text-red-500">Error al renderizar la plantilla</p>'
      }
    }

    return form.markup
  }, [form.markup, parsedVariables, previewMode])

  if (!mounted || loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Cargando biblioteca de componentes...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black">Biblioteca de Componentes</h2>
          <p className="text-sm text-slate-600">Gestiona componentes reutilizables para tus plantillas</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo Componente
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Buscar componentes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">Todas las categorías</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
        >
          <option value="all">Todos los canales</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="TELEGRAM">Telegram</option>
          <option value="INSTAGRAM">Instagram</option>
        </select>
      </div>

      {/* Components Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredComponents.length > 0 && filteredComponents.map(component => (
          <div
            key={component.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-black truncate">{component.name}</h3>
                <p className="text-xs text-slate-500 truncate">{component.componentKey}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {component.isActive ? (
                  <Eye className="h-4 w-4 text-emerald-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {component.description && (
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{component.description}</p>
            )}

            <div className="flex gap-2 text-xs mb-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                {component.componentType}
              </span>
              {component.channel && (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                  {component.channel}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(component)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
              >
                <Edit className="h-3 w-3" />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {!filteredComponents.length && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">No se encontraron componentes</p>
        </div>
      )}

      {/* Component Editor Modal */}
      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-black">
                {form.mode === 'create' ? 'Crear Componente' : 'Editar Componente'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-black">Nombre *</span>
                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={form.name}
                        onChange={e => handleFieldChange('name', e.target.value)}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-black">Clave única *</span>
                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={form.componentKey}
                        onChange={e => handleFieldChange('componentKey', e.target.value)}
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-black">Descripción</span>
                    <textarea
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      rows={2}
                      value={form.description}
                      onChange={e => handleFieldChange('description', e.target.value)}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-black">Tipo</span>
                      <input
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={form.componentType}
                        onChange={e => handleFieldChange('componentType', e.target.value)}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-black">Canal</span>
                      <select
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={form.channel ?? 'none'}
                        onChange={e =>
                          handleFieldChange(
                            'channel',
                            e.target.value === 'none' ? null : (e.target.value as CommunicationChannelType),
                          )}
                      >
                        <option value="none">Sin canal fijo</option>
                        <option value="EMAIL">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="TELEGRAM">Telegram</option>
                        <option value="INSTAGRAM">Instagram</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-black">Categoría</span>
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      value={form.categoryId ?? 'none'}
                      onChange={e => handleFieldChange('categoryId', e.target.value === 'none' ? null : Number(e.target.value))}
                    >
                      <option value="none">Sin categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={form.isActive}
                      onChange={e => handleFieldChange('isActive', e.target.checked)}
                    />
                    <span className="text-sm font-medium text-black">Componente activo</span>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-black">Markup HTML *</span>
                    <textarea
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      rows={8}
                      value={form.markup}
                      onChange={e => handleFieldChange('markup', e.target.value)}
                      spellCheck={false}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-black">Variables (JSON)</span>
                    <textarea
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      rows={4}
                      value={form.variablesJson}
                      onChange={e => handleFieldChange('variablesJson', e.target.value)}
                      spellCheck={false}
                    />
                    {parsedVariables === null && (
                      <p className="text-xs text-red-500">JSON inválido</p>
                    )}
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-black">Metadatos (JSON)</span>
                    <textarea
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      rows={4}
                      value={form.metadataJson}
                      onChange={e => handleFieldChange('metadataJson', e.target.value)}
                      spellCheck={false}
                    />
                    {parsedMetadata === null && (
                      <p className="text-xs text-red-500">JSON inválido</p>
                    )}
                  </label>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">Vista previa</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('structure')}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                          previewMode === 'structure'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('render')}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                          previewMode === 'render'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Render
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <iframe
                      title="component-preview"
                      className="w-full h-[600px]"
                      sandbox="allow-same-origin"
                      srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:Inter,system-ui,sans-serif;padding:16px;background-color:#f8fafc;color:#0f172a;margin:0;} .component{border:1px dashed #cbd5f5;border-radius:8px;padding:12px;margin-bottom:12px;background:#ffffff;}</style></head><body>${previewMarkup}</body></html>`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {form.mode === 'create' ? 'Crear Componente' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

