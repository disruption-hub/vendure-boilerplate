'use client'

import { useEffect, useRef } from 'react'

interface VantaPreviewProps {
  effect: string
  options?: Record<string, any>
}

export default function VantaPreview({ effect, options = {} }: VantaPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vantaRef = useRef<any>(null)
  const retryCount = useRef(0)
  const maxRetries = 15 // Increased retries for slower script loading

  useEffect(() => {
    // Reset retry count when effect or options change
    retryCount.current = 0
    
    const initializePreview = () => {
      try {
        // Effects that require p5.js instead of THREE.js
        const p5Effects = ['trunk', 'topology']
        const needsP5 = p5Effects.includes(effect)
        
        // Check if Vanta is available - check multiple ways libraries might be exposed
        const hasVanta = !!(window as any).VANTA || !!(window as any).vanta || !!(window as any).Vanta
        const hasThree = !!(window as any).THREE || !!(window as any).Three
        const hasP5 = !!(window as any).p5 || !!(window as any).P5
        
        const hasRequiredLibs = typeof window !== 'undefined' && 
          hasVanta && 
          (needsP5 ? hasP5 : hasThree)
          
        if (!hasRequiredLibs) {
          const libName = needsP5 ? 'VANTA/p5.js' : 'VANTA/THREE.js'
          const windowKeys = typeof window !== 'undefined' ? Object.keys(window).filter(k => 
            k.includes('VANTA') || k.includes('vanta') || k.includes('THREE') || k.includes('three') || k.includes('p5') || k.includes('P5')
          ) : []
          
          console.log(`VantaPreview: ${libName} not available, retrying... (${retryCount.current}/${maxRetries})`, {
            VANTA: hasVanta,
            THREE: hasThree,
            p5: hasP5,
            needsP5,
            windowKeys,
            // Check if scripts are actually in the DOM
            scripts: typeof document !== 'undefined' ? Array.from(document.querySelectorAll('script[src*="vanta"], script[src*="three"], script[src*="p5"]')).map(s => {
              const script = s as HTMLScriptElement
              return {
                src: script.src,
                id: script.id || 'no-id',
                hasSrc: !!script.src
              }
            }) : []
          })
          retryCount.current++
          if (retryCount.current < maxRetries) {
            // Use shorter delay for first few retries, longer for later ones
            const delay = retryCount.current < 5 ? 500 : 1000
            setTimeout(initializePreview, delay)
          } else {
            console.error(`VantaPreview: Failed to load ${libName} after ${maxRetries} retries`)
          }
          return
        }
        
        // Ensure VANTA is in the expected location - check multiple possible locations
        if (!(window as any).VANTA) {
          // Try to find VANTA in various possible locations
          const vanta = (window as any).vanta || (window as any).Vanta || (window as any).VANTA
          if (vanta) {
            (window as any).VANTA = vanta
            console.log('VantaPreview: Found VANTA in alternate location, mapped to window.VANTA')
          } else {
            // Check if it's in a namespace - search all window properties
            const windowAny = window as any
            for (const key in windowAny) {
              if (key.toLowerCase().includes('vanta') && typeof windowAny[key] === 'object' && windowAny[key] !== null) {
                (window as any).VANTA = windowAny[key]
                console.log(`VantaPreview: Found VANTA at window.${key}, mapped to window.VANTA`)
                break
              }
            }
          }
        }
        
        // Final check - if still not found after mapping, log detailed debug info and return
        if (!(window as any).VANTA) {
          console.error('VantaPreview: VANTA still not found after mapping attempts', {
            allWindowKeys: typeof window !== 'undefined' ? Object.keys(window).slice(0, 100) : [],
            vantaScripts: typeof document !== 'undefined' ? Array.from(document.querySelectorAll('script[src*="vanta"]')).map(s => {
              const script = s as HTMLScriptElement
              return {
                src: script.src,
                id: script.id || 'no-id',
                hasSrc: !!script.src
              }
            }) : [],
            scriptTags: typeof document !== 'undefined' ? Array.from(document.querySelectorAll('script')).filter(s => 
              (s as HTMLScriptElement).src.includes('vanta')
            ).length : 0
          })
          return
        }

        if (!containerRef.current) {
          console.log('VantaPreview: No container ref')
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

        const effectMethodName = effectMap[effect]
        if (!effectMethodName) {
          console.log(`VantaPreview: Unknown effect "${effect}"`)
          return
        }

        const effectMethod = VANTA[effectMethodName]
        if (!effectMethod) {
          console.log(`VantaPreview: Effect method ${effectMethodName} not found`)
          return
        }

        // Simplified options for preview (smaller, faster)
        const previewOptions = {
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          scale: 0.5, // Smaller scale for preview
          scaleMobile: 1.0,
          ...options
        }

        // If effect already exists and it's the same effect, try to update it instead of destroying
        if (vantaRef.current && typeof vantaRef.current.setOptions === 'function') {
          console.log('VantaPreview: Updating existing effect with new options:', previewOptions)
          try {
            vantaRef.current.setOptions(previewOptions)
            return
          } catch (error) {
            console.log('VantaPreview: setOptions failed, recreating effect:', error)
            // Fall through to recreate
          }
        }

        // Clean up existing effect if it exists
        if (vantaRef.current && typeof vantaRef.current.destroy === 'function') {
          vantaRef.current.destroy()
          vantaRef.current = null
        }

        console.log('VantaPreview: Creating effect with options:', previewOptions)

        // Create the preview effect
        vantaRef.current = effectMethod({
          el: containerRef.current,
          ...previewOptions
        })

        console.log('VantaPreview: Effect created successfully')

      } catch (error) {
        console.error('VantaPreview: Failed to initialize:', error)
        // Show fallback
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-sm">
              <div class="text-center">
                <div class="text-2xl mb-2">🎨</div>
                <div class="font-medium">${effect.charAt(0).toUpperCase() + effect.slice(1)} Effect</div>
                <div class="text-xs text-gray-300 mt-1">Preview unavailable</div>
              </div>
            </div>
          `
        }
      }
    }

    // Start initialization
    initializePreview()

    // Cleanup function
    return () => {
      if (vantaRef.current && typeof vantaRef.current.destroy === 'function') {
        try {
          console.log('VantaPreview: Cleaning up effect')
          vantaRef.current.destroy()
          vantaRef.current = null
        } catch (error) {
          // Ignore DOM cleanup errors - Vanta sometimes tries to remove already-removed elements
          console.log('VantaPreview: Cleanup error (expected)', error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, JSON.stringify(options)])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full bg-gray-900"
      style={{ minHeight: '120px' }}
    />
  )
}
