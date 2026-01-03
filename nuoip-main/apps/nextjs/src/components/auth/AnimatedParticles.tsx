'use client'

import { useEffect, useRef } from 'react'
import type { ParticleConfig } from '@/types/tenant-customization'

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

interface AnimatedParticlesProps {
  config: ParticleConfig
  backgroundColor?: string
  variant?: 'fullscreen' | 'contained'
  className?: string
}

const MIN_ALPHA = 0.28

export function AnimatedParticles({
  config,
  backgroundColor = '#00121a',
  variant = 'fullscreen',
  className
}: AnimatedParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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

    // Convert hex colors to RGB arrays
    const hexToRgb = (hex: string): [number, number, number] => {
      const cleanHex = hex.replace('#', '')
      const r = cleanHex.length === 3
        ? parseInt(cleanHex[0] + cleanHex[0], 16)
        : parseInt(cleanHex.substring(0, 2), 16)
      const g = cleanHex.length === 3
        ? parseInt(cleanHex[1] + cleanHex[1], 16)
        : parseInt(cleanHex.substring(2, 4), 16)
      const b = cleanHex.length === 3
        ? parseInt(cleanHex[2] + cleanHex[2], 16)
        : parseInt(cleanHex.substring(4, 6), 16)
      return [r, g, b]
    }

    const colors = config.colors || ['#7bff3a', '#0c8f72', '#5ce7c5']
    const palette: Array<[number, number, number]> = colors.map(hexToRgb)

    const particles: Particle[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Determine dimensions based on variant
    let width = variant === 'fullscreen' ? window.innerWidth : (containerRef.current?.clientWidth || 300)
    let height = variant === 'fullscreen' ? window.innerHeight : (containerRef.current?.clientHeight || 200)

    let animationFrame = 0

    const random = (min: number, max: number) => Math.random() * (max - min) + min

    const createParticle = (): Particle => {
      const color = palette[Math.floor(Math.random() * palette.length)]
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
        color,
      }
    }

    const resetParticles = () => {
      // Adjust density calculation for smaller containers
      const area = width * height
      const densityFactor = variant === 'fullscreen' ? 2200 : 1000
      const desired = config.count || Math.max(20, Math.round(area / densityFactor))

      particles.length = 0
      for (let index = 0; index < desired; index += 1) {
        particles.push(createParticle())
      }
    }

    const resize = () => {
      if (variant === 'fullscreen') {
        width = window.innerWidth
        height = window.innerHeight
      } else {
        width = containerRef.current?.clientWidth || 300
        height = containerRef.current?.clientHeight || 200
      }

      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.scale(dpr, dpr)
      resetParticles()
    }

    const updateParticle = (particle: Particle) => {
      particle.x += particle.velocityX
      particle.y += particle.velocityY
      particle.life -= 1
      const lifeRatio = Math.max(0, particle.life / particle.maxLife)
      const minAlphaValue = config.minAlpha || MIN_ALPHA
      particle.alpha = Math.max(minAlphaValue, particle.baseAlpha * lifeRatio)

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
      // Parse background color to rgba
      const bgColor = backgroundColor.startsWith('#')
        ? (() => {
          const hex = backgroundColor.replace('#', '')
          const r = hex.length === 3
            ? parseInt(hex[0] + hex[0], 16)
            : parseInt(hex.substring(0, 2), 16)
          const g = hex.length === 3
            ? parseInt(hex[1] + hex[1], 16)
            : parseInt(hex.substring(2, 4), 16)
          const b = hex.length === 3
            ? parseInt(hex[2] + hex[2], 16)
            : parseInt(hex.substring(4, 6), 16)
          return `rgba(${r}, ${g}, ${b}, 0.35)`
        })()
        : backgroundColor.replace('rgb', 'rgba').replace(')', ', 0.35)')

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
      particles.forEach(particle => {
        updateParticle(particle)
        drawParticle(particle)
      })
      animationFrame = window.requestAnimationFrame(render)
    }

    resize()
    animationFrame = window.requestAnimationFrame(render)

    if (variant === 'fullscreen') {
      window.addEventListener('resize', resize)
    } else {
      // For contained variant, we might want a ResizeObserver, but for now window resize is okay
      // or just rely on parent re-rendering
      window.addEventListener('resize', resize)
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
    }
  }, [config.colors, config.count, config.minAlpha, backgroundColor, variant])

  if (variant === 'contained') {
    return (
      <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className || ''}`}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden
        />
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full ${className || ''}`}
      aria-hidden
    />
  )
}

