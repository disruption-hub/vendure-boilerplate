"use client"

import { useEffect, useRef } from 'react'

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

export function BackgroundParticles() {
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
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-20 h-full w-full" aria-hidden />
  )
}
