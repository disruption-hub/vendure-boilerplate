import type { FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FlowBotIcon } from '@/components/ui/FlowBotIcon'
import type { Message } from '@/components/chatbot/types'
import { Info, LogOut, Eye, EyeOff } from 'lucide-react'

interface ChatbotDialogsProps {
  messageInfoDialog: { open: boolean; message: Message | null }
  onCloseMessageInfo: () => void
  showLogoutModal: boolean
  onChangeLogoutModal: (open: boolean) => void
  onLogout: () => Promise<void>
  showSignInModal: boolean
  onChangeSignInModal: (open: boolean) => void
  onSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>
  authError: string | null
  clearAuthError: () => void
  authLoading: boolean
  signInEmail: string
  setSignInEmail: (value: string) => void
  signInPassword: string
  setSignInPassword: (value: string) => void
  showSignInPassword: boolean
  setShowSignInPassword: (value: boolean) => void
}

export function ChatbotDialogs({
  messageInfoDialog,
  onCloseMessageInfo,
  showLogoutModal,
  onChangeLogoutModal,
  onLogout,
  showSignInModal,
  onChangeSignInModal,
  onSignIn,
  authError,
  clearAuthError,
  authLoading,
  signInEmail,
  setSignInEmail,
  signInPassword,
  setSignInPassword,
  showSignInPassword,
  setShowSignInPassword,
}: ChatbotDialogsProps) {
  return (
    <>
      <Dialog open={messageInfoDialog.open} onOpenChange={(open) => !open && onCloseMessageInfo()}>
        <DialogContent className="sm:max-w-[425px] bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Información del Mensaje
            </DialogTitle>
          </DialogHeader>
          {messageInfoDialog.message && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">{messageInfoDialog.message.content}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Enviado:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {messageInfoDialog.message.timestamp.toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {messageInfoDialog.message.deliveredAt && (
                  <div className="flex items-start justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recibido:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {messageInfoDialog.message.deliveredAt.toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}

                {messageInfoDialog.message.readAt && (
                  <div className="flex items-start justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Leído:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {messageInfoDialog.message.readAt.toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}

                {messageInfoDialog.message.metadata?.source && (
                  <div className="flex items-start justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Canal:</span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {messageInfoDialog.message.metadata.source === 'whatsapp' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-green-600 dark:text-green-400">📱 WhatsApp</span>
                        </span>
                      ) : messageInfoDialog.message.metadata.source === 'flowcast' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-blue-600 dark:text-blue-400">💬 FlowCast Chat</span>
                        </span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">Desconocido</span>
                      )}
                    </span>
                  </div>
                )}

                {!messageInfoDialog.message.deliveredAt &&
                  !messageInfoDialog.message.readAt &&
                  messageInfoDialog.message.role === 'user' && (
                    <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                      <div className="text-yellow-600 dark:text-yellow-400">
                        <Info className="h-4 w-4" />
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        El mensaje aún no ha sido entregado al destinatario
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onCloseMessageInfo}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogoutModal} onOpenChange={onChangeLogoutModal}>
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
              onClick={() => onChangeLogoutModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSignInModal} onOpenChange={onChangeSignInModal}>
        <DialogContent className="sm:max-w-[425px] bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <FlowBotIcon variant="glyph" size={28} className="text-[#075e54] dark:text-[#25d366]" />
              Accede a FlowBot
            </DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              Inicia sesión para abrir el Hub interno y acceder al tablero administrativo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSignIn} className="space-y-4">
            {authError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 !text-gray-900">
                <AlertDescription className="text-sm font-medium !text-gray-900">{authError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Correo electrónico
              </Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="username"
                placeholder="tu.correo@empresa.com"
                value={signInEmail}
                onChange={event => {
                  if (authError) {
                    clearAuthError()
                  }
                  setSignInEmail(event.target.value)
                }}
                required
                className="h-12 rounded-3xl bg-[#f5f1ed] border-[#b6d9c4] text-gray-900 placeholder:text-gray-400 focus:border-[#0c8f72] focus:ring-[#0c8f72] dark:bg-[#f5f1ed] dark:text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={signInPassword}
                  onChange={event => {
                    if (authError) {
                      clearAuthError()
                    }
                    setSignInPassword(event.target.value)
                  }}
                  required
                  className="h-12 rounded-3xl bg-[#f5f1ed] border-[#b6d9c4] pr-12 text-gray-900 placeholder:text-gray-400 focus:border-[#0c8f72] focus:ring-[#0c8f72] dark:bg-[#f5f1ed] dark:text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-black transition hover:text-gray-700"
                >
                  {showSignInPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onChangeSignInModal(false)
                  setSignInEmail('')
                  setSignInPassword('')
                  clearAuthError()
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={authLoading}
                className="flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-base font-semibold text-gray-900 transition hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c8f72] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {authLoading ? 'Entrando…' : 'Entrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
