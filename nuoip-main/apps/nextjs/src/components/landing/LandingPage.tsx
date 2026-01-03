"use client"

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Phone,
  Instagram,
  Globe,
  CalendarClock,
  ShoppingCart,
  CreditCard,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BackgroundParticles } from '@/components/landing/BackgroundParticles'
import { MiniChatPreview } from '@/components/landing/MiniChatPreview'

interface LandingPageProps {
  rootDomain: string
}

interface Particle {
  x: number
  y: number
  radius: number
  velocityX: number
  velocityY: number
  alpha: number
  baseAlpha: number
  life: number
  maxLife: number
  color: [number, number, number]
}

const BACKGROUND_PALETTE: Array<[number, number, number]> = [
  [123, 255, 58],
  [12, 143, 114],
  [92, 231, 197],
]

const MIN_ALPHA = 0.28

export function LandingPage({ rootDomain }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const particles: Particle[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight
    let animationFrame = 0

    const random = (min: number, max: number) => Math.random() * (max - min) + min

    const createParticle = (): Particle => {
      const [r, g, b] = BACKGROUND_PALETTE[Math.floor(Math.random() * BACKGROUND_PALETTE.length)]
      const maxLife = random(180, 340)
      return {
        x: random(0, width),
        y: random(0, height),
        radius: random(8, 24),
        velocityX: random(0.1, 0.55),
        velocityY: -random(0.15, 0.5),
        alpha: Math.random() ** 2 * 0.6 + 0.2,
        baseAlpha: Math.random() ** 2 * 0.6 + 0.2,
        life: maxLife,
        maxLife,
        color: [r, g, b],
      }
    }

    const resetParticles = () => {
      const desired = Math.max(90, Math.round((width * height) / 2200))
      particles.length = 0
      for (let index = 0; index < desired; index += 1) {
        particles.push(createParticle())
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      resetParticles()
    }

    const updateParticle = (particle: Particle) => {
      particle.x += particle.velocityX
      particle.y += particle.velocityY
      particle.life -= 1
      const lifeRatio = Math.max(0, particle.life / particle.maxLife)
      particle.alpha = Math.max(MIN_ALPHA, particle.baseAlpha * lifeRatio)

      if (particle.y + particle.radius < 0 || particle.x - particle.radius > width || particle.life <= 0) {
        Object.assign(particle, createParticle())
        particle.x = random(-40, width)
        particle.y = height + random(10, 120)
      }
    }

    const drawParticle = (particle: Particle) => {
      const [r, g, b] = particle.color
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = particle.alpha
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.alpha})`
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const render = () => {
      ctx.fillStyle = 'rgba(0, 18, 26, 0.35)'
      ctx.fillRect(0, 0, width, height)
      particles.forEach(particle => {
        updateParticle(particle)
        drawParticle(particle)
      })
      animationFrame = window.requestAnimationFrame(render)
    }

    resize()
    animationFrame = window.requestAnimationFrame(render)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden text-[#effff0]">
      <BackgroundParticles />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0a281a]/40 via-[#041410]/35 to-[#02070b]/55" aria-hidden />

      <Header forceWhiteText />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-16 pt-20 sm:pt-28">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,255,68,0.25),transparent_60%)]" aria-hidden />
          <div className="relative z-10 grid gap-12 px-8 py-16 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#90ff61]/40 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#90ff61]">
                <Sparkles className="h-4 w-4" />
                Plataforma de engagement para empresas
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                FlowCast: Conversaciones que se convierten en acciones
              </h1>
              <p className="text-lg text-white/75">
                Una plataforma modular: CRM, FlowBot y analítica para potenciar a tu equipo en un entorno móvil, rápido y seguro.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="flex items-center gap-2 rounded-full bg-[#7bff3a] px-6 py-3 text-base font-semibold text-[#061101] transition hover:bg-[#63ff0f]"
                >
                  <Link href="/request-access">
                    Solicita tu tenant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-sm text-white/70">
                  Obtén tu subdominio personalizado: <strong>tuempresa.{rootDomain}</strong>
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-12 rounded-full bg-[radial-gradient(circle_at_center,rgba(123,255,58,0.2),transparent_65%)] blur-3xl" aria-hidden />
              <MiniChatPreview />
            </div>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-3">
          {featureHighlights.map(feature => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="h-full rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_16px_48px_-40px_rgba(123,255,58,0.45)] backdrop-blur"
              >
                <Icon className="h-10 w-10 text-[#7bff3a]" />
                <h2 className="mt-4 text-xl font-semibold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm text-white/70">{feature.description}</p>
              </article>
            )
          })}
        </section>

        <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-white">En menos de 24h tu tenant está listo</h2>
            <ol className="space-y-5 text-sm text-white/70">
              <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7bff3a] text-base font-semibold text-[#061101]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-white">Solicita tu tenant y elige subdominio</p>
                  <p className="mt-1">Completa el formulario con tu empresa y el subdominio deseado. Nuestro equipo valida disponibilidad y seguridad.</p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-base font-semibold text-white">
                  2
                </span>
                <div>
                  <p className="font-semibold text-white">Activa con enlace OTP y crea tu equipo</p>
                  <p className="mt-1">Recibe un acceso seguro por correo, configura usuarios y habilita permisos según el rol de cada colaborador.</p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base font-semibold text-white">
                  3
                </span>
                <div>
                  <p className="font-semibold text-white">Conecta tus canales y empieza a automatizar</p>
                  <p className="mt-1">Sincroniza WhatsApp, web chat y correo; FlowBot gestiona agendas, recordatorios y pagos en segundos.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-center shadow-[0_24px_64px_-44px_rgba(123,255,58,0.45)] backdrop-blur">
            <ShieldCheck className="mx-auto h-12 w-12 text-[#90ff61]" />
            <h3 className="mt-4 text-2xl font-semibold text-white">Soporte experto incluido</h3>
            <p className="mt-3 text-sm text-white/75">
              Te acompañamos en la configuración inicial, segmentación de audiencias y definición de journeys para maximizar resultados desde el día uno.
            </p>
            <Button
              asChild
              className="mt-8 w-full rounded-full bg-[#7bff3a] py-3 text-base font-semibold text-[#061101] transition hover:bg-[#63ff0f]"
            >
              <Link href="/request-access">Quiero mi onboarding</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage

const featureHighlights: Array<{
  title: string
  description: string
  icon: LucideIcon
}> = [
  {
    title: 'Conversaciones que convierten',
    description:
      'Responde mensajes entrantes en todos tus canales con guiones dinámicos que cierran reservas, capturan pagos y reducen tiempos de espera.',
    icon: MessageCircle,
  },
  {
    title: 'Workflows totalmente medibles',
    description:
      'Configura journeys predefinidos o personalizados, haz seguimiento a KPIs clave y optimiza cada etapa con insights accionables.',
    icon: Sparkles,
  },
  {
    title: 'Seguridad y cumplimiento desde el origen',
    description:
      'Gestión avanzada de usuarios, autenticación OTP y cifrado de datos para proteger la comunicación con tus clientes.',
    icon: ShieldCheck,
  },
  {
    title: 'Canales: WhatsApp, Instagram y Web',
    description:
      'Conecta tus principales canales: integra WhatsApp, Instagram y chat web para atender donde están tus clientes.',
    icon: Phone,
  },
  {
    title: 'Agendamiento y recordatorios',
    description:
      'Define horarios por departamento, ofrece franjas disponibles y envía recordatorios automáticos para reducir ausencias.',
    icon: CalendarClock,
  },
  {
    title: 'Catálogo de productos',
    description:
      'Publica tu catálogo para facilitar consultas y pedidos directamente desde la conversación.',
    icon: ShoppingCart,
  },
  {
    title: 'Links de pago',
    description:
      'Genera y envía links de pago en el chat para cerrar ventas sin fricción.',
    icon: CreditCard,
  },
  {
    title: 'Omnicanalidad',
    description:
      'Unifica conversaciones de múltiples canales en una sola bandeja para tu equipo.',
    icon: Globe,
  },
  {
    title: 'Bot + humano',
    description:
      'Handover fluido al agente: el bot califica y el humano resuelve con contexto.',
    icon: MessageCircle,
  },
  {
    title: 'Leads de ventas',
    description:
      'Captura, califica y enruta leads a tu equipo comercial con seguimiento.',
    icon: ShoppingCart,
  },
  {
    title: 'Helpdesk y tickets',
    description:
      'Crea tickets desde el chat, asigna por departamento y mide tiempos de resolución.',
    icon: ShieldCheck,
  },
]
