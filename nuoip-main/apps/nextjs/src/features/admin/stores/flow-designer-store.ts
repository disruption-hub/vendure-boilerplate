import { createWithEqualityFn } from 'zustand/traditional'
import type { FlowConfig } from '@/lib/chatbot/flow-config/types'

function cloneConfig(config: FlowConfig | null): FlowConfig | null {
  if (!config) {
    return null
  }
  return JSON.parse(JSON.stringify(config)) as FlowConfig
}

interface FlowDesignerState {
  config: FlowConfig | null
  draft: FlowConfig | null
  loading: boolean
  saving: boolean
  error: string | null
  lastSavedAt: string | null
  setConfig: (config: FlowConfig | null) => void
  setDraft: (draft: FlowConfig | null) => void
  updateDraft: (mutator: (draft: FlowConfig) => void) => void
  setLoading: (value: boolean) => void
  setSaving: (value: boolean) => void
  setError: (value: string | null) => void
  setLastSavedAt: (value: string | null) => void
  reset: () => void
}

export const useFlowDesignerStore = createWithEqualityFn<FlowDesignerState>((set, get) => ({
  config: null,
  draft: null,
  loading: false,
  saving: false,
  error: null,
  lastSavedAt: null,

  setConfig: (config) => {
    set({ config: cloneConfig(config) })
  },

  setDraft: (draft) => {
    set({ draft: cloneConfig(draft) })
  },

  updateDraft: (mutator) => {
    const current = get().draft
    if (!current) {
      return
    }
    const next = cloneConfig(current)
    if (!next) {
      return
    }
    mutator(next)
    set({ draft: next })
  },

  setLoading: (value) => set({ loading: value }),
  setSaving: (value) => set({ saving: value }),
  setError: (value) => set({ error: value }),
  setLastSavedAt: (value) => set({ lastSavedAt: value }),

  reset: () => {
    set({
      config: null,
      draft: null,
      loading: false,
      saving: false,
      error: null,
      lastSavedAt: null,
    })
  },
}))
