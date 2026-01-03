'use client'

import dynamic from 'next/dynamic'
import VantaBackground from './VantaBackground'
import { AnimatedParticles } from './AnimatedParticles'
import type { BackgroundConfig } from '@/types/tenant-customization'

interface CustomizableBackgroundProps {
  config: BackgroundConfig
}

export default function CustomizableBackground({ config }: CustomizableBackgroundProps) {
  if (config.type === 'vanta' && config.vanta) {
    return (
      <VantaBackground
        effect={config.vanta.effect as any}
        options={config.vanta.options}
        config={config}
      />
    )
  }

  if (config.type === 'solid' && config.solidColor) {
    return (
      <div
        className="fixed inset-0 z-0"
        style={{ backgroundColor: config.solidColor }}
      />
    )
  }

  if (config.type === 'gradient' && config.gradient) {
    const gradientType = config.gradient.type || 'linear'
    const direction = config.gradient.direction || 'to bottom'
    const colors = config.gradient.colors || []
    const position = config.gradient.position || 'center'
    const shape = config.gradient.shape || 'ellipse'
    
    let gradientCSS = ''
    if (gradientType === 'radial') {
      gradientCSS = `radial-gradient(${shape} ${shape === 'circle' ? '' : `at ${position}`}, ${colors.join(', ')})`
    } else {
      gradientCSS = `linear-gradient(${direction}, ${colors.join(', ')})`
    }
    
    return (
      <div
        className="fixed inset-0 z-0"
        style={{
          background: gradientCSS,
        }}
      />
    )
  }

  if (config.type === 'particles' && config.particles) {
    // Use animated canvas-based particles like the homepage
    return (
      <AnimatedParticles 
        config={config.particles}
        backgroundColor="#00121a" // Match Vanta's baseColor
      />
    )
  }
  
  // Fallback for particles without config
  if (config.type === 'particles') {
    return (
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 20% 50%, rgba(123, 255, 58, 0.1) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(12, 143, 114, 0.1) 0%, transparent 50%),
                       radial-gradient(circle at 40% 20%, rgba(92, 231, 197, 0.1) 0%, transparent 50%)`,
        }}
      />
    )
  }

  // Default fallback
  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
  )
}

