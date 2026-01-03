'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores'
import { Eye, EyeOff } from 'lucide-react'
import { FlowBotIcon } from '@/components/ui/FlowBotIcon'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()

    const result = await login(email, password)
    if (result.success) {
      router.push('/admin')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e9f7ef] via-[#d3ebdd] to-[#c1decf] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#b6d9c4] bg-white/90 shadow-[0_28px_60px_-36px_rgba(7,94,84,0.4)] backdrop-blur">
        <div className="space-y-6 px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col items-center text-center">
            <FlowBotIcon variant="glyph" size={52} className="text-[#075e54]" />
            <h1 className="mt-4 text-2xl font-semibold text-[#075e54]">Accede a FlowCast</h1>
            <p className="mt-2 text-sm text-[#0f3c34]/80">
              Inicia sesión para abrir el Hub interno de FlowCast y acceder al tablero administrativo.
            </p>
          </div>

          <div className="flex justify-center">
            <Link
              href="/"
              className="text-sm font-medium text-[#0c8f72] transition hover:text-[#075e54]"
            >
              ← Volver al inicio
            </Link>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 !text-gray-900">
              <AlertDescription className="text-sm font-medium !text-gray-900">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-900">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="tu.correo@empresa.com"
                value={email}
                onChange={event => {
                  if (error) {
                    clearError()
                  }
                  setEmail(event.target.value)
                }}
                required
                className="h-12 rounded-xl border-[#b6d9c4] bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#0c8f72] focus:ring-[#0c8f72]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-900">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={event => {
                    if (error) {
                      clearError()
                    }
                    setPassword(event.target.value)
                  }}
                  required
                  className="h-12 rounded-xl border-[#b6d9c4] bg-white pr-12 text-slate-900 placeholder:text-slate-400 focus:border-[#0c8f72] focus:ring-[#0c8f72]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#0c8f72] transition hover:text-[#075e54]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c8f72] focus-visible:ring-offset-2"
            >
              {isLoading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
