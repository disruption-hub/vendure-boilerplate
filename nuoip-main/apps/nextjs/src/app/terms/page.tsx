import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a281a] via-[#041410] to-[#02070b] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Términos de Servicio</h1>
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur space-y-4 text-white/75">
            <p>
              Estos términos de servicio establecen las condiciones bajo las cuales 
              puedes usar FlowCast y nuestros servicios.
            </p>
            <p>
              Al usar FlowCast, aceptas cumplir con estos términos y todas las políticas 
              aplicables de la plataforma.
            </p>
            <p className="text-sm text-white/50 mt-8">
              Los términos completos estarán disponibles próximamente.
            </p>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-full bg-[#7bff3a] text-[#061101] font-semibold hover:bg-[#63ff0f] transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
