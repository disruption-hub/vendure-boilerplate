'use client'

import { useEffect, useMemo, useRef } from 'react'

interface VantaBackgroundProps {
  effect?: 'fog' | 'waves' | 'clouds' | 'birds' | 'net' | 'cells' | 'trunk' | 'topology' | 'dots' | 'rings' | 'halo' | 'globe'
  options?: Record<string, any>
  customization?: any // Full customization object for dynamic effects
  config?: any // Background config object (for CustomizableBackground compatibility)
}

export default function VantaBackground({
  effect = 'fog',
  options = {},
  customization,
  config
}: VantaBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const retryCount = useRef(0)
  const maxRetries = 10

  // Get effect and options from customization, config, or props
  const actualEffect = customization?.background?.vanta?.effect || config?.vanta?.effect || effect
  const actualOptions = customization?.background?.vanta?.options || config?.vanta?.options || options

  // Default options for fog effect (fallback) - memoized to prevent re-renders
  const defaultOptions = useMemo(() => ({
    highlightColor: 0x7bff3a,
    midtoneColor: 0x0c8f72,
    lowlightColor: 0x5ce7c5,
    baseColor: 0x00121a,
    blurFactor: 0.6,
    zoom: 0.8,
    speed: 1.0,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    ...actualOptions
  }), [actualOptions])

  useEffect(() => {
    const initializeVanta = () => {
      try {
        // Check if libraries are loaded
        if (typeof window === 'undefined' || !(window as any).VANTA || !(window as any).THREE) {
          console.log('⏳ VantaBackground: Libraries not loaded yet, retrying...', {
            hasWindow: typeof window !== 'undefined',
            hasVanta: !!(window as any)?.VANTA,
            hasThree: !!(window as any)?.THREE
          })

          retryCount.current++
          if (retryCount.current < maxRetries) {
            setTimeout(initializeVanta, 500)
          } else {
            console.error('❌ VantaBackground: Failed to load libraries after max retries')
          }
          return
        }

        if (!vantaRef.current) {
          console.error('❌ VantaBackground: No ref element')
          return
        }

        const VANTA = (window as any).VANTA

        // Map effect names to VANTA methods
        const effectMap: Record<string, string> = {
          fog: 'FOG',
          waves: 'WAVES',
          clouds: 'CLOUDS',
          birds: 'BIRDS',
          net: 'NET',
          cells: 'CELLS',
          trunk: 'TRUNK',
          topology: 'TOPOLOGY',
          dots: 'DOTS',
          rings: 'RINGS',
          halo: 'HALO',
          globe: 'GLOBE'
        }

        const effectMethodName = effectMap[actualEffect]
        if (!effectMethodName) {
          console.error(`❌ VantaBackground: Unknown effect "${actualEffect}"`)
          return
        }

        const effectMethod = VANTA[effectMethodName]
        if (!effectMethod) {
          console.error(`❌ VantaBackground: Effect method ${effectMethodName} not found in VANTA`, {
            available: Object.keys(VANTA).filter(k => k !== 'register' && k !== 'version' && k !== 'VantaBase')
          })
          return
        }

        // If effect already exists and it's the same effect type, try to update options
        if (vantaEffect.current && typeof vantaEffect.current.setOptions === 'function') {
          console.log('✅ VantaBackground: Updating existing effect with new options:', defaultOptions)
          try {
            vantaEffect.current.setOptions(defaultOptions)
            return
          } catch (error) {
            console.log('⚠️ VantaBackground: setOptions failed, recreating effect:', error)
            // Fall through to recreate
          }
        }

        // Clean up existing effect if it exists
        if (vantaEffect.current && typeof vantaEffect.current.destroy === 'function') {
          vantaEffect.current.destroy()
          vantaEffect.current = null
        }

        console.log('✅ VantaBackground: Creating effect with options:', defaultOptions)

        // Create the effect
        try {
          vantaEffect.current = effectMethod({
            el: vantaRef.current,
            ...defaultOptions
          })
          console.log('✅ VantaBackground: Effect created successfully')
        } catch (effectError) {
          console.error('❌ VantaBackground: Failed to create effect (likely missing THREE.js or dependencies):', effectError)
          // Don't retry, just fail silently - the page will work without the background effect
          return
        }

      } catch (error) {
        console.error('❌ VantaBackground: Failed to initialize:', error)
      }
    }

    // Start initialization
    initializeVanta()

    // Cleanup function
    return () => {
      if (vantaEffect.current && typeof vantaEffect.current.destroy === 'function') {
        console.log('🧹 VantaBackground: Cleaning up effect')
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualEffect, defaultOptions]) // Re-run when effect type or options change

  return <div ref={vantaRef} className="absolute inset-0 h-full w-full" />
}
