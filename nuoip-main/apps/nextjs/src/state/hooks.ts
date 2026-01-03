import { useChatContactsStore } from '@/stores/chat-contacts-store'
import { useChatAuthStore } from '@/stores/chat-auth-store'
import { useAuthStore } from '@/stores/index'
import { useToastStore } from '@/stores/toast-store'
import { useChatThemeStore } from '@/stores/chat-theme-store'

// Helper to use a specific store based on domain name
export function useDomainStore<T = any>(
  domainName: string,
  selector?: (state: any) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  let useStore: any

  switch (domainName) {
    case 'chatContacts':
      useStore = useChatContactsStore
      break
    case 'chatAuth':
      useStore = useChatAuthStore
      break
    case 'auth':
      useStore = useAuthStore
      break
    case 'chatTheme':
      useStore = useChatThemeStore
      break
    case 'toast':
      useStore = useToastStore
      break
    case 'dashboard':
      // Keep dashboard stubbed for now as no store was found
      useStore = (selector?: (state: any) => any) => {
        const state = {
          paymentNotifications: [],
          setChatbotOpen: () => { },
          resetUnreadPaymentNotifications: () => { },
          user: null,
        }
        return selector ? selector(state) : state
      }
      break
    default:
      // Fallback for unknown domains
      useStore = () => ({})
  }

  // If the store is a zustand store, it supports selectors
  if (useStore && typeof useStore === 'function') {
    try {
      return useStore(selector, equalityFn)
    } catch (e) {
      // Fallback if it's not a proper zustand store or other error
      const state = useStore()
      return selector ? selector(state) : (state as T)
    }
  }

  return {} as T
}

