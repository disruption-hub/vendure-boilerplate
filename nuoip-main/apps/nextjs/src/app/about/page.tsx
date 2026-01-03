import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a281a] via-[#041410] to-[#02070b] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Acerca de FlowCast</h1>
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur space-y-4 text-white/75">
            <p>
              FlowCast es una plataforma integral de engagement empresarial que combina CRM, 
              FlowBot y analítica para potenciar a tu equipo en un entorno móvil, rápido y seguro.
            </p>
            <p>
              Nuestra misión es ayudar a las empresas a automatizar conversaciones, 
              mejorar el engagement con clientes y optimizar procesos de negocio mediante 
              inteligencia artificial y comunicación omnicanal.
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
