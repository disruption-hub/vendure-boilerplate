export function MiniChatPreview() {
  return (
    <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-black/60 p-4 shadow-[0_34px_80px_-48px_rgba(123,255,58,0.6)] text-white">
      <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-3">
        {/* Sidebar */}
        <aside className="hidden md:block rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-white/80">Chats</div>
          <ul className="max-h-[280px] space-y-1 overflow-hidden px-2 py-2 text-sm">
            {[
              { name: 'FlowBot', preview: 'Hola 👋 ¿cómo te ayudo?' },
              { name: 'María López', preview: '¿Puedo reprogramar?' },
              { name: 'Juan Pérez', preview: 'Recibí el link ✅' },
              { name: 'Soporte', preview: 'Ticket #2319 actualizado' },
            ].map((c) => (
              <li key={c.name} className="rounded-lg px-3 py-2 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{c.name}</p>
                    <p className="truncate text-[11px] text-white/60">{c.preview}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Thread */}
        <section className="rounded-xl border border-white/10 bg-white/5">
          <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">FlowBot</p>
              <p className="truncate text-[11px] text-white/70">Disponible • responde en segundos</p>
            </div>
            <div className="flex items-center gap-1 opacity-80">
              <div className="h-6 w-6 rounded-md bg-white/10" />
              <div className="h-6 w-6 rounded-md bg-white/10" />
            </div>
          </header>

          <div className="flex max-h-[280px] flex-col gap-2 overflow-hidden px-3 py-3 text-[13px] leading-relaxed">
            {/* Messages */}
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl bg-white/10 px-3 py-2">
                Hola 👋 Soy FlowBot. ¿Quieres agendar o pagar un enlace?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl bg-[#7bff3a] px-3 py-2 text-[#061101]">
                Necesito reprogramar mi cita para mañana 10am
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl bg-white/10 px-3 py-2">
                Perfecto. ¿Confirmas 10:00? También puedo enviarte el link de pago ✅
              </div>
            </div>
            <div className="mt-auto" />
          </div>

          <footer className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
            <div className="h-8 flex-1 rounded-full bg-white/10 px-3 py-1 text-[12px] text-white/60">
              Escribe un mensaje…
            </div>
            <div className="h-8 w-8 rounded-full bg-[#7bff3a]" />
          </footer>
        </section>
      </div>
    </div>
  )
}
