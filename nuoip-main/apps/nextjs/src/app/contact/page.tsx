import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a281a] via-[#041410] to-[#02070b] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Contacto</h1>
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur space-y-6 text-white/75">
            <p>
              ¿Tienes preguntas sobre FlowCast? Estamos aquí para ayudarte.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Soporte</h3>
                <p className="text-sm">Para soporte técnico, por favor contacta a través de tu panel de administración.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Ventas</h3>
                <p className="text-sm">Para consultas comerciales, visita nuestra página de solicitud de acceso.</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/request-access"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#7bff3a] text-[#061101] font-semibold hover:bg-[#63ff0f] transition-colors"
              >
                Solicitar Acceso
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
