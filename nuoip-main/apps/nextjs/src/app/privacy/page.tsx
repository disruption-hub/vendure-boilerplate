import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a281a] via-[#041410] to-[#02070b] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Política de Privacidad</h1>
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur space-y-4 text-white/75">
            <p>
              Esta política de privacidad describe cómo FlowCast recopila, usa y protege 
              la información personal de nuestros usuarios.
            </p>
            <p>
              Nos comprometemos a proteger la privacidad de nuestros usuarios y a cumplir 
              con todas las regulaciones de protección de datos aplicables.
            </p>
            <p className="text-sm text-white/50 mt-8">
              La política completa estará disponible próximamente.
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
