export type ChatThemeId = 'default' | 'dark' | 'light'

export interface ChatThemeOption {
  id: ChatThemeId
  label: string
  description: string
  accent: string
  previewGradient: string
  tokens: Record<string, string> // New: Direct mapping to CSS variables
}

export const CHAT_THEME_OPTIONS: ChatThemeOption[] = [
  {
    id: 'default',
    label: 'Standard',
    description: 'Diseño limpio con alto contraste. Barra lateral oscura y textos blancos.',
    accent: '#2563eb',
    previewGradient: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)',
    tokens: {
      '--chat-sidebar-bg': '#0f172a',
      '--chat-sidebar-text': '#ffffff',
      '--chat-sidebar-text-active': '#ffffff',
      '--chat-sidebar-text-dim': '#cbd5e1', /* Higher contrast dim text */
      '--chat-sidebar-preview': '#cbd5e1',
      '--chat-sidebar-time': '#cbd5e1',
      '--chat-sidebar-preview-active': '#ffffff',
      '--chat-sidebar-time-active': '#ffffff',
      '--chat-main-bg': '#f8fafc',
      '--chat-panel-bg': '#ffffff',
      '--chat-panel-text': '#0f172a',
      '--chat-panel-text-dim': '#475569', /* Darker dim text for white bg */
      '--chat-bubble-user-bg': '#2563eb',
      '--chat-bubble-user-text': '#ffffff',
      '--chat-bubble-bot-bg': '#ffffff',
      '--chat-bubble-bot-text': '#0f172a',
      '--chat-accent': '#2563eb',
      '--chat-header-bg': '#ffffff',
      '--chat-header-text': '#0f172a',
      '--chat-input-bg': '#ffffff',
      '--chat-input-text': '#0f172a',
      '--chat-input-placeholder': '#64748b',
    }
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    description: 'Modo oscuro completo para reducir la fatiga visual.',
    accent: '#3b82f6',
    previewGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    tokens: {
      '--chat-sidebar-bg': '#020617',
      '--chat-sidebar-text': '#e2e8f0',
      '--chat-main-bg': '#0f172a',
      '--chat-panel-bg': '#1e293b',
      '--chat-panel-text': '#f8fafc',
      '--chat-bubble-user-bg': '#3b82f6',
      '--chat-bubble-user-text': '#ffffff',
      '--chat-bubble-bot-bg': '#1e293b',
      '--chat-bubble-bot-text': '#f8fafc',
      '--chat-accent': '#3b82f6',
      '--chat-header-bg': '#0f172a',
      '--chat-header-text': '#f8fafc',
    }
  },
  {
    id: 'light',
    label: 'Soft Light',
    description: 'Estilo luminoso y suave con acentos cálidos.',
    accent: '#f97316',
    previewGradient: 'linear-gradient(135deg, #f8fafc 0%, #fed7aa 100%)',
    tokens: {
      '--chat-sidebar-bg': '#ffffff',
      '--chat-sidebar-text': '#334155',
      '--chat-main-bg': '#fdfbf7',
      '--chat-panel-bg': '#ffffff',
      '--chat-panel-text': '#334155',
      '--chat-bubble-user-bg': '#f97316',
      '--chat-bubble-user-text': '#ffffff',
      '--chat-bubble-bot-bg': '#ffffff',
      '--chat-bubble-bot-text': '#334155',
      '--chat-accent': '#f97316',
      '--chat-header-bg': '#ffffff',
      '--chat-header-text': '#334155',
    }
  },
]

export const DEFAULT_CHAT_THEME: ChatThemeId = 'default'
