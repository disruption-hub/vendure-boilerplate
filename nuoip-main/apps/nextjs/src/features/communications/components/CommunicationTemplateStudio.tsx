"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { renderTemplate } from '@/lib/communication/template-renderer'
import { toast } from '@/stores'
import type { CommunicationChannelType } from '@/lib/communication/enums'

import {
  createComponentRequest,
  createCommunicationTemplate,
  getTemplateCompositionRequest,
  listCommunicationTemplates,
  listComponentCategoriesRequest,
  listComponentsRequest,
  type CommunicationComponentCategorySummary,
  type CommunicationComponentSummary,
  type CommunicationTemplateRecord,
  type TemplateCompositionItem,
  updateComponentRequest,
  updateTemplateCompositionRequest,
} from '@/features/communications/api/communication-api'

type CanvasItem = {
  id: string
  component: CommunicationComponentSummary
  slot?: string | null
  settings?: Record<string, unknown> | null
  persistedId?: number
}

interface ComponentEditorState {
  open: boolean
  componentId: number | null
  componentKey: string
  name: string
  description: string
  componentType: string
  channel: string | null
  categoryId: number | null
  markup: string
  isActive: boolean
  variablesJson: string
  metadataJson: string
}

const DEFAULT_PREVIEW_VARIABLES = {
  recipient: { firstName: 'Carla', lastName: 'Vega' },
  cta: { label: 'Abrir FlowBot', url: 'https://flowcast.chat' },
  appointment: { date: 'Martes 12 de noviembre · 15:00', time: '15:00', timezone: 'GMT-5' },
  security: { code: '842199', expiresIn: '5 minutos' },
  period: { label: 'Este mes' },
  brand: { name: 'FlowBot', currentYear: new Date().getFullYear() },
}

const DEFAULT_PREVIEW_JSON = JSON.stringify(DEFAULT_PREVIEW_VARIABLES, null, 2)

interface CreateComponentFormState {
  open: boolean
  name: string
  componentKey: string
  componentType: string
  markup: string
  description: string
  categoryId?: number | null
}

const INITIAL_FORM: CreateComponentFormState = {
  open: false,
  name: '',
  componentKey: '',
  componentType: 'content_block',
  markup: '',
  description: '',
  categoryId: undefined,
}

