"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Clock, Plus, Save, Trash2 } from 'lucide-react'
import type {
  FlowCategory,
  FlowConfig,
  FlowConfigInput,
  FlowMessageMap,
  FlowMessageValue,
  FlowOverlayConfig,
  FlowOverlayEdgeConfig,
  FlowOverlayNodeConfig,
  FlowQuickActionConfig,
} from '@/lib/chatbot/flow-config/types'
import type { ConversationStep, IntentType } from '@/lib/chatbot/types'
import type { SupportedLanguage } from '@/lib/chatbot/language-detector'
import { getChatbotFlowConfig, updateChatbotFlowConfig } from '@/features/admin/api/admin-api'
import { useFlowDesignerStore } from '@/features/admin/stores/flow-designer-store'
import { toast } from '@/stores'

type DesignerSection = 'messages' | 'states' | 'intents' | 'overlays' | 'quickActions'
type DraftMutator = (mutator: (draft: FlowConfig) => void) => void

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
}

const flowCategories: Array<{ value: FlowCategory; label: string }> = [
  { value: 'core', label: 'Core Journey' },
  { value: 'profile', label: 'Profile Capture' },
  { value: 'appointment', label: 'Scheduling' },
  { value: 'payment', label: 'Payments' },
  { value: 'knowledge', label: 'Knowledge' },
]

const nodeShapes: Array<{ value: NonNullable<FlowOverlayNodeConfig['shape']>; label: string }> = [
  { value: 'rounded', label: 'Rounded Rectangle' },
  { value: 'stadium', label: 'Stadium' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Decision' },
]

const shapeFallbackLabel = 'Default (auto)'

function cloneConfig(config: FlowConfig): FlowConfig {
  return JSON.parse(JSON.stringify(config))
}

function generateOverlayId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

function generateQuickActionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

function ensureMessage(map: FlowMessageMap, language: SupportedLanguage) {
  if (!Object.prototype.hasOwnProperty.call(map, language)) {
    map[language] = ''
  }
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return '—'
  }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString()
}

