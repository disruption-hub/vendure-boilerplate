import { createWithEqualityFn } from 'zustand/traditional'

import { toast } from '@/stores'

type ToastKind = 'success' | 'error' | 'info'

interface PaymentCatalogToastState {
  lastToast?: {
    type: ToastKind
    title: string
    description?: string
    timestamp: number
  }
  notifySuccess: (title: string, description?: string) => void
  notifyError: (title: string, description?: string) => void
  notifyInfo: (title: string, description?: string) => void
  clearLastToast: () => void
}

export const usePaymentCatalogToastStore = createWithEqualityFn<PaymentCatalogToastState>(set => ({
  lastToast: undefined,
  notifySuccess: (title, description) => {
    toast.success(title, description)
    set({ lastToast: { type: 'success', title, description, timestamp: Date.now() } })
  },
  notifyError: (title, description) => {
    toast.error(title, description)
    set({ lastToast: { type: 'error', title, description, timestamp: Date.now() } })
  },
  notifyInfo: (title, description) => {
    toast.info(title, description)
    set({ lastToast: { type: 'info', title, description, timestamp: Date.now() } })
  },
  clearLastToast: () => set({ lastToast: undefined }),
}))