const INITIAL_COMPONENT_EDITOR: ComponentEditorState = {
  open: false,
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

const DEFAULT_TEMPLATE_HTML = '<div style="padding:24px 16px;text-align:center;font-family:Inter,system-ui,sans-serif;color:#0f172a;">Personaliza el contenido de tu plantilla desde el Template Studio.</div>'

const INITIAL_TEMPLATE_FORM = {
  open: false,
  name: '',
  templateKey: '',
  description: '',
  channel: 'EMAIL' as CommunicationChannelType,
  language: 'es',
  subject: '',
}

export function CommunicationTemplateStudio() {
  const [templates, setTemplates] = useState<CommunicationTemplateRecord[]>([])
  const [categories, setCategories] = useState<CommunicationComponentCategorySummary[]>([])
  const [components, setComponents] = useState<CommunicationComponentSummary[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingComposer, setLoadingComposer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateComponentFormState>(INITIAL_FORM)
  const [componentEditor, setComponentEditor] = useState<ComponentEditorState>(INITIAL_COMPONENT_EDITOR)
  const [componentPreviewMode, setComponentPreviewMode] = useState<'structure' | 'render'>('render')
  const [templateForm, setTemplateForm] = useState(INITIAL_TEMPLATE_FORM)
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  useEffect(() => {
    if (!componentEditor.open) {
      setComponentPreviewMode('render')
    }
  }, [componentEditor.open])
  const [previewMode, setPreviewMode] = useState<'structure' | 'render'>('render')
  const [variablesInput, setVariablesInput] = useState<string>(DEFAULT_PREVIEW_JSON)
  const [previewViewport, setPreviewViewport] = useState<'mobile' | 'desktop'>('desktop')

  useEffect(() => {
    setVariablesInput(DEFAULT_PREVIEW_JSON)
    setPreviewMode('render')
  }, [selectedTemplateId])

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

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  )

  const baseMarkup = useMemo(() => {
    if (!canvasItems.length) {
      console.log('[Template Studio] No canvas items')
      return ''
    }
    const markup = canvasItems
      .map(item => item.component.markup || '')
      .filter(Boolean)
      .join('\n')
    console.log('[Template Studio] Base markup generated:', { 
      itemsCount: canvasItems.length, 
      markupLength: markup.length,
      preview: markup.substring(0, 100) 
    })
    return markup
  }, [canvasItems])

  const parsedVariables = useMemo(() => {
    try {
      return variablesInput.trim() ? JSON.parse(variablesInput) : {}
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return null
    }
  }, [variablesInput])

  const previewMarkup = useMemo(() => {
    if (!baseMarkup) {
      console.log('[Template Studio] Preview: No base markup')
      return '<p class="text-gray-500 text-center py-10">No hay componentes seleccionados.</p>'
    }

    if (previewMode === 'render') {
      if (parsedVariables === null) {
        console.log('[Template Studio] Preview: Invalid variables JSON')
        return '<p class="text-red-500 text-center py-5 bg-red-50 rounded">El JSON de variables no es válido.</p>'
      }

      const rendered = renderTemplate(baseMarkup, {
        variables: parsedVariables,
      })
      console.log('[Template Studio] Preview rendered:', { 
        mode: 'render',
        baseMarkupLength: baseMarkup.length,
        renderedLength: rendered.length,
        preview: rendered.substring(0, 200)
      })
      return rendered
    }

    console.log('[Template Studio] Preview structure mode')
    return baseMarkup
  }, [baseMarkup, parsedVariables, previewMode])

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)
        const [templatesData, categoriesData, componentsData] = await Promise.all([
          listCommunicationTemplates(1),
          listComponentCategoriesRequest(),
          listComponentsRequest(),
        ])

        setTemplates(templatesData.templates)
        setCategories(categoriesData)
        setComponents(componentsData)

        if (templatesData.templates.length && !selectedTemplateId) {
          setSelectedTemplateId(templatesData.templates[0].id)
        }
      } catch (error) {
        console.error('Failed to load template studio data', error)
        toast.error('No se pudieron cargar los datos del estudio de plantillas')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedTemplateId) {
      console.log('[Template Studio] No template selected, clearing canvas')
      setCanvasItems([])
      return
    }

    async function loadComposition() {
      try {
        console.log('[Template Studio] Loading composition for template:', selectedTemplateId)
        setLoadingComposer(true)
        const composition = await getTemplateCompositionRequest(selectedTemplateId!)
        console.log('[Template Studio] Composition loaded:', { count: composition.length, items: composition })
        
        setCanvasItems(
          composition.map(item => ({
            id: `persisted-${item.id}`,
            component: item.component,
            slot: item.slot ?? undefined,
            settings: item.settings ?? undefined,
            persistedId: item.id,
          })),
        )
        console.log('[Template Studio] Canvas items set')
      } catch (error) {
        console.error('[Template Studio] Failed to load template composition:', error)
        // Don't show error toast if composition is just empty
        if (error instanceof Error && !error.message.includes('404')) {
          toast.error('No se pudo cargar la composición de la plantilla seleccionada')
        }
        // Set empty canvas on error
        setCanvasItems([])
      } finally {
        setLoadingComposer(false)
      }
    }

    void loadComposition()
  }, [selectedTemplateId])

  const handleAddComponent = useCallback(
    (component: CommunicationComponentSummary) => {
      setCanvasItems(prev => [
        ...prev,
        {
          id: `new-${component.id}-${Date.now()}`,
          component,
        },
      ])
    },
    [],
  )

  const handleRemoveComponent = useCallback((itemId: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const handleEditComponent = useCallback((component: CommunicationComponentSummary) => {
    setComponentEditor({
      open: true,
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
    setComponentPreviewMode('render')
  }, [])

  const handleCloseComponentEditor = useCallback(() => {
    setComponentEditor(INITIAL_COMPONENT_EDITOR)
  }, [])

  const handleComponentEditorField = useCallback(<K extends keyof ComponentEditorState>(field: K, value: ComponentEditorState[K]) => {
    setComponentEditor(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSlotChange = useCallback((itemId: string, value: string) => {
    setCanvasItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, slot: value || undefined } : item)),
    )
  }, [])

  const handleDragStart = useCallback((itemId: string) => {
    setDraggingId(itemId)
  }, [])

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, targetId: string) => {
      event.preventDefault()
      if (!draggingId || draggingId === targetId) {
        return
      }

      setCanvasItems(prev => {
        const sourceIndex = prev.findIndex(item => item.id === draggingId)
        const targetIndex = prev.findIndex(item => item.id === targetId)
        if (sourceIndex === -1 || targetIndex === -1) {
          return prev
        }

        const updated = [...prev]
        const [moved] = updated.splice(sourceIndex, 1)
        updated.splice(targetIndex, 0, moved)
        return updated
      })
    },
    [draggingId],
  )

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleCreateTemplate = useCallback(async () => {
    if (!templateForm.name.trim() || !templateForm.templateKey.trim()) {
      toast.error('Completa el nombre y la clave de la plantilla')
      return
    }

    setCreatingTemplate(true)
    const timestamp = new Date().toISOString()

    try {
      const content = baseMarkup || DEFAULT_TEMPLATE_HTML
      const result = await createCommunicationTemplate({
        templateKey: templateForm.templateKey.trim(),
        name: templateForm.name.trim(),
        channel: templateForm.channel,
        description: templateForm.description.trim() ? templateForm.description.trim() : null,
        translations: [
          {
            id: 0,
            language: templateForm.language.trim() || 'es',
            subject: templateForm.subject.trim() ? templateForm.subject.trim() : null,
            content,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      })

      setTemplates(prev => [result.template, ...prev.filter(template => template.id !== result.template.id)])
      setSelectedTemplateId(result.template.id)
      toast.success('Plantilla creada. Ahora puedes guardar la composición.')
      setTemplateForm(INITIAL_TEMPLATE_FORM)
    } catch (error) {
      console.error('Failed to create communication template', error)
      const message = error instanceof Error ? error.message : 'No se pudo crear la plantilla'
      toast.error(message)
    } finally {
      setCreatingTemplate(false)
    }
  }, [baseMarkup, templateForm])

  const handleMove = useCallback((itemId: string, direction: 'up' | 'down') => {
    setCanvasItems(prev => {
      const index = prev.findIndex(item => item.id === itemId)
      if (index === -1) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const updated = [...prev]
      const [moved] = updated.splice(index, 1)
      updated.splice(targetIndex, 0, moved)
      return updated
    })
  }, [])

  const handleSave = useCallback(async () => {
    console.log('[Template Studio] handleSave called', {
      selectedTemplateId,
      canvasItemsLength: canvasItems.length,
      canvasItems: canvasItems.map(item => ({
        id: item.id,
        componentId: item.component.id,
        componentName: item.component.name,
      })),
    })

    if (!selectedTemplateId) {
      console.log('[Template Studio] No template selected')
      toast.error('Selecciona una plantilla antes de guardar')
      return
    }

    // Allow saving empty compositions (to clear all components)
    const itemsToSave = canvasItems.map((item, index) => ({
      componentId: item.component.id,
      slot: item.slot ?? null,
      settings: item.settings ?? null,
      order: index,
    }))

    console.log('[Template Studio] Saving composition:', {
      templateId: selectedTemplateId,
      itemsCount: itemsToSave.length,
      items: itemsToSave,
    })

    try {
      setSaving(true)
      console.log('[Template Studio] Calling updateTemplateCompositionRequest...')
      const result = await updateTemplateCompositionRequest(selectedTemplateId, itemsToSave)
      console.log('[Template Studio] Save successful:', result)

      const normalizedItems: CanvasItem[] = (result as TemplateCompositionItem[]).map(item => ({
        id: `persisted-${item.id}`,
        component: item.component as CommunicationComponentSummary,
        slot: item.slot ?? undefined,
        settings: item.settings ?? undefined,
        persistedId: item.id,
      }))

      setCanvasItems(normalizedItems)
      toast.success(`Composición guardada: ${itemsToSave.length} componente${itemsToSave.length !== 1 ? 's' : ''}`)
    } catch (error) {
      console.error('[Template Studio] Failed to save template composition:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al guardar: ${errorMessage}`)
      
      // Show additional error details in console
      if (error instanceof Response) {
        error.text().then(text => console.error('[Template Studio] Error response body:', text))
      }
    } finally {
      setSaving(false)
      console.log('[Template Studio] Save operation completed')
    }
  }, [canvasItems, selectedTemplateId])

  const handleCreateComponent = useCallback(async () => {
    if (!form.name.trim() || !form.componentKey.trim() || !form.componentType.trim()) {
      toast.error('Completa los campos obligatorios del componente')
      return
    }

    try {
      const component = await createComponentRequest({
        name: form.name.trim(),
        componentKey: form.componentKey.trim(),
        componentType: form.componentType.trim(),
        markup: form.markup.trim() || '<div>Nuevo componente</div>',
        description: form.description.trim() || null,
        categoryId: form.categoryId ?? null,
      })

      setComponents(prev => [...prev, component])
      toast.success('Componente creado')
      setForm(INITIAL_FORM)
    } catch (error) {
      console.error('Failed to create component', error)
      toast.error('No se pudo crear el componente')
    }
  }, [form])

  const componentEditorParsedVariables = useMemo(() => {
    if (!componentEditor.open) return {}
    try {
      return componentEditor.variablesJson.trim() ? JSON.parse(componentEditor.variablesJson) : {}
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return null
    }
  }, [componentEditor.open, componentEditor.variablesJson])

  const componentEditorParsedMetadata = useMemo(() => {
    if (!componentEditor.open) return {}
    try {
      return componentEditor.metadataJson.trim() ? JSON.parse(componentEditor.metadataJson) : {}
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return null
    }
  }, [componentEditor.open, componentEditor.metadataJson])

  const componentVariablesInvalid = componentEditor.open && componentEditorParsedVariables === null
  const componentMetadataInvalid = componentEditor.open && componentEditorParsedMetadata === null

  const componentPreviewMarkup = useMemo(() => {
    if (!componentEditor.open) {
      return '<p class="text-gray-500">Selecciona un componente para editar.</p>'
    }

    const markup = componentEditor.markup?.trim()
    if (!markup) {
      return '<p class="text-gray-500">Este componente no tiene markup definido.</p>'
    }

    if (componentPreviewMode === 'render') {
      if (componentEditorParsedVariables === null) {
        return '<p class="text-red-500">El JSON de variables no es válido.</p>'
      }

      return renderTemplate(markup, {
        variables: componentEditorParsedVariables,
      })
    }

    return markup
  }, [componentEditor.markup, componentEditor.open, componentEditorParsedVariables, componentPreviewMode])

  const handleComponentUpdate = useCallback(async () => {
    if (!componentEditor.open || !componentEditor.componentId) {
      toast.error('Selecciona un componente para actualizar')
      return
    }

    if (componentEditorParsedVariables === null) {
      toast.error('Corrige el JSON de variables antes de guardar')
      return
    }

    if (componentEditorParsedMetadata === null) {
      toast.error('Corrige el JSON de metadatos antes de guardar')
      return
    }

    try {
      const updated = await updateComponentRequest(componentEditor.componentId, {
        componentKey: componentEditor.componentKey.trim(),
        name: componentEditor.name.trim(),
        componentType: componentEditor.componentType.trim(),
        description: componentEditor.description.trim() ? componentEditor.description.trim() : null,
        channel: componentEditor.channel ? (componentEditor.channel as any) : null,
        categoryId: componentEditor.categoryId,
        markup: componentEditor.markup,
        variables: componentEditorParsedVariables,
        metadata: componentEditorParsedMetadata,
        isActive: componentEditor.isActive,
      })

      setComponents(prev => prev.map(component => (component.id === updated.id ? updated : component)))
      setCanvasItems(prev =>
        prev.map(item =>
          item.component.id === updated.id
            ? {
                ...item,
                component: updated,
              }
            : item,
        ),
      )
      setComponentEditor(prev => ({
        ...prev,
        componentKey: updated.componentKey,
        name: updated.name,
        componentType: updated.componentType,
        description: updated.description ?? '',
        channel: updated.channel ?? null,
        categoryId: updated.categoryId ?? null,
        markup: updated.markup ?? '',
        isActive: updated.isActive,
        variablesJson: JSON.stringify(updated.variables ?? {}, null, 2),
        metadataJson: JSON.stringify(updated.metadata ?? {}, null, 2),
      }))
      toast.success('Componente actualizado correctamente')
    } catch (error) {
      console.error('Failed to update communication component', error)
      toast.error('No se pudo actualizar el componente')
    }
  }, [componentEditor, componentEditorParsedMetadata, componentEditorParsedVariables])

  const filteredCanvasItems = canvasItems

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Cargando Template Studio...
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-180px)] grid gap-4 lg:grid-cols-[260px_450px_1fr]">
      {/* Left Sidebar - Templates & Components */}
      <aside className="flex flex-col h-full space-y-3 overflow-hidden">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm flex-shrink-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Plantillas</h3>
            <button
              type="button"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              onClick={() => setTemplateForm(prev => ({ ...prev, open: !prev.open }))}
            >
              {templateForm.open ? 'Cerrar' : 'Nueva'}
            </button>
          </div>

          {templateForm.open && (
            <div className="space-y-2 border-b border-slate-100 px-3 pb-3 pt-2 text-[11px]">
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Nombre de la plantilla"
                value={templateForm.name}
                onChange={event => setTemplateForm(prev => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Clave única (template_key)"
                value={templateForm.templateKey}
                onChange={event => setTemplateForm(prev => ({ ...prev, templateKey: event.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                value={templateForm.channel}
                onChange={event => setTemplateForm(prev => ({ ...prev, channel: event.target.value as CommunicationChannelType }))}
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="INSTAGRAM">Instagram</option>
              </select>
              <textarea
                className="w-full min-h-[48px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Descripción (opcional)"
                value={templateForm.description}
                onChange={event => setTemplateForm(prev => ({ ...prev, description: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                  placeholder="Idioma (ej. es, en)"
                  value={templateForm.language}
                  onChange={event => setTemplateForm(prev => ({ ...prev, language: event.target.value }))}
                />
                <input
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                  placeholder="Asunto (opcional)"
                  value={templateForm.subject}
                  onChange={event => setTemplateForm(prev => ({ ...prev, subject: event.target.value }))}
                />
              </div>
              <p className="text-[10px] leading-snug text-slate-500">
                Si ya agregaste componentes al lienzo, se usarán como contenido inicial de la plantilla.
              </p>
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={creatingTemplate}
                className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  creatingTemplate ? 'bg-slate-300 text-slate-500 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {creatingTemplate ? 'Creando…' : 'Crear plantilla'}
              </button>
            </div>
          )}

          <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={`w-full rounded-lg px-2 py-2 text-left text-xs transition ${
                  selectedTemplateId === template.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-medium truncate">{template.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{template.templateKey}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">Componentes</h3>
            <button
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              onClick={() => setForm(prev => ({ ...prev, open: !prev.open }))}
              type="button"
            >
              {form.open ? 'Cerrar' : 'Nuevo'}
            </button>
          </div>

          <div className="p-2 space-y-2 flex-shrink-0">
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
              placeholder="Buscar componentes"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
              value={categoryFilter}
              onChange={event => {
                const value = event.target.value
                setCategoryFilter(value === 'all' ? 'all' : Number(value))
              }}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
              value={channelFilter}
              onChange={event => setChannelFilter(event.target.value)}
            >
              <option value="all">Todos los canales</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
              <option value="INSTAGRAM">Instagram</option>
            </select>
          </div>

          {form.open && (
            <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Nombre"
                value={form.name}
                onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Clave única"
                value={form.componentKey}
                onChange={event => setForm(prev => ({ ...prev, componentKey: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Tipo (p.ej. header, content_block)"
                value={form.componentType}
                onChange={event => setForm(prev => ({ ...prev, componentType: event.target.value }))}
              />
              <textarea
                className="w-full min-h-[60px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Markup HTML"
                value={form.markup}
                onChange={event => setForm(prev => ({ ...prev, markup: event.target.value }))}
              />
              <textarea
                className="w-full min-h-[40px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                placeholder="Descripción"
                value={form.description}
                onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-black"
                value={form.categoryId ?? 'none'}
                onChange={event => {
                  const value = event.target.value
                  setForm(prev => ({ ...prev, categoryId: value === 'none' ? null : Number(value) }))
                }}
              >
                <option value="none">Sin categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="w-full rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                onClick={handleCreateComponent}
              >
                Guardar componente
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredComponents.map(component => (
              <div
                key={component.id}
                className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-sm transition hover:border-indigo-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{component.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{component.componentKey}</div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                      component.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {component.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    className="flex-1 rounded border border-indigo-200 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50"
                    onClick={() => handleAddComponent(component)}
                  >
                    Añadir
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                    onClick={() => handleEditComponent(component)}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
            {!filteredComponents.length && (
              <p className="text-center text-[10px] text-slate-400">No hay componentes</p>
            )}
          </div>
        </section>
      </aside>

      {/* Main Canvas Area */}
      <main className="h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Lienzo</h2>
            {selectedTemplate && (
              <p className="text-[10px] text-slate-500">
                Canal: {selectedTemplate.channel} • Template ID: {selectedTemplateId}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                console.log('[Template Studio] Save button clicked', {
                  selectedTemplateId,
                  canvasItemsCount: canvasItems.length,
                  saving,
                })
                handleSave()
              }}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                saving
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
              aria-disabled={!selectedTemplateId}
              title={!selectedTemplateId ? 'Selecciona una plantilla antes de guardar' : undefined}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando…
                </>
              ) : (
                <>
                  💾 Guardar
                  {!selectedTemplateId && <span className="text-[10px]">(Selecciona plantilla)</span>}
                  {selectedTemplateId && canvasItems.length === 0 && <span className="text-[10px]">(Agrega componentes)</span>}
                </>
              )}
            </button>
          </div>
        </div>

        <div
          className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-y-auto"
        >
          {loadingComposer ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-500">
              Cargando composición…
            </div>
          ) : filteredCanvasItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-xs text-slate-400">
              <span>No hay componentes en esta plantilla.</span>
              <span>Selecciona un componente de la galería.</span>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {filteredCanvasItems.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={event => handleDragOver(event, item.id)}
                  className={`rounded-lg border border-slate-200 bg-slate-50 p-2 transition ${
                    draggingId === item.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{item.component.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.component.componentKey}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        className="rounded border border-blue-200 px-1.5 py-0.5 text-[10px] text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEditComponent(item.component)}
                        title="Editar componente"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-slate-400"
                        onClick={() => handleMove(item.id, 'up')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-slate-400"
                        onClick={() => handleMove(item.id, 'down')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-200 px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveComponent(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      placeholder="Slot opcional"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-[10px] text-black"
                      value={item.slot ?? ''}
                      onChange={event => handleSlotChange(item.id, event.target.value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Right Sidebar - Preview */}
      <aside className="h-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-800">Vista previa</h3>
          <p className="mt-1 text-[10px] text-slate-500">
            {canvasItems.length} componente{canvasItems.length !== 1 ? 's' : ''} • {previewMode === 'render' ? 'Renderizado' : 'HTML'}
          </p>
        </div>
        
        <div className="flex gap-1 p-2 border-b border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={() => setPreviewMode('structure')}
            className={`flex-1 rounded border px-2 py-1 text-[10px] font-semibold transition ${
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
            className={`flex-1 rounded border px-2 py-1 text-[10px] font-semibold transition ${
              previewMode === 'render'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            Render
          </button>
        </div>

        <div className="flex gap-1 p-2 border-b border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={() => setPreviewViewport('mobile')}
            className={`flex-1 rounded border px-2 py-1 text-[10px] font-semibold transition ${
              previewViewport === 'mobile'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            📱 Móvil
          </button>
          <button
            type="button"
            onClick={() => setPreviewViewport('desktop')}
            className={`flex-1 rounded border px-2 py-1 text-[10px] font-semibold transition ${
              previewViewport === 'desktop'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            🖥️ Escritorio
          </button>
        </div>
        
        {previewMode === 'render' && (
          <div className="p-2 border-b border-slate-100 flex-shrink-0">
            <label className="text-[10px] font-semibold text-slate-600">
              Variables JSON
              <textarea
                className="mt-1 h-24 w-full rounded border border-slate-200 px-2 py-1 text-[10px] font-mono text-black"
                value={variablesInput}
                onChange={event => setVariablesInput(event.target.value)}
                spellCheck={false}
              />
            </label>
            {parsedVariables === null && (
              <p className="text-[10px] text-red-500 mt-1">JSON inválido</p>
            )}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-4">
          <div className={`bg-white shadow-lg rounded-lg transition-all duration-300 mx-auto ${
            previewViewport === 'mobile' 
              ? 'w-[375px] h-[667px]' 
              : 'w-full h-full'
          }`}>
            <iframe
              key={`preview-${previewMode}-${baseMarkup.substring(0, 50)}`}
              title="preview"
              className="w-full h-full border-0 rounded-lg"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: Inter, system-ui, -apple-system, sans-serif; 
      line-height: 1.6;
      padding: 20px;
      color: #0f172a;
      background: #f8fafc;
    }
    img { max-width: 100%; height: auto; display: block; }
    table { width: 100%; border-collapse: collapse; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    p { margin-bottom: 1em; }
    h1, h2, h3, h4 { margin-top: 1em; margin-bottom: 0.5em; }
  </style>
</head>
<body>${previewMarkup}</body>
</html>`}
            />
          </div>
        </div>
      </aside>

      {/* Component Editor Modal */}
      {componentEditor.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">Editar Componente</h3>
              <button
                type="button"
                onClick={handleCloseComponentEditor}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left Column - Editor */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
                      value={componentEditor.name}
                      onChange={e => handleComponentEditorField('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Clave</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
                      value={componentEditor.componentKey}
                      onChange={e => handleComponentEditorField('componentKey', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
                      value={componentEditor.componentType}
                      onChange={e => handleComponentEditorField('componentType', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
                      value={componentEditor.channel ?? ''}
                      onChange={e => handleComponentEditorField('channel', e.target.value || null)}
                    >
                      <option value="">Sin canal</option>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="TELEGRAM">Telegram</option>
                      <option value="INSTAGRAM">Instagram</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
                      value={componentEditor.categoryId ?? ''}
                      onChange={e => handleComponentEditorField('categoryId', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Sin categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-black"
                      rows={2}
                      value={componentEditor.description}
                      onChange={e => handleComponentEditorField('description', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Markup HTML</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-black"
                      rows={8}
                      value={componentEditor.markup}
                      onChange={e => handleComponentEditorField('markup', e.target.value)}
                      spellCheck={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Variables JSON
                      {componentVariablesInvalid && <span className="text-red-500 ml-2">JSON inválido</span>}
                    </label>
                    <textarea
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-black ${
                        componentVariablesInvalid ? 'border-red-300' : 'border-slate-300'
                      }`}
                      rows={4}
                      value={componentEditor.variablesJson}
                      onChange={e => handleComponentEditorField('variablesJson', e.target.value)}
                      spellCheck={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Metadata JSON
                      {componentMetadataInvalid && <span className="text-red-500 ml-2">JSON inválido</span>}
                    </label>
                    <textarea
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-black ${
                        componentMetadataInvalid ? 'border-red-300' : 'border-slate-300'
                      }`}
                      rows={4}
                      value={componentEditor.metadataJson}
                      onChange={e => handleComponentEditorField('metadataJson', e.target.value)}
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="component-active"
                      checked={componentEditor.isActive}
                      onChange={e => handleComponentEditorField('isActive', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="component-active" className="text-sm font-medium text-slate-700">
                      Componente activo
                    </label>
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setComponentPreviewMode('structure')}
                      className={`flex-1 rounded border px-3 py-2 text-xs font-semibold transition ${
                        componentPreviewMode === 'structure'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setComponentPreviewMode('render')}
                      className={`flex-1 rounded border px-3 py-2 text-xs font-semibold transition ${
                        componentPreviewMode === 'render'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      Render
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 min-h-[500px] overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: componentPreviewMarkup }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseComponentEditor}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleComponentUpdate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
