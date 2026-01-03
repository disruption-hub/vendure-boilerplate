import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-background mt-14 md:mt-20">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10 lg:gap-12">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">DisHub</h4>
            <p className="text-sm text-muted-foreground">
              Sistema inteligente de chatbot con capacidades avanzadas de IA.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 md:mt-12 border-t pt-6 md:pt-8 pb-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DisHub SAC. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