function hasContent(value: FlowMessageValue | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some(item => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return false
}

function collectValidationWarnings(config: FlowConfig | null): string[] {
  if (!config) {
    return []
  }

  const warnings: string[] = []

  Object.entries(config.states).forEach(([step, state]) => {
    if (!state.description?.trim()) {
      warnings.push(`State ${step} is missing a description`)
    }
  })

  Object.entries(config.messages).forEach(([key, map]) => {
    const values = Object.values(map ?? {})
    if (!values.some(value => hasContent(value))) {
      warnings.push(`Message "${key}" has no active content`)
    }
  })

  config.overlays.forEach(overlay => {
    if (!overlay.name?.trim()) {
      warnings.push(`Overlay ${overlay.id} is missing a name`)
    }
    if (!overlay.nodes.length) {
      warnings.push(`Overlay "${overlay.name || overlay.id}" has no nodes`)
    }
    overlay.nodes.forEach(node => {
      if (!node.title?.trim()) {
        warnings.push(`Overlay node ${node.id} requires a title`)
      }
      if (!node.description?.trim()) {
        warnings.push(`Overlay node ${node.id} requires a description`)
      }
    })
    overlay.edges.forEach(edge => {
      if (!edge.from?.trim() || !edge.to?.trim()) {
        warnings.push(`Overlay "${overlay.name || overlay.id}" has an edge with missing endpoints`)
      }
    })
  })

  config.quickActions.forEach(action => {
    if (!action.labels || !Object.values(action.labels).some(label => label && label.trim())) {
      warnings.push(`Quick action ${action.id} requires at least one label`)
    }
    if (!action.action?.trim()) {
      warnings.push(`Quick action ${action.id} requires an action payload`)
    }
  })

  return warnings
}

function summarizeChanges(original: FlowConfig | null, updated: FlowConfig | null): string[] {
  if (!original || !updated) {
    return []
  }

  const summary: string[] = []

  const allSteps = Array.from(
    new Set([
      ...Object.keys(original.states),
      ...Object.keys(updated.states),
    ]),
  ) as ConversationStep[]

  allSteps.forEach(step => {
    const originalDesc = original.states[step]?.description ?? ''
    const updatedDesc = updated.states[step]?.description ?? ''
    if (originalDesc !== updatedDesc) {
      summary.push(`State ${step} description updated`)
    }

    const originalCategory = original.categories?.[step]
    const updatedCategory = updated.categories?.[step]
    if (originalCategory !== updatedCategory) {
      summary.push(`State ${step} category set to ${updatedCategory ?? 'default'}`)
    }

    const originalShape = original.shapes?.[step]
    const updatedShape = updated.shapes?.[step]
    if (originalShape !== updatedShape) {
      summary.push(`State ${step} shape set to ${updatedShape ?? 'default'}`)
    }
  })

  const messageKeys = new Set([
    ...Object.keys(original.messages ?? {}),
    ...Object.keys(updated.messages ?? {}),
  ])

  messageKeys.forEach(key => {
    const before = JSON.stringify(original.messages[key] ?? {})
    const after = JSON.stringify(updated.messages[key] ?? {})
    if (before !== after) {
      summary.push(`Message "${key}" adjusted`)
    }
  })

  const intentKeys = new Set<IntentType | 'ANY'>([
    ...(Object.keys(original.intentLabels || {}) as Array<IntentType | 'ANY'>),
    ...(Object.keys(updated.intentLabels || {}) as Array<IntentType | 'ANY'>),
  ])

  intentKeys.forEach(intent => {
    const before = original.intentLabels?.[intent]
    const after = updated.intentLabels?.[intent]
    if (before !== after) {
      summary.push(`Intent label ${intent} changed to "${after ?? 'default'}"`)
    }
  })

  const originalOverlays = new Map(original.overlays.map(entry => [entry.id, entry]))
  const updatedOverlays = new Map(updated.overlays.map(entry => [entry.id, entry]))

  updatedOverlays.forEach((overlay, id) => {
    if (!originalOverlays.has(id)) {
      summary.push(`Added overlay "${overlay.name || id}"`)
      return
    }
    const before = originalOverlays.get(id)!
    if (JSON.stringify(before) !== JSON.stringify(overlay)) {
      summary.push(`Updated overlay "${overlay.name || id}"`)
    }
  })

  originalOverlays.forEach((overlay, id) => {
    if (!updatedOverlays.has(id)) {
      summary.push(`Removed overlay "${overlay.name || id}"`)
    }
  })

  const originalQuickActions = new Map(original.quickActions.map(entry => [entry.id, entry]))
  const updatedQuickActions = new Map(updated.quickActions.map(entry => [entry.id, entry]))

  updatedQuickActions.forEach((action, id) => {
    if (!originalQuickActions.has(id)) {
      summary.push(`Added quick action "${action.labels?.en || action.labels?.es || id}"`)
      return
    }
    const before = originalQuickActions.get(id)!
    if (JSON.stringify(before) !== JSON.stringify(action)) {
      summary.push(`Updated quick action "${action.labels?.en || action.labels?.es || id}"`)
    }
  })

  originalQuickActions.forEach((action, id) => {
    if (!updatedQuickActions.has(id)) {
      summary.push(`Removed quick action "${action.labels?.en || action.labels?.es || id}"`)
    }
  })

  if (summary.length > 12) {
    const trimmed = summary.slice(0, 12)
    trimmed.push(`…and ${summary.length - 12} more changes`)
    return trimmed
  }

  return summary
}

interface MessageEditorProps {
  config: FlowConfig
  onMutate: DraftMutator
}

function MessageEditor({ config, onMutate }: MessageEditorProps) {
  const messageKeys = useMemo(() => Object.keys(config.messages).sort(), [config.messages])
  const [selectedKey, setSelectedKey] = useState<string>(messageKeys[0] ?? '')

  useEffect(() => {
    if (!selectedKey && messageKeys.length > 0) {
      setSelectedKey(messageKeys[0]!)
    }
    if (selectedKey && !messageKeys.includes(selectedKey) && messageKeys.length > 0) {
      setSelectedKey(messageKeys[0]!)
    }
  }, [selectedKey, messageKeys])

  if (!selectedKey) {
    return (
      <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-6 text-sm text-[color:var(--admin-card-muted-text)]">
        No messages available to edit.
      </div>
    )
  }

  const defaultMessages = (config?.messages || {}) as Record<string, FlowMessageMap>

  const handleValueChange = (language: SupportedLanguage, value: string) => {
    onMutate(draft => {
      const baseValue =
        draft.messages[selectedKey]?.[language] ??
        config.messages[selectedKey]?.[language] ??
        defaultMessages[selectedKey]?.[language]

      const shouldUseArray = Array.isArray(baseValue)
      const entry: FlowMessageMap = { ...(draft.messages[selectedKey] ?? {}) }
      ensureMessage(entry, language)

      if (shouldUseArray) {
        entry[language] = value
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
      } else {
        entry[language] = value
      }

      draft.messages[selectedKey] = entry
    })
  }

  const selectedEntry = config.messages[selectedKey] ?? {}

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] p-4">
        <h4 className="text-sm font-semibold text-[color:var(--admin-card-header-text)]">Message library</h4>
        <p className="mt-1 text-xs text-[color:var(--admin-card-muted-text)]">Select a prompt to edit per language.</p>
        <div className="mt-4 grid max-h-[360px] gap-2 overflow-y-auto text-sm">
          {messageKeys.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-navigation-active-indicator)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--admin-surface-alt)] ${
                selectedKey === key
                  ? 'border-[color:var(--admin-navigation-active-indicator)] bg-[color:var(--admin-navigation-active-background)] text-[color:var(--admin-navigation-active-text)]'
                  : 'border-[color:var(--admin-border)] text-[color:var(--admin-card-text)] hover:border-[color:var(--admin-navigation-active-indicator)]'
              }`}
            >
              <span className="block font-medium">{key}</span>
              <span className="mt-0.5 block text-xs text-[color:var(--admin-card-muted-text)]">
                {typeof selectedEntry.en === 'string' ? selectedEntry.en.slice(0, 64) : '—'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[color:var(--admin-card-header-text)]">{selectedKey}</span>
            <span className="text-xs text-[color:var(--admin-card-muted-text)]">
              Update the chatbot replies. Arrays (like retries) should be separated by new lines.
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(Object.keys(languageLabels) as SupportedLanguage[]).map(language => {
              const value = selectedEntry?.[language]
              const displayValue = value instanceof RegExp
                ? value.source
                : Array.isArray(value)
                  ? value.join('\n')
                  : (value ?? '')

              return (
                <label key={language} className="flex flex-col gap-2 text-sm text-[color:var(--admin-card-header-text)]">
                  <span>{languageLabels[language]}</span>
                  <textarea
                    value={displayValue}
                    onChange={event => handleValueChange(language, event.target.value)}
                    className="min-h-[140px] rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                  />
                  <span className="text-xs text-[color:var(--admin-card-muted-text)]">
                    Supports template tokens like {'{name}'} or multiline content.
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StateEditorProps {
  config: FlowConfig
  onMutate: DraftMutator
}

function StateEditor({ config, onMutate }: StateEditorProps) {
  const steps = useMemo(() => Object.keys(config.states) as ConversationStep[], [config.states])
  const defaultCategories = config?.categories || {}
  const defaultShapes = config?.shapes || {}

  const handleDescriptionChange = (step: ConversationStep, description: string) => {
    onMutate(draft => {
      draft.states[step] = { description }
    })
  }

  const handleCategoryChange = (step: ConversationStep, category: FlowCategory | '') => {
    onMutate(draft => {
      if (!category) {
        delete draft.categories[step]
      } else {
        draft.categories[step] = category
      }
    })
  }

  const handleShapeChange = (step: ConversationStep, shape: FlowOverlayNodeConfig['shape'] | '') => {
    onMutate(draft => {
      if (!shape) {
        delete draft.shapes[step]
      } else {
        draft.shapes[step] = shape
      }
    })
  }

  return (
    <div className="space-y-4">
      {steps.map(step => {
        const currentCategory = config.categories[step] ?? defaultCategories[step] ?? 'core'
        const currentShape = config.shapes[step] ?? defaultShapes[step]

        return (
          <details key={step} className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-4" open>
            <summary className="flex cursor-pointer flex-col gap-0.5 text-sm font-semibold text-[color:var(--admin-card-header-text)]">
              <span>{step}</span>
              <span className="text-xs font-medium text-[color:var(--admin-card-muted-text)]">
                {`Category: ${currentCategory} · Shape: ${currentShape ?? 'default'}`}
              </span>
            </summary>

            <div className="mt-3 space-y-3 px-1 pb-1">
              <textarea
                value={config.states[step]?.description ?? ''}
                onChange={event => handleDescriptionChange(step, event.target.value)}
                className="w-full rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                  Category
                  <select
                    value={config.categories[step] ?? ''}
                    onChange={event => handleCategoryChange(step, event.target.value as FlowCategory | '')}
                    className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                  >
                    <option value="">{`Default (${defaultCategories[step] ?? 'core'})`}</option>
                    {flowCategories.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                  Shape
                  <select
                    value={config.shapes[step] ?? ''}
                    onChange={event => handleShapeChange(step, event.target.value as FlowOverlayNodeConfig['shape'] | '')}
                    className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                  >
                    <option value="">{`Default (${defaultShapes[step] ?? 'auto'})`}</option>
                    {nodeShapes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}

interface IntentEditorProps {
  config: FlowConfig
  onMutate: DraftMutator
}

function IntentEditor({ config, onMutate }: IntentEditorProps) {
  const intents = useMemo(() => {
    const keys = new Set<IntentType | 'ANY'>([
      ...(Object.keys(config?.intentLabels || {}) as Array<IntentType | 'ANY'>),
      ...(Object.keys(config.intentLabels) as Array<IntentType | 'ANY'>),
    ])
    return Array.from(keys).sort()
  }, [config.intentLabels])

  return (
    <div className="space-y-3">
      {intents.map(intent => {
        const defaultLabel = config?.intentLabels?.[intent] ?? intent
        const override = config.intentLabels[intent] ?? ''
        const effective = override || defaultLabel

        return (
          <details key={intent} className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-4" open={Boolean(override)}>
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[color:var(--admin-card-header-text)]">
              <span>{intent}</span>
              <span className="text-xs font-medium text-[color:var(--admin-card-muted-text)]">
                {override ? 'Custom label' : 'Using default'}
              </span>
            </summary>

            <div className="mt-3 space-y-2">
              <input
                value={effective}
                onChange={event => {
                  const value = event.target.value
                  onMutate(draft => {
                    if (!value.trim()) {
                      delete draft.intentLabels[intent]
                    } else {
                      draft.intentLabels[intent] = value
                    }
                  })
                }}
                className="w-full rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--admin-card-muted-text)]">
                <span>Default: {defaultLabel}</span>
                <button
                  type="button"
                  onClick={() => onMutate(draft => { delete draft.intentLabels[intent] })}
                  className="inline-flex items-center rounded-full border border-[color:var(--admin-border)] px-3 py-1 font-semibold text-[color:var(--admin-card-muted-text)] hover:border-[color:var(--admin-navigation-active-indicator)] hover:text-[color:var(--admin-navigation-active-text)]"
                >
                  Reset
                </button>
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}

interface QuickActionsEditorProps {
  config: FlowConfig
  onMutate: DraftMutator
}

function QuickActionsEditor({ config, onMutate }: QuickActionsEditorProps) {
  const quickActions = config.quickActions ?? []
  const quickActionMap = new Map((config.quickActions || []).map(action => [action.id, action] as const))
  const knownQuickActionOptions = (config.quickActions || []).map(action => ({
    value: action.id,
    label: action.labels?.en ?? action.id,
  }))

  const applyKnownQuickActionTemplate = (index: number, identifier: string) => {
    onMutate(draft => {
      if (!Array.isArray(draft.quickActions)) {
        draft.quickActions = []
      }

      const entry = draft.quickActions[index]
      if (!entry) {
        return
      }

      entry.id = identifier

      const template = quickActionMap.get(identifier)
      if (template) {
        entry.action = template.action
        entry.labels = {
          ...(template.labels ?? {}),
          ...(entry.labels ?? {}),
        }
      }
    })
  }

  const addQuickAction = () => {
    onMutate(draft => {
      const existing = Array.isArray(draft.quickActions) ? draft.quickActions : []
      draft.quickActions = [
        ...existing,
        {
          id: `quick-${generateQuickActionId()}`,
          action: '',
          labels: {
            en: '',
            es: '',
          },
        },
      ]
    })
  }

  const updateQuickAction = (index: number, patch: Partial<FlowQuickActionConfig>) => {
    onMutate(draft => {
      if (!Array.isArray(draft.quickActions)) {
        draft.quickActions = []
      }
      const entry = draft.quickActions[index]
      if (!entry) {
        return
      }
      draft.quickActions[index] = {
        ...entry,
        ...patch,
        labels: {
          ...entry.labels,
          ...(patch.labels ?? {}),
        },
      }
    })
  }

  const updateQuickActionLabel = (index: number, language: SupportedLanguage, value: string) => {
    onMutate(draft => {
      if (!Array.isArray(draft.quickActions)) {
        draft.quickActions = []
      }
      const entry = draft.quickActions[index]
      if (!entry) {
        return
      }
      draft.quickActions[index] = {
        ...entry,
        labels: {
          ...entry.labels,
          [language]: value,
        },
      }
    })
  }

  const removeQuickAction = (index: number) => {
    onMutate(draft => {
      if (!Array.isArray(draft.quickActions)) {
        draft.quickActions = []
        return
      }
      draft.quickActions = draft.quickActions.filter((_, idx) => idx !== index)
    })
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={addQuickAction}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[color:var(--admin-border)] px-4 py-2 text-sm font-semibold text-[color:var(--admin-navigation-text)] hover:border-[color:var(--admin-navigation-active-indicator)] hover:text-[color:var(--admin-navigation-active-text)]"
      >
        <Plus className="h-4 w-4" />
        Add quick action
      </button>

      {quickActions.length === 0 ? (
        <p className="text-sm text-[color:var(--admin-card-muted-text)]">No quick actions configured yet.</p>
      ) : (
        <div className="space-y-4">
          {quickActions.map((action, index) => (
            <div key={action.id} className="space-y-4 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                    Action payload
                    <input
                      value={action.action}
                      onChange={event => updateQuickAction(index, { action: event.target.value })}
                      className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                    Identifier
                    <input
                      value={action.id}
                      onChange={event => updateQuickAction(index, { id: event.target.value })}
                      className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                    />
                    <select
                      value={knownQuickActionOptions.some(option => option.value === action.id) ? action.id : ''}
                      onChange={event => {
                        const { value } = event.target
                        if (!value) {
                          return
                        }
                        applyKnownQuickActionTemplate(index, value)
                      }}
                      className="mt-2 rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                    >
                      <option value="">Custom identifier</option>
                      {knownQuickActionOptions.map(option => {
                        const isUsedElsewhere = quickActions.some((entry, entryIndex) => entryIndex !== index && entry.id === option.value)
                        return (
                          <option key={option.value} value={option.value} disabled={isUsedElsewhere}>
                            {`${option.label} (${option.value})`}
                          </option>
                        )
                      })}
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeQuickAction(index)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(languageLabels) as SupportedLanguage[]).map(language => (
                  <label key={language} className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                    Label ({languageLabels[language]})
                    <input
                      value={action.labels?.[language] ?? ''}
                      onChange={event => updateQuickActionLabel(index, language, event.target.value)}
                      className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface OverlayEditorProps {
  config: FlowConfig
  steps: ConversationStep[]
  onMutate: DraftMutator
}

function OverlayEditor({ config, steps, onMutate }: OverlayEditorProps) {
  const overlays = config.overlays ?? []

  const addOverlay = () => {
    onMutate(draft => {
      draft.overlays = [
        ...draft.overlays,
        {
          id: `overlay-${generateOverlayId()}`,
          name: 'New Overlay',
          description: '',
          enabled: true,
          nodes: [],
          edges: [],
        },
      ]
    })
  }

  const updateOverlay = (index: number, patch: Partial<FlowOverlayConfig>) => {
    onMutate(draft => {
      const overlay = draft.overlays[index]
      if (!overlay) {
        return
      }
      draft.overlays[index] = { ...overlay, ...patch }
    })
  }

  const removeOverlay = (index: number) => {
    onMutate(draft => {
      draft.overlays = draft.overlays.filter((_, idx) => idx !== index)
    })
  }

  const addNode = (index: number) => {
    onMutate(draft => {
      const overlay = draft.overlays[index]
      if (!overlay) {
        return
      }
      overlay.nodes = [
        ...overlay.nodes,
        {
          id: `NODE_${overlay.nodes.length + 1}`,
          title: 'New node',
          description: 'Describe the router/action',
          category: 'core',
        },
      ]
    })
  }

  const updateNode = (overlayIndex: number, nodeIndex: number, patch: Partial<FlowOverlayNodeConfig>) => {
    onMutate(draft => {
      const overlay = draft.overlays[overlayIndex]
      if (!overlay) {
        return
      }
      overlay.nodes = overlay.nodes.map((node, idx) =>
        idx === nodeIndex ? { ...node, ...patch } : node,
      )
    })
  }

  const removeNode = (overlayIndex: number, nodeIndex: number) => {
    onMutate(draft => {
      const overlay = draft.overlays[overlayIndex]
      if (!overlay) {
        return
      }
      overlay.nodes = overlay.nodes.filter((_, idx) => idx !== nodeIndex)
    })
  }

  const addEdge = (index: number) => {
    onMutate(draft => {
      const overlay = draft.overlays[index]
      if (!overlay) {
        return
      }
      overlay.edges = [
        ...overlay.edges,
        {
          from: steps[0] ?? 'GREETING',
          to: steps[1] ?? 'AWAITING_INTENT',
          label: 'Trigger',
          category: 'core',
        },
      ]
    })
  }

  const updateEdge = (overlayIndex: number, edgeIndex: number, patch: Partial<FlowOverlayEdgeConfig>) => {
    onMutate(draft => {
      const overlay = draft.overlays[overlayIndex]
      if (!overlay) {
        return
      }
      overlay.edges = overlay.edges.map((edge, idx) =>
        idx === edgeIndex ? { ...edge, ...patch } : edge,
      )
    })
  }

  const removeEdge = (overlayIndex: number, edgeIndex: number) => {
    onMutate(draft => {
      const overlay = draft.overlays[overlayIndex]
      if (!overlay) {
        return
      }
      overlay.edges = overlay.edges.filter((_, idx) => idx !== edgeIndex)
    })
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={addOverlay}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[color:var(--admin-border)] px-4 py-2 text-sm font-semibold text-[color:var(--admin-navigation-text)] hover:border-[color:var(--admin-navigation-active-indicator)] hover:text-[color:var(--admin-navigation-active-text)]"
      >
        <Plus className="h-4 w-4" />
        Add overlay
      </button>

      {overlays.map((overlay, index) => (
        <div key={overlay.id} className="space-y-4 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={overlay.name}
                  onChange={event => updateOverlay(index, { name: event.target.value })}
                  className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm font-semibold text-[color:var(--admin-card-header-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                />
                <label className="flex items-center gap-2 text-xs font-medium text-[color:var(--admin-card-muted-text)]">
                  <input
                    type="checkbox"
                    checked={overlay.enabled !== false}
                    onChange={event => updateOverlay(index, { enabled: event.target.checked })}
                    className="h-4 w-4 rounded border-[color:var(--admin-border)] text-[color:var(--admin-navigation-active-indicator)]"
                  />
                  Enabled
                </label>
              </div>
              <textarea
                value={overlay.description ?? ''}
                onChange={event => updateOverlay(index, { description: event.target.value })}
                placeholder="Describe what this router overlay does"
                className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => removeOverlay(index)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>

          <div className="rounded-xl border border-[color:var(--admin-border-muted)] bg-[color:var(--admin-surface-alt)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h5 className="text-sm font-semibold text-[color:var(--admin-card-header-text)]">Nodes</h5>
              <button
                type="button"
                onClick={() => addNode(index)}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--admin-border)] px-3 py-1 text-xs font-semibold text-[color:var(--admin-navigation-text)] hover:border-[color:var(--admin-navigation-active-indicator)] hover:text-[color:var(--admin-navigation-active-text)]"
              >
                <Plus className="h-3 w-3" />
                Add node
              </button>
            </div>

            <div className="grid gap-3">
              {overlay.nodes.map((node, nodeIndex) => (
                <div key={node.id} className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      Node ID
                      <input
                        value={node.id}
                        onChange={event => updateNode(index, nodeIndex, { id: event.target.value })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      Shape
                      <select
                        value={node.shape ?? ''}
                        onChange={event => updateNode(index, nodeIndex, { shape: event.target.value ? event.target.value as FlowOverlayNodeConfig['shape'] : undefined })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      >
                        <option value="">{shapeFallbackLabel}</option>
                        {nodeShapes.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      Title
                      <input
                        value={node.title}
                        onChange={event => updateNode(index, nodeIndex, { title: event.target.value })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      Category
                      <select
                        value={node.category}
                        onChange={event => updateNode(index, nodeIndex, { category: event.target.value as FlowCategory })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      >
                        {flowCategories.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                    Description
                    <textarea
                      value={node.description}
                      onChange={event => updateNode(index, nodeIndex, { description: event.target.value })}
                      className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeNode(index, nodeIndex)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove node
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--admin-border-muted)] bg-[color:var(--admin-surface-alt)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h5 className="text-sm font-semibold text-[color:var(--admin-card-header-text)]">Edges</h5>
              <button
                type="button"
                onClick={() => addEdge(index)}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--admin-border)] px-3 py-1 text-xs font-semibold text-[color:var(--admin-navigation-text)] hover:border-[color:var(--admin-navigation-active-indicator)] hover:text-[color:var(--admin-navigation-active-text)]"
              >
                <Plus className="h-3 w-3" />
                Add edge
              </button>
            </div>

            <div className="grid gap-3">
              {overlay.edges.map((edge, edgeIndex) => (
                <div key={`${edge.from}-${edge.to}-${edgeIndex}`} className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      From
                      <input
                        value={edge.from}
                        onChange={event => updateEdge(index, edgeIndex, { from: event.target.value })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      To
                      <input
                        value={edge.to}
                        onChange={event => updateEdge(index, edgeIndex, { to: event.target.value })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      Label
                      <input
                        value={edge.label}
                        onChange={event => updateEdge(index, edgeIndex, { label: event.target.value })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                      Category
                      <select
                        value={edge.category}
                        onChange={event => updateEdge(index, edgeIndex, { category: event.target.value as FlowCategory })}
                        className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-alt)] px-3 py-2 text-sm text-[color:var(--admin-card-text)] focus:border-[color:var(--admin-navigation-active-indicator)] focus:outline-none"
                      >
                        {flowCategories.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--admin-card-muted-text)]">
                    <input
                      type="checkbox"
                      checked={edge.dashed === true}
                      onChange={event => updateEdge(index, edgeIndex, { dashed: event.target.checked })}
                      className="h-4 w-4 rounded border-[color:var(--admin-border)] text-[color:var(--admin-navigation-active-indicator)]"
                    />
                    Dashed style
                  </label>

                  <button
                    type="button"
                    onClick={() => removeEdge(index, edgeIndex)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove edge
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FlowDesignerPanel(): React.JSX.Element {
  const {
    config,
    draft,
    loading,
    saving,
    error,
    lastSavedAt,
    setConfig,
    setDraft,
    updateDraft: updateDraftState,
    setLoading,
    setSaving,
    setError,
    setLastSavedAt,
  } = useFlowDesignerStore()

  const [activeSection, setActiveSection] = useState<DesignerSection>('messages')

  const applyDraftUpdate = useCallback<DraftMutator>(mutator => {
    updateDraftState(draftConfig => {
      mutator(draftConfig)
    })
  }, [updateDraftState])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const result = await getChatbotFlowConfig()
        if (mounted) {
          setConfig(result)
          setDraft(cloneConfig(result))
          setLastSavedAt(new Date().toISOString())
        }
      } catch (err) {
        console.error('Failed to load chatbot flow configuration', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load flow configuration')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasChanges = useMemo(() => {
    if (!config || !draft) {
      return false
    }
    return JSON.stringify(config) !== JSON.stringify(draft)
  }, [config, draft])

  const validationWarnings = useMemo(() => collectValidationWarnings(draft), [draft])
  const changeSummary = useMemo(() => (hasChanges ? summarizeChanges(config, draft) : []), [config, draft, hasChanges])
  const steps = useMemo(() => (draft ? (Object.keys(draft.states) as ConversationStep[]) : []), [draft])

  const handleSave = async () => {
    if (!draft) {
      return
    }
    try {
      setSaving(true)
      setError(null)
      const payload: FlowConfigInput = {
        ...draft,
      }
      const updated = await updateChatbotFlowConfig(payload)
      setConfig(updated)
      setDraft(cloneConfig(updated))
      setLastSavedAt(new Date().toISOString())
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chatbot-flow-config:updated', { detail: updated }))
      }
      toast.success('Flow configuration updated', 'Changes will appear in the admin diagram and chatbot immediately.')
    } catch (err) {
      console.error('Failed to update chatbot flow configuration', err)
      setError(err instanceof Error ? err.message : 'Failed to update chatbot flow configuration')
      toast.error('Failed to update flow configuration', err instanceof Error ? err.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-6 text-sm text-[color:var(--admin-card-muted-text)]">
        Loading flow configuration…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-6 text-sm text-[color:var(--admin-card-muted-text)]">
        No configuration data available.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--admin-card-header-text)]">Flow designer</h3>
          <p className="text-sm text-[color:var(--admin-card-muted-text)]">
            Customize chatbot prompts, state descriptions, intent labels, and overlay routers. Changes apply to the live diagram once saved.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-1 md:items-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              hasChanges && !saving
                ? 'bg-[color:var(--admin-navigation-active-background)] text-[color:var(--admin-navigation-active-text)] hover:opacity-90'
                : 'bg-[color:var(--admin-border-muted)] text-[color:var(--admin-card-muted-text)]'
            }`}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : hasChanges ? 'Save changes' : 'Saved'}
          </button>
          <span className="text-xs text-[color:var(--admin-card-muted-text)]">
            Last saved: {formatTimestamp(lastSavedAt)}
          </span>
        </div>
      </div>

      {hasChanges && (
        <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--admin-card-header-text)]">
            <Clock className="h-4 w-4" />
            Pending updates
          </div>
          {changeSummary.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-[color:var(--admin-card-muted-text)]">
              {changeSummary.map(item => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-[color:var(--admin-card-muted-text)]">
              Configuration edited. Review and save to apply changes.
            </p>
          )}
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="rounded-2xl border border-orange-400 bg-orange-950/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-200">
            <AlertCircle className="h-4 w-4" />
            Validation warnings
          </div>
          <ul className="mt-3 space-y-2 text-xs text-orange-100">
            {validationWarnings.map(warning => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'messages' as DesignerSection, label: 'Responses' },
          { id: 'states' as DesignerSection, label: 'States' },
          { id: 'intents' as DesignerSection, label: 'Intent labels' },
          { id: 'quickActions' as DesignerSection, label: 'Quick actions' },
          { id: 'overlays' as DesignerSection, label: 'Routers & overlays' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-navigation-active-indicator)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--admin-card-background)] ${
              activeSection === tab.id
                ? 'bg-[color:var(--admin-navigation-active-background)] text-[color:var(--admin-navigation-active-text)]'
                : 'bg-[color:var(--admin-surface-alt)] text-[color:var(--admin-card-text)] hover:bg-[color:var(--admin-navigation-hover-background)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'messages' && (
        <MessageEditor config={draft} onMutate={applyDraftUpdate} />
      )}

      {activeSection === 'states' && (
        <StateEditor config={draft} onMutate={applyDraftUpdate} />
      )}

      {activeSection === 'intents' && (
        <IntentEditor config={draft} onMutate={applyDraftUpdate} />
      )}

      {activeSection === 'quickActions' && (
        <QuickActionsEditor config={draft} onMutate={applyDraftUpdate} />
      )}

      {activeSection === 'overlays' && (
        <OverlayEditor config={draft} steps={steps} onMutate={applyDraftUpdate} />
      )}
    </div>
  )
}
