import Link from 'next/link'
import { FlowBotIcon } from '@/components/ui/FlowBotIcon'

export default function RequestAccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a281a] via-[#041410] to-[#02070b] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <FlowBotIcon variant="glyph" size={64} className="text-[#7bff3a] mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Solicita tu Tenant</h1>
            <p className="text-xl text-white/75">
              Obtén tu subdominio personalizado para FlowCast
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur">
            <p className="text-white/70 mb-6 text-center">
              El formulario de solicitud de acceso estará disponible próximamente.
              Por favor, contacta con nuestro equipo para más información.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#7bff3a] text-[#061101] font-semibold hover:bg-[#63ff0f] transition-colors"
              >
                ← Volver al inicio
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Ya tengo acceso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
