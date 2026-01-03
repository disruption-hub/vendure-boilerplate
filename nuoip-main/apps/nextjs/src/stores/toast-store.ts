import { createWithEqualityFn } from 'zustand/traditional'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

// Generate unique ID for toasts
let toastIdCounter = 0
const generateId = () => `toast-${++toastIdCounter}`

// Default durations
const DEFAULT_DURATION = 5000

export const useToastStore = createWithEqualityFn<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATION,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },
}))

// Convenience functions for common toast types
export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: 'success',
      title,
      description,
      duration,
    })
  },

  error: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: 'error',
      title,
      description,
      duration,
    })
  },

  warning: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: 'warning',
      title,
      description,
      duration,
    })
  },

  info: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: 'info',
      title,
      description,
      duration,
    })
  },
}
