"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { shallow } from 'zustand/shallow'
import { LogOut, Monitor, Moon, Sun, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import NotificationToggle from '@/components/NotificationToggle'
import { toast } from '@/stores'
import { CHAT_THEME_OPTIONS, DEFAULT_CHAT_THEME } from '@/lib/chatbot/chat-themes'
import { useDomainStore } from '@/state/hooks'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { WhatsAppConnectionPanel } from '../settings/WhatsAppConnectionPanel'
import { FlowBotToggle } from '@/components/chatbot/FlowBotToggle'

const APP_THEME_OPTIONS = [
  {
    id: 'light' as const,
    label: 'Modo claro',
    description: 'Ideal para ambientes bien iluminados.',
    icon: Sun,
  },
  {
    id: 'dark' as const,
    label: 'Modo oscuro',
    description: 'Protege tu vista en espacios con poca luz.',
    icon: Moon,
  },
  {
    id: 'system' as const,
    label: 'Usar sistema',
    description: 'Se adapta automáticamente al tema de tu dispositivo.',
    icon: Monitor,
  },
]

interface ChatUserSettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function ChatUserSettingsPanel({ open, onClose }: ChatUserSettingsPanelProps) {
  const router = useRouter()
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const locale = pathname.split('/')[1] || 'es' // Extract locale from path like /es/chat/full or /en/otp-login

  const {
    displayName,
    email,
    normalizedPhone,
    profileSaving,
    saveProfile,
    fetchProfile,
    error,
    clearError,
    logout,
    status: authStatus,
    tenantId,
    lastTenantId,
    sessionToken,
  } = useDomainStore(
    'chatAuth',
    state => ({
      displayName: state.displayName,
      email: state.email,
      normalizedPhone: state.normalizedPhone,
      profileSaving: state.profileSaving,
      saveProfile: state.saveProfile,
      fetchProfile: state.fetchProfile,
      error: state.error,
      clearError: state.clearError,
      logout: state.logout,
      status: state.status,
      tenantId: state.tenantId,
      lastTenantId: state.lastTenantId,
      sessionToken: state.sessionToken,
    }),
    shallow,
  )

  const [fullName, setFullName] = useState(displayName ?? '')
  const [emailAddress, setEmailAddress] = useState(email ?? '')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { theme: appTheme, setTheme: setAppTheme, resolvedTheme: resolvedAppTheme } = useTheme()
  const { currentTheme, setTheme } = useDomainStore(
    'chatTheme',
    state => ({ currentTheme: state.currentTheme, setTheme: state.setTheme }),
    shallow,
  )

  const resolvedTheme = useMemo(() => {
    return CHAT_THEME_OPTIONS.some(option => option.id === currentTheme) ? currentTheme : DEFAULT_CHAT_THEME
  }, [currentTheme])

  useEffect(() => {
    setFullName(displayName ?? '')
  }, [displayName])

  useEffect(() => {
    setEmailAddress(email ?? '')
  }, [email])

  useEffect(() => {
    if (!displayName || !email) {
      void fetchProfile()
    }
  }, [displayName, email, fetchProfile])

  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    const success = await saveProfile({ displayName: fullName, email: emailAddress })
    if (success) {
      onClose()
    }
  }

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      setShowLogoutModal(false)
      onClose()

      // Immediately show loading overlay to prevent flash of chat UI
      const loadingOverlay = document.createElement('div')
      loadingOverlay.id = 'logout-overlay'
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        color: white;
        font-size: 18px;
      `
      loadingOverlay.innerHTML = '<div>Cerrando sesión...</div>'
      document.body.appendChild(loadingOverlay)

      // Build logout redirect URL with locale and tenant context
      const tenant = tenantId || lastTenantId
      const baseUrl = locale ? `/${locale}/otp-login` : '/otp-login'
      const logoutUrl = tenant ? `${baseUrl}?tenant=${tenant}` : baseUrl

      console.log('[ChatUserSettingsPanel] Logout redirect:', { locale, tenant, logoutUrl })

      // Use window.location.replace for instant hard redirect without flash
      window.location.replace(logoutUrl)
    } catch (error) {
      console.error('Failed to logout:', error)

      // Remove loading overlay on error
      const overlay = document.getElementById('logout-overlay')
      if (overlay) overlay.remove()

      toast.error('Error', 'No se pudo cerrar sesión. Por favor intenta de nuevo.')
    }
  }, [logout, onClose, locale, tenantId, lastTenantId])

  return (
    <>


      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-h-[95vh] w-[calc(100vw-2rem)] max-w-none sm:max-w-6xl sm:w-[95vw] sm:h-[90vh] left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] overflow-hidden bg-slate-950 border-slate-800 p-0 gap-0 rounded-2xl shadow-2xl">

          {/* Mobile Layout Container */}
          <div className="flex flex-col h-full overflow-hidden sm:hidden">
            <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 px-4 py-4 flex items-center justify-between">
              <DialogHeader className="flex-1">
                <DialogTitle className="text-xl font-semibold text-white">Configuración</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  Personaliza tu experiencia con FlowBot
                </DialogDescription>
              </DialogHeader>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-2 hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-400" />
                <span className="sr-only">Cerrar</span>
              </DialogClose>
            </div>

            <div className="px-4 py-4 space-y-6 overflow-y-auto flex-1">
              <div>
                <h3 className="text-base font-semibold text-slate-200 mb-3">Tu perfil</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error ? (
                    <Alert variant="destructive" className="mb-2 border-red-200 bg-red-50 !text-gray-900">
                      <AlertDescription className="!text-gray-900 text-xs">{error}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="chat-settings-name-mobile" className="text-sm text-slate-200">Nombre completo</Label>
                    <Input
                      id="chat-settings-name-mobile"
                      value={fullName}
                      onChange={event => setFullName(event.target.value)}
                      placeholder="Tu nombre y apellidos"
                      required
                      disabled={profileSaving}
                      className="h-11 bg-white text-black placeholder:text-slate-400 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chat-settings-email-mobile" className="text-sm text-slate-200">Correo electrónico</Label>
                    <Input
                      id="chat-settings-email-mobile"
                      type="email"
                      value={emailAddress}
                      onChange={event => setEmailAddress(event.target.value)}
                      placeholder="tu@correo.com"
                      required
                      disabled={profileSaving}
                      className="h-11 bg-white text-black placeholder:text-slate-400 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chat-settings-phone-mobile" className="text-sm text-slate-200">Teléfono verificado</Label>
                    <Input
                      id="chat-settings-phone-mobile"
                      value={normalizedPhone ?? ''}
                      readOnly
                      disabled
                      className="bg-slate-100 text-slate-500 h-11 border-slate-200"
                    />
                  </div>

                  {/* Theme Section - Mobile */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-sm font-semibold text-slate-200">Tema de la interfaz</Label>
                      <p className="text-xs text-slate-400 mt-1">
                        Elige cómo quieres ver FlowBot
                      </p>
                    </div>
                    <div className="space-y-2">
                      {APP_THEME_OPTIONS.map(option => {
                        const Icon = option.icon
                        const isActive = appTheme === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAppTheme(option.id)}
                            className={cn(
                              'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                              isActive
                                ? 'border-emerald-400 bg-emerald-50/60 text-emerald-700 shadow-sm'
                                : 'border-slate-700 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-800',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                isActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-700/50 text-slate-400',
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-slate-200 block">{option.label}</span>
                              <span className="text-xs text-slate-500 group-hover:text-slate-400 block mt-0.5">{option.description}</span>
                            </div>
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Notifications - Mobile */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-200">Notificaciones push</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Recibe avisos en tiempo real
                        </p>
                      </div>
                      <NotificationToggle
                        mode="button"
                        variant="outline"
                        size="default"
                        hideWhenUnsupported={false}
                        className="h-10 min-w-[120px] justify-center rounded-full bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
                      />
                    </div>
                  </div>

                  {/* FlowBot Toggle - Mobile */}
                  <div className="mt-4">
                    <FlowBotToggle
                      sessionToken={sessionToken}
                      tenantId={tenantId || lastTenantId}
                    />
                  </div>

                  {/* Logout - Mobile */}
                  {authStatus === 'authenticated' && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full h-11"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  )}

                  {/* Action Buttons - Mobile */}
                  <div className="flex flex-col gap-2 pt-2 sticky bottom-0 bg-slate-950 pb-2">
                    <Button
                      type="submit"
                      className="w-full h-11 bg-emerald-500 text-white hover:bg-emerald-400"
                      disabled={profileSaving || !fullName.trim() || !emailAddress.trim()}
                    >
                      {profileSaving ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Desktop Layout Container */}
          <div className="hidden sm:flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
              <DialogHeader className="flex-1">
                <DialogTitle id="settings-panel-title" className="text-2xl font-semibold text-white">Tu perfil</DialogTitle>
                <DialogDescription className="text-sm text-slate-400 mt-1">
                  Actualiza tu nombre y correo para que FlowBot personalice la experiencia.
                </DialogDescription>
              </DialogHeader>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none group hover:bg-slate-800 p-2">
                <X className="h-5 w-5 text-slate-600" />
                <span className="sr-only">Cerrar</span>
              </DialogClose>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="max-w-4xl mx-auto">

                {error ? (
                  <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50 !text-gray-900">
                    <AlertDescription className="!text-gray-900">{error}</AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="chat-settings-name" className="text-slate-200">Nombre completo</Label>
                    <Input
                      id="chat-settings-name"
                      value={fullName}
                      onChange={event => setFullName(event.target.value)}
                      placeholder="Tu nombre y apellidos"
                      required
                      disabled={profileSaving}
                      className="bg-white text-black placeholder:text-slate-400 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="chat-settings-email" className="text-slate-200">Correo electrónico</Label>
                    <Input
                      id="chat-settings-email"
                      type="email"
                      value={emailAddress}
                      onChange={event => setEmailAddress(event.target.value)}
                      placeholder="tu@correo.com"
                      required
                      disabled={profileSaving}
                      className="bg-white text-black placeholder:text-slate-400 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="chat-settings-phone" className="text-slate-200">Teléfono verificado</Label>
                    <Input
                      id="chat-settings-phone"
                      value={normalizedPhone ?? ''}
                      readOnly
                      disabled
                      className="bg-slate-100 text-slate-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-base font-semibold text-slate-50">Tema del chatbot (solo escritorio)</Label>
                      <p className="mt-1 text-sm text-slate-400">
                        Los dispositivos móviles conservan el estilo WhatsApp; en escritorio puedes elegir una paleta distinta.
                      </p>
                    </div>
                    <div className="grid gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {CHAT_THEME_OPTIONS.map(option => {
                        const isActive = option.id === resolvedTheme
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setTheme(option.id)}
                            aria-pressed={isActive}
                            className={cn(
                              'group flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                              isActive
                                ? 'border-emerald-400 shadow-[0_18px_40px_-28px_rgba(14,116,144,0.45)]'
                                : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-emerald-500/50 hover:shadow-lg',
                            )}
                          >
                            <span
                              className="h-24 w-full rounded-xl border border-white/40"
                              style={{
                                background: option.previewGradient,
                                boxShadow: isActive ? '0 18px 42px -26px rgba(14, 116, 144, 0.55)' : '0 16px 40px -32px rgba(15, 23, 42, 0.35)',
                              }}
                            />
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
                              <span>{option.label}</span>
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'h-3 w-3 rounded-full border border-white transition',
                                  isActive ? 'scale-110 bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]' : 'bg-slate-200',
                                )}
                                style={{ borderColor: isActive ? 'rgba(16,185,129,0.5)' : '#e2e8f0' }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 group-hover:text-slate-400">{option.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="w-full sm:w-auto min-w-[140px] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-11"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto min-w-[180px] bg-emerald-500 text-white hover:bg-emerald-400 h-11"
                      disabled={profileSaving || !fullName.trim() || !emailAddress.trim()}
                    >
                      {profileSaving ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                  </div>
                </form>

                <section className="mt-8 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">Preferencias rápidas</h3>
                    <p className="text-xs text-slate-400">Personaliza FlowBot en este dispositivo.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-50">Notificaciones push</p>
                          <p className="text-xs text-slate-400">
                            Recibe avisos de pagos y respuestas en tiempo real. Pide permiso al navegador si aún no lo has
                            activado.
                          </p>
                        </div>
                        <NotificationToggle
                          mode="button"
                          variant="outline"
                          size="default"
                          hideWhenUnsupported={false}
                          className="h-10 min-w-[160px] justify-center rounded-full bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 lg:p-6 shadow-lg">
                      <div>
                        <p className="text-base lg:text-lg font-semibold text-slate-50">Tema de la interfaz</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Cambia entre modos claro, oscuro o respeta el tema de tu teléfono.
                        </p>
                      </div>
                      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-3">
                        {APP_THEME_OPTIONS.map(option => {
                          const Icon = option.icon
                          const isActive = appTheme === option.id
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setAppTheme(option.id)}
                              className={cn(
                                'flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                                isActive
                                  ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400 shadow-md'
                                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-emerald-500/40 hover:bg-slate-700 hover:text-emerald-400',
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400',
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-semibold text-slate-200">{option.label}</span>
                                <span className="text-xs text-slate-500 group-hover:text-slate-400">{option.description}</span>
                              </div>
                              {isActive ? (
                                <span
                                  aria-hidden="true"
                                  className="ml-auto mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.15)]"
                                />
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-400">
                        Tema aplicado:{' '}
                        {appTheme === 'system'
                          ? `Igual que tu dispositivo · ${resolvedAppTheme === 'dark' ? 'Oscuro' : 'Claro'}`
                          : appTheme === 'dark'
                            ? 'Modo oscuro · ideal para ambientes con poca luz'
                            : 'Modo claro · ideal para espacios iluminados'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-8 space-y-4 pb-8">
                  <div>
                    <h3 className="text-base font-semibold text-slate-50">WhatsApp Business</h3>
                    <p className="text-xs text-slate-400 mt-1">Gestiona tu conexión de WhatsApp para recibir y enviar mensajes</p>
                  </div>
                  <WhatsAppConnectionPanel sessionId={tenantId || undefined} />

                  {/* FlowBot Toggle */}
                  <div className="mt-6">
                    <div className="mb-2">
                      <h4 className="text-sm font-semibold text-slate-50">FlowBot Automation</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Controla si FlowBot responde automáticamente a los mensajes de WhatsApp</p>
                    </div>
                    <FlowBotToggle
                      sessionToken={sessionToken}
                      tenantId={tenantId || lastTenantId}
                    />
                  </div>
                </section>

                {authStatus === 'authenticated' && (
                  <>
                    <div className="my-6 border-t border-slate-200"></div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full sm:w-auto sm:min-w-[200px] h-11 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-[425px] bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Cerrar Sesión
            </DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              ¿Estás seguro de que deseas cerrar sesión? Tu sesión actual se terminará y deberás iniciar sesión nuevamente para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ChatUserSettingsPanel
