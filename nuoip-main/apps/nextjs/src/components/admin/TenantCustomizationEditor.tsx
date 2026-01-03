'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { AnimatedParticles } from '@/components/auth/AnimatedParticles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TenantCustomization, BackgroundType, VantaEffect, VantaConfig } from '@/types/tenant-customization'
import { DEFAULT_CUSTOMIZATION } from '@/types/tenant-customization'
import { toast } from '@/stores'

// Dynamic import for Vanta preview
const VantaPreview = dynamic(() => import('@/components/auth/VantaPreview'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-black text-sm" style={{ backgroundColor: '#f3f4f6', color: 'black' }}>
      <div className="text-center">
        <div className="text-2xl mb-2">🎨</div>
        <div className="font-medium text-black">Loading Preview...</div>
      </div>
    </div>
  )
})

// Vanta effect configurations with default options
const VANTA_TEST_CONFIGS: Record<VantaEffect, VantaConfig> = {
  fog: {
    effect: 'fog',
    options: {
      highlightColor: 0x7bff3a,
      midtoneColor: 0x0c8f72,
      lowlightColor: 0x5ce7c5,
      baseColor: 0x00121a,
      blurFactor: 0.6,
      zoom: 0.8,
      speed: 1.0,
    },
  },
  waves: {
    effect: 'waves',
    options: {
      color: 0x7bff3a,
      waveHeight: 20,
      waveSpeed: 0.5,
      zoom: 0.8,
    },
  },
  clouds: {
    effect: 'clouds',
    options: {
      backgroundColor: 0x00121a,
      skyColor: 0x0c8f72,
      cloudColor: 0x7bff3a,
      cloudShadowColor: 0x5ce7c5,
      sunColor: 0x7bff3a,
      sunGlareColor: 0x5ce7c5,
      sunlightColor: 0x7bff3a,
    },
  },
  birds: {
    effect: 'birds',
    options: {
      backgroundColor: 0x00121a,
      color1: 0x7bff3a,
      color2: 0x0c8f72,
      colorMode: 'lerp',
      birdSize: 1.0,
      wingSpan: 30,
      speedLimit: 4,
      separation: 20,
      cohesion: 20,
    },
  },
  net: {
    effect: 'net',
    options: {
      color: 0x7bff3a,
      backgroundColor: 0x00121a,
      points: 8,
      maxDistance: 20,
      spacing: 15,
    },
  },
  cells: {
    effect: 'cells',
    options: {
      color1: 0x7bff3a,
      color2: 0x0c8f72,
      size: 1.0,
      speed: 1.0,
    },
  },
  trunk: {
    effect: 'trunk',
    options: {
      backgroundColor: 0x00121a,
      color: 0x7bff3a,
      spacing: 10,
      chaos: 2,
    },
  },
  topology: {
    effect: 'topology',
    options: {
      color: 0x7bff3a,
      backgroundColor: 0x00121a,
    },
  },
  dots: {
    effect: 'dots',
    options: {
      color: 0x7bff3a,
      color2: 0x0c8f72,
      backgroundColor: 0x00121a,
      size: 3,
      spacing: 35,
    },
  },
  rings: {
    effect: 'rings',
    options: {
      backgroundColor: 0x00121a,
      color: 0x7bff3a,
    },
  },
  halo: {
    effect: 'halo',
    options: {
      backgroundColor: 0x00121a,
      baseColor: 0x7bff3a,
      amplitudeFactor: 2,
      xOffset: 0.5,
      yOffset: 0.5,
    },
  },
  globe: {
    effect: 'globe',
    options: {
      color: 0x7bff3a,
      backgroundColor: 0x00121a,
      size: 1.0,
    },
  },
}

interface TenantCustomizationEditorProps {
  tenantId: string
  initialCustomization?: Partial<TenantCustomization>
  onSave?: (customization: Partial<TenantCustomization>) => void
}

export function TenantCustomizationEditor({
  tenantId,
  initialCustomization,
  onSave
}: TenantCustomizationEditorProps) {
  const [customization, setCustomization] = useState<Partial<TenantCustomization>>(
    initialCustomization || {}
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Sync state when initialCustomization changes (e.g., after fetching saved customization)
  useEffect(() => {
    if (initialCustomization) {
      console.log('[TenantCustomizationEditor] Loading initial customization:', JSON.stringify(initialCustomization, null, 2))
      setCustomization(initialCustomization)
    } else {
      // Reset to empty if no initial customization
      setCustomization({})
    }
  }, [initialCustomization])

  // Get current Vanta effect and options
  // Check multiple possible locations for the saved effect
  const savedEffect = customization.background?.vanta?.effect ||
    customization.background?.type === 'vanta' && customization.background?.vanta?.effect ||
    null
  const currentVantaEffect = savedEffect || 'fog'
  const savedOptions = customization.background?.vanta?.options
  const currentVantaOptions = savedOptions || VANTA_TEST_CONFIGS[currentVantaEffect].options

  // Debug logging
  useEffect(() => {
    console.log('[TenantCustomizationEditor] Current state:', {
      currentVantaEffect,
      hasSavedEffect: !!savedEffect,
      savedEffect,
      hasSavedOptions: !!savedOptions,
      savedOptionsKeys: savedOptions ? Object.keys(savedOptions) : [],
      customizationBackground: customization.background,
    })
  }, [currentVantaEffect, savedEffect, savedOptions, customization.background])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Get auth token
      let token: string | null = null
      if (typeof window !== 'undefined') {
        try {
          const authStorage = localStorage.getItem('auth-storage')
          if (authStorage) {
            const parsed = JSON.parse(authStorage)
            token = parsed?.state?.token || null
          }
        } catch {
          // Ignore errors
        }
      }

      const authHeader = token ? { Authorization: 'Bearer ' + token } : {}
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeader,
      }

      // Ensure background is properly structured based on its type
      // Only apply Vanta logic if the background type is actually 'vanta'
      let backgroundToSave = customization.background

      if (customization.background?.type === 'vanta') {
        // If background type is vanta, ensure vanta options are properly included
        backgroundToSave = {
          type: 'vanta' as const,
          vanta: {
            effect: customization.background?.vanta?.effect || currentVantaEffect,
            options: customization.background?.vanta?.options || currentVantaOptions,
          },
        }
      } else if (customization.background?.type === 'gradient') {
        // Ensure gradient is properly structured
        backgroundToSave = {
          type: 'gradient' as const,
          gradient: customization.background.gradient,
        }
      } else if (customization.background?.type === 'solid') {
        // Ensure solid color is properly structured
        backgroundToSave = {
          type: 'solid' as const,
          solidColor: customization.background.solidColor || '#1e3a8a',
        }
      } else if (customization.background?.type === 'particles') {
        // Ensure particles is properly structured with default values
        backgroundToSave = {
          type: 'particles' as const,
          particles: {
            colors: customization.background.particles?.colors || ['#7bff3a', '#0c8f72', '#5ce7c5'], // Match Vanta fog colors
            count: customization.background.particles?.count,
            minAlpha: customization.background.particles?.minAlpha,
          },
        }
      }

      const customizationToSave = {
        ...customization,
        background: backgroundToSave,
      }

      console.log('[TenantCustomizationEditor] Saving customization:', JSON.stringify(customizationToSave, null, 2))

      const response = await fetch('/api/tenants/' + tenantId + '/customization', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ customization: customizationToSave }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to save customization')
        throw new Error(errorText)
      }

      const savedData = await response.json().catch(() => ({ customization: customizationToSave }))
      const savedCustomization = savedData.customization || customizationToSave

      setSuccess(true)
      setCustomization(savedCustomization) // Update state with saved data
      toast.success('Customization saved', 'Tenant customization settings updated successfully.')
      onSave?.(savedCustomization)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Save failed', 'Unable to save customization settings: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setCustomization({})
    setError(null)
    setSuccess(false)
  }

  const updateVantaOption = (key: string, value: any) => {
    setCustomization(prev => {
      const currentEffect = prev.background?.vanta?.effect || currentVantaEffect
      const currentOptions = prev.background?.vanta?.options || VANTA_TEST_CONFIGS[currentEffect].options
      return {
        ...prev,
        background: {
          ...prev.background,
          type: 'vanta',
          vanta: {
            effect: currentEffect,
            options: {
              ...currentOptions,
              [key]: value,
            },
          },
        },
      }
    })
  }

  const backgroundType = customization.background?.type || DEFAULT_CUSTOMIZATION.background.type

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm" style={{ backgroundColor: 'white', color: 'black' }}>
      <div>
        <h2 className="text-2xl font-bold text-black">Tenant Customization</h2>
        <p className="mt-1 text-sm text-black">
          Customize the OTP login page appearance for this tenant.
        </p>
      </div>

      {/* Vanta Feature Highlight */}
      {backgroundType === 'vanta' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎨</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black mb-1">
                Vanta.js 3D Backgrounds Active
              </h3>
              <p className="text-sm text-black mb-2">
                Your tenant now features stunning interactive 3D backgrounds powered by Vanta.js.
                Customize colors, animations, and effects below for a unique login experience.
              </p>
              <div className="flex items-center space-x-4 text-xs text-black">
                <span className="flex items-center space-x-1">
                  <span>⚡</span>
                  <span>Interactive Animations</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>🎨</span>
                  <span>Customizable Colors</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📱</span>
                  <span>Mobile Optimized</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Customization saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Background Configuration */}
      <div className={
        'space-y-4 rounded-lg border bg-gray-50 p-4 ' +
        (backgroundType === 'vanta'
          ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200'
          : backgroundType === 'particles'
            ? 'border-orange-300 bg-orange-50/30 ring-1 ring-orange-200'
            : backgroundType === 'gradient'
              ? 'border-purple-300 bg-purple-50/30 ring-1 ring-purple-200'
              : 'border-gray-200')
      }>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Background</h3>
          {backgroundType === 'vanta' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
              <span>🎨</span>
              <span>Vanta Active</span>
            </span>
          )}
          {backgroundType === 'particles' && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
              <span>✨</span>
              <span>Particles Active</span>
            </span>
          )}
          {backgroundType === 'gradient' && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium flex items-center space-x-1">
              <span>🌈</span>
              <span>Gradient Active</span>
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="background-type-trigger" className="text-black">Background Type</Label>
          <Select
            value={backgroundType}
            onValueChange={(value: BackgroundType) => {
              setCustomization(prev => ({
                ...prev,
                background: {
                  ...prev.background,
                  type: value,
                },
              }))
            }}
          >
            <SelectTrigger id="background-type-trigger" name="backgroundType" className="bg-white text-black border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 text-black">
              <SelectItem value="solid" className="text-black hover:bg-gray-50">🎨 Solid Color</SelectItem>
              <SelectItem value="gradient" className="text-black hover:bg-purple-50">🌈 Gradient (Color Mixing)</SelectItem>
              <SelectItem value="particles" className="text-black hover:bg-orange-50">✨ Particles (Animated Dots)</SelectItem>
              <SelectItem value="vanta" className="text-black hover:bg-blue-50 font-medium">
                🎭 Vanta.js Effect (3D Interactive)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {backgroundType === 'solid' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="solid-color-input" className="text-black">Background Color</Label>
              <Input
                id="solid-color-input"
                name="solidColor"
                type="color"
                className="bg-gray-50 text-black border-gray-200"
                style={{ backgroundColor: '#f9fafb', color: 'black', borderColor: '#e5e7eb' }}
                value={customization.background?.solidColor || '#1e3a8a'}
                onChange={(e) => {
                  setCustomization(prev => ({
                    ...prev,
                    background: {
                      ...prev.background,
                      type: 'solid',
                      solidColor: e.target.value,
                    },
                  }))
                }}
              />
            </div>

            {/* Solid Color Preview */}
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-300">
                <h5 className="text-sm font-medium text-black flex items-center space-x-2">
                  <span>👁️</span>
                  <span>Live Preview</span>
                </h5>
              </div>
              <div
                className="h-32 w-full transition-colors duration-300"
                style={{ backgroundColor: customization.background?.solidColor || '#1e3a8a' }}
              />
            </div>
          </div>
        )}

        {backgroundType === 'gradient' && (
          <div className="space-y-6">
            {/* Gradient Type Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label className="text-lg font-semibold text-black">🌈 Gradient Type</Label>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                  Advanced Color Mixing
                </span>
              </div>
              <Select
                value={customization.background?.gradient?.type || 'linear'}
                onValueChange={(value: 'linear' | 'radial') => {
                  setCustomization(prev => ({
                    ...prev,
                    background: {
                      ...prev.background,
                      type: 'gradient',
                      gradient: {
                        ...prev.background?.gradient,
                        type: value,
                        colors: prev.background?.gradient?.colors || ['#667eea', '#764ba2'],
                        direction: prev.background?.gradient?.direction || 'to bottom',
                        shape: prev.background?.gradient?.shape || 'ellipse',
                        position: prev.background?.gradient?.position || 'center',
                      },
                    },
                  }))
                }}
              >
                <SelectTrigger className="bg-white border-2 border-purple-200 hover:border-purple-300 focus:border-purple-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 text-black">
                  <SelectItem value="linear" className="text-black hover:bg-purple-50">
                    📐 Linear Gradient (Directional)
                  </SelectItem>
                  <SelectItem value="radial" className="text-black hover:bg-purple-50">
                    ⭕ Radial Gradient (Circular)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-black">
                Choose between directional linear gradients or circular radial gradients
              </p>
            </div>

            {/* Gradient Controls */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-black flex items-center space-x-2">
                <span>🎨</span>
                <span>Gradient Colors</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  {(customization.background?.gradient?.colors?.length || 2)} Colors
                </span>
              </h4>

              {/* Color Picker Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(customization.background?.gradient?.colors || ['#667eea', '#764ba2']).map((color, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-xs font-medium">
                      Color {index + 1}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        className="w-12 h-8 border border-gray-200 bg-gray-50 rounded"
                        style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(customization.background?.gradient?.colors || ['#667eea', '#764ba2'])]
                          newColors[index] = e.target.value
                          setCustomization(prev => ({
                            ...prev,
                            background: {
                              ...prev.background,
                              type: 'gradient',
                              gradient: {
                                ...prev.background?.gradient,
                                colors: newColors,
                              },
                            },
                          }))
                        }}
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(customization.background?.gradient?.colors || ['#667eea', '#764ba2'])]
                          newColors[index] = e.target.value
                          setCustomization(prev => ({
                            ...prev,
                            background: {
                              ...prev.background,
                              type: 'gradient',
                              gradient: {
                                ...prev.background?.gradient,
                                colors: newColors,
                              },
                            },
                          }))
                        }}
                        className="flex-1 text-black text-sm"
                        placeholder="#000000"
                      />
                      {(customization.background?.gradient?.colors?.length || 2) > 2 && (
                        <button
                          onClick={() => {
                            const newColors = [...(customization.background?.gradient?.colors || ['#667eea', '#764ba2'])]
                            newColors.splice(index, 1)
                            setCustomization(prev => ({
                              ...prev,
                              background: {
                                ...prev.background,
                                type: 'gradient',
                                gradient: {
                                  ...prev.background?.gradient,
                                  colors: newColors,
                                },
                              },
                            }))
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove color"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Color Button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const newColors = [...(customization.background?.gradient?.colors || ['#667eea', '#764ba2']), '#f093fb']
                    setCustomization(prev => ({
                      ...prev,
                      background: {
                        ...prev.background,
                        type: 'gradient',
                        gradient: {
                          ...prev.background?.gradient,
                          colors: newColors,
                        },
                      },
                    }))
                  }}
                  className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-md transition-colors flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Color</span>
                </button>

                <button
                  onClick={() => {
                    const defaultColors = ['#667eea', '#764ba2']
                    setCustomization(prev => ({
                      ...prev,
                      background: {
                        ...prev.background,
                        type: 'gradient',
                        gradient: {
                          ...prev.background?.gradient,
                          colors: defaultColors,
                        },
                      },
                    }))
                  }}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-black px-3 py-2 rounded-md transition-colors"
                >
                  🔄 Reset Colors
                </button>
              </div>
            </div>

            {/* Advanced Gradient Controls */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-black flex items-center space-x-2">
                <span>⚙️</span>
                <span>Advanced Controls</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Linear Gradient Direction */}
                {(!customization.background?.gradient?.type || customization.background.gradient.type === 'linear') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Direction</Label>
                    <Select
                      value={customization.background?.gradient?.direction || 'to bottom'}
                      onValueChange={(value: string) => {
                        setCustomization(prev => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            type: 'gradient',
                            gradient: {
                              ...prev.background?.gradient,
                              direction: value,
                            },
                          },
                        }))
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 text-black">
                        <SelectItem value="to top" className="text-black">⬆️ To Top</SelectItem>
                        <SelectItem value="to bottom" className="text-black">⬇️ To Bottom</SelectItem>
                        <SelectItem value="to left" className="text-black">⬅️ To Left</SelectItem>
                        <SelectItem value="to right" className="text-black">➡️ To Right</SelectItem>
                        <SelectItem value="to top left" className="text-black">↖️ To Top Left</SelectItem>
                        <SelectItem value="to top right" className="text-black">↗️ To Top Right</SelectItem>
                        <SelectItem value="to bottom left" className="text-black">↙️ To Bottom Left</SelectItem>
                        <SelectItem value="to bottom right" className="text-black">↘️ To Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Radial Gradient Shape */}
                {customization.background?.gradient?.type === 'radial' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Shape</Label>
                    <Select
                      value={customization.background?.gradient?.shape || 'ellipse'}
                      onValueChange={(value: 'ellipse' | 'circle') => {
                        setCustomization(prev => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            type: 'gradient',
                            gradient: {
                              ...prev.background?.gradient,
                              shape: value,
                            },
                          },
                        }))
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 text-black">
                        <SelectItem value="ellipse" className="text-black">⭕ Ellipse</SelectItem>
                        <SelectItem value="circle" className="text-black">⭕ Circle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Radial Gradient Position */}
                {customization.background?.gradient?.type === 'radial' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Position</Label>
                    <Select
                      value={customization.background?.gradient?.position || 'center'}
                      onValueChange={(value: string) => {
                        setCustomization(prev => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            type: 'gradient',
                            gradient: {
                              ...prev.background?.gradient,
                              position: value,
                            },
                          },
                        }))
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 text-black">
                        <SelectItem value="center" className="text-black">🎯 Center</SelectItem>
                        <SelectItem value="top" className="text-black">⬆️ Top</SelectItem>
                        <SelectItem value="bottom" className="text-black">⬇️ Bottom</SelectItem>
                        <SelectItem value="left" className="text-black">⬅️ Left</SelectItem>
                        <SelectItem value="right" className="text-black">➡️ Right</SelectItem>
                        <SelectItem value="top left" className="text-black">↖️ Top Left</SelectItem>
                        <SelectItem value="top right" className="text-black">↗️ Top Right</SelectItem>
                        <SelectItem value="bottom left" className="text-black">↙️ Bottom Left</SelectItem>
                        <SelectItem value="bottom right" className="text-black">↘️ Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Gradient Preview */}
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden" style={{ backgroundColor: 'white' }}>
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-300" style={{ backgroundColor: '#f3f4f6' }}>
                <h5 className="text-sm font-medium text-black flex items-center space-x-2">
                  <span>👁️</span>
                  <span>Gradient Preview</span>
                </h5>
              </div>
              <div
                className="relative h-32"
                style={{
                  background: customization.background?.gradient?.type === 'radial'
                    ? 'radial-gradient(' + (customization.background.gradient.shape || 'ellipse') + ' at ' + (customization.background.gradient.position || 'center') + ', ' + (customization.background.gradient.colors || ['#667eea', '#764ba2']).join(', ') + ')'
                    : 'linear-gradient(' + (customization.background.gradient?.direction || 'to bottom') + ', ' + (customization.background.gradient?.colors || ['#667eea', '#764ba2']).join(', ') + ')'
                }}
              >
                <div className="absolute bottom-2 left-2 bg-white/90 text-black text-xs px-2 py-1 rounded border border-gray-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'black' }}>
                  {customization.background?.gradient?.type === 'radial' ? 'Radial' : 'Linear'} Gradient
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 flex items-center space-x-2">
                <span>💡</span>
                <span>
                  <strong>Gradient Tips:</strong> Add 2-5 colors for best results. Linear gradients flow in one direction,
                  radial gradients spread from a center point. Changes are applied in real-time to the OTP login page.
                </span>
              </p>
            </div>
          </div>
        )}

        {backgroundType === 'particles' && (
          <div className="space-y-6">
            {/* Particles Configuration */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label className="text-lg font-semibold text-black">✨ Particle Effect</Label>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                  Animated Particles
                </span>
              </div>
              <p className="text-sm text-black">
                Create beautiful animated particle effects with customizable colors, count, and transparency.
              </p>
            </div>

            {/* Particle Colors */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-black flex items-center space-x-2">
                <span>🎨</span>
                <span>Particle Colors</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  {(customization.background?.particles?.colors?.length || 3)} Colors
                </span>
              </h4>

              {/* Color Picker Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(customization.background?.particles?.colors || ['#7bff3a', '#0c8f72', '#5ce7c5']).map((color, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-xs font-medium">
                      Color {index + 1}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        className="w-12 h-8 border border-gray-300 bg-white rounded cursor-pointer"
                        style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#000000' }}
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(customization.background?.particles?.colors || ['#7bff3a', '#0c8f72', '#5ce7c5'])]
                          newColors[index] = e.target.value
                          setCustomization(prev => ({
                            ...prev,
                            background: {
                              ...prev.background,
                              type: 'particles',
                              particles: {
                                ...prev.background?.particles,
                                colors: newColors,
                              },
                            },
                          }))
                        }}
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(customization.background?.particles?.colors || ['#7bff3a', '#0c8f72', '#5ce7c5'])]
                          newColors[index] = e.target.value
                          setCustomization(prev => ({
                            ...prev,
                            background: {
                              ...prev.background,
                              type: 'particles',
                              particles: {
                                ...prev.background?.particles,
                                colors: newColors,
                              },
                            },
                          }))
                        }}
                        className="flex-1 text-black text-sm bg-white border border-gray-300"
                        style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#d1d5db' }}
                        placeholder="#000000"
                      />
                      {(customization.background?.particles?.colors?.length || 3) > 2 && (
                        <button
                          onClick={() => {
                            const newColors = [...(customization.background?.particles?.colors || ['#7bff3a', '#0c8f72', '#5ce7c5'])]
                            newColors.splice(index, 1)
                            setCustomization(prev => ({
                              ...prev,
                              background: {
                                ...prev.background,
                                type: 'particles',
                                particles: {
                                  ...prev.background?.particles,
                                  colors: newColors,
                                },
                              },
                            }))
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove color"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Color Button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const newColors = [...(customization.background?.particles?.colors || ['#7bff3a', '#0c8f72', '#5ce7c5']), '#f093fb']
                    setCustomization(prev => ({
                      ...prev,
                      background: {
                        ...prev.background,
                        type: 'particles',
                        particles: {
                          ...prev.background?.particles,
                          colors: newColors,
                        },
                      },
                    }))
                  }}
                  className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-md transition-colors flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Color</span>
                </button>

                <button
                  onClick={() => {
                    const defaultColors = ['#7bff3a', '#0c8f72', '#5ce7c5']
                    setCustomization(prev => ({
                      ...prev,
                      background: {
                        ...prev.background,
                        type: 'particles',
                        particles: {
                          ...prev.background?.particles,
                          colors: defaultColors,
                        },
                      },
                    }))
                  }}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-black px-3 py-2 rounded-md transition-colors"
                >
                  🔄 Reset Colors
                </button>
              </div>
            </div>

            {/* Particle Controls */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-black flex items-center space-x-2">
                <span>⚙️</span>
                <span>Particle Settings</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Particle Count */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Particle Count</Label>
                  <div className="space-y-2">
                    <Input
                      type="range"
                      min="20"
                      max="200"
                      step="10"
                      value={customization.background?.particles?.count || 90}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        background: {
                          ...prev.background,
                          type: 'particles',
                          particles: {
                            ...prev.background?.particles,
                            count: parseInt(e.target.value),
                          },
                        },
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-black">
                      <span>20</span>
                      <span className="font-medium text-black">{customization.background?.particles?.count || 90}</span>
                      <span>200</span>
                    </div>
                  </div>
                </div>

                {/* Minimum Alpha */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum Transparency</Label>
                  <div className="space-y-2">
                    <Input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={customization.background?.particles?.minAlpha || 0.28}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        background: {
                          ...prev.background,
                          type: 'particles',
                          particles: {
                            ...prev.background?.particles,
                            minAlpha: parseFloat(e.target.value),
                          },
                        },
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-black">
                      <span>10%</span>
                      <span className="font-medium text-black">{Math.round((customization.background?.particles?.minAlpha || 0.28) * 100)}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Particles Preview */}
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden" style={{ backgroundColor: 'white' }}>
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-300" style={{ backgroundColor: '#f3f4f6' }}>
                <h5 className="text-sm font-medium text-black flex items-center space-x-2">
                  <span>👁️</span>
                  <span>Particles Preview</span>
                </h5>
              </div>
              <div className="relative h-32 bg-gray-100 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                {/* Simulated particle preview */}
                <div className="absolute inset-0 bg-[#00121a]">
                  <AnimatedParticles
                    config={customization.background?.particles || { colors: ['#ffffff', '#00d9ff', '#ff00ff'] }}
                    variant="contained"
                    backgroundColor="#00121a"
                  />
                </div>
                <div className="absolute bottom-2 left-2 bg-white/90 text-black text-xs px-2 py-1 rounded border border-gray-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'black' }}>
                  {customization.background?.particles?.count || 90} Particles
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800 flex items-center space-x-2">
                <span>💡</span>
                <span>
                  <strong>Particle Tips:</strong> More particles create denser effects. Lower transparency shows more contrast.
                  Colors are randomly assigned to particles for a natural look.
                </span>
              </p>
            </div>
          </div>
        )}

        {backgroundType === 'vanta' && (
          <div className="space-y-6">
            {/* Vanta Effect Selector */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label className="text-lg font-semibold text-black">🎨 Vanta Effect</Label>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  Interactive 3D Background
                </span>
              </div>
              <Select
                value={currentVantaEffect}
                onValueChange={(value: VantaEffect) => {
                  // When changing effect, preserve existing options if they exist, otherwise use defaults
                  const defaultOptions = VANTA_TEST_CONFIGS[value].options
                  setCustomization(prev => {
                    const existingOptions = prev.background?.vanta?.options
                    // If changing to a different effect, use default options for that effect
                    // If it's the same effect, preserve existing custom options
                    const optionsToUse = prev.background?.vanta?.effect === value && existingOptions
                      ? existingOptions
                      : defaultOptions

                    return {
                      ...prev,
                      background: {
                        ...prev.background,
                        type: 'vanta',
                        vanta: {
                          effect: value,
                          options: optionsToUse,
                        },
                      },
                    }
                  })
                }}
              >
                <SelectTrigger className="bg-white border-2 border-blue-200 hover:border-blue-300 focus:border-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 text-black max-h-60">
                  <SelectItem value="fog" className="text-black hover:bg-blue-50">
                    🌫️ Fog (Animated Particles)
                  </SelectItem>
                  <SelectItem value="waves" className="text-black hover:bg-blue-50">
                    🌊 Waves (Flowing Animation)
                  </SelectItem>
                  <SelectItem value="clouds" className="text-black hover:bg-blue-50">
                    ☁️ Clouds (Floating Particles)
                  </SelectItem>
                  <SelectItem value="birds" className="text-black hover:bg-blue-50">
                    🐦 Birds (Flying Animation)
                  </SelectItem>
                  <SelectItem value="net" className="text-black hover:bg-blue-50">
                    🕸️ Net (Geometric Pattern)
                  </SelectItem>
                  <SelectItem value="cells" className="text-black hover:bg-blue-50">
                    🔬 Cells (Organic Pattern)
                  </SelectItem>
                  <SelectItem value="trunk" className="text-black hover:bg-blue-50">
                    🌳 Trunk (Tree-like Structure)
                  </SelectItem>
                  <SelectItem value="topology" className="text-black hover:bg-blue-50">
                    🗺️ Topology (Network Map)
                  </SelectItem>
                  <SelectItem value="dots" className="text-black hover:bg-blue-50">
                    ⚫ Dots (Particle Field)
                  </SelectItem>
                  <SelectItem value="rings" className="text-black hover:bg-blue-50">
                    🏹 Rings (Concentric Circles)
                  </SelectItem>
                  <SelectItem value="halo" className="text-black hover:bg-blue-50">
                    ✨ Halo (Radiant Effect)
                  </SelectItem>
                  <SelectItem value="globe" className="text-black hover:bg-blue-50">
                    🌍 Globe (3D Sphere)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-black">
                Choose from 12 different animated 3D background effects powered by Vanta.js
              </p>
            </div>

            {/* Effect Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-black">🎛️ Effect Controls</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    {Object.keys(currentVantaOptions).length} Parameters
                  </span>
                </div>
                <button
                  onClick={() => {
                    const defaultOptions = VANTA_TEST_CONFIGS[currentVantaEffect].options
                    setCustomization(prev => ({
                      ...prev,
                      background: {
                        ...prev.background,
                        type: 'vanta',
                        vanta: {
                          effect: currentVantaEffect,
                          options: defaultOptions,
                        },
                      },
                    }))
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded-md transition-colors"
                >
                  🔄 Reset to Defaults
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(currentVantaOptions).map(([key, value]) => {
                    const isColor = key.toLowerCase().includes('color') && typeof value === 'number'
                    const isNumber = typeof value === 'number'
                    const isString = typeof value === 'string'

                    if (isColor) {
                      return (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={'#' + value.toString(16).padStart(6, '0')}
                              onChange={(e) => updateVantaOption(key, parseInt(e.target.value.slice(1), 16))}
                              className="w-12 h-8 border border-gray-200 bg-gray-50"
                              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                            />
                            <Input
                              type="text"
                              value={'#' + value.toString(16).padStart(6, '0')}
                              onChange={(e) => updateVantaOption(key, parseInt(e.target.value.slice(1), 16))}
                              className="flex-1 text-black bg-white border-gray-300"
                              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      )
                    } else if (isNumber) {
                      const min = key.toLowerCase().includes('size') || key.toLowerCase().includes('spacing') ? 0 :
                        key.toLowerCase().includes('speed') ? 0 :
                          key.toLowerCase().includes('blur') ? 0 :
                            key.toLowerCase().includes('zoom') ? 0.1 :
                              key.toLowerCase().includes('amplitude') ? 0 : 0
                      const max = key.toLowerCase().includes('size') ? 10 :
                        key.toLowerCase().includes('spacing') ? 50 :
                          key.toLowerCase().includes('speed') ? 5 :
                            key.toLowerCase().includes('blur') ? 1 :
                              key.toLowerCase().includes('zoom') ? 2 :
                                key.toLowerCase().includes('amplitude') ? 5 :
                                  key.toLowerCase().includes('chaos') ? 100 :
                                    key.toLowerCase().includes('points') ? 20 :
                                      key.toLowerCase().includes('wingspan') ? 50 :
                                        key.toLowerCase().includes('separation') || key.toLowerCase().includes('cohesion') ? 50 : 100
                      const step = key.toLowerCase().includes('blur') || key.toLowerCase().includes('zoom') ? 0.1 : 1

                      return (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <div className="space-y-2">
                            <Input
                              type="range"
                              min={min}
                              max={max}
                              step={step}
                              value={value}
                              onChange={(e) => updateVantaOption(key, parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-black">
                              <span>{min}</span>
                              <span className="font-medium text-black">{value}</span>
                              <span>{max}</span>
                            </div>
                          </div>
                        </div>
                      )
                    } else if (isString) {
                      return (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateVantaOption(key, e.target.value)}
                            className="text-black bg-white border-gray-300"
                            style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 flex items-center space-x-2">
                  <span>💡</span>
                  <span>
                    <strong>Live Preview:</strong> Changes are applied in real-time to the OTP login page.
                    Use the &quot;Reset to Defaults&quot; button to restore original effect settings.
                  </span>
                </p>
              </div>

              {/* Live Effect Preview */}
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden" style={{ backgroundColor: 'white' }}>
                <div className="px-3 py-2 bg-gray-100 border-b border-gray-300" style={{ backgroundColor: '#f3f4f6' }}>
                  <h5 className="text-sm font-medium text-black flex items-center space-x-2">
                    <span>👁️</span>
                    <span>Live Preview: {currentVantaEffect.charAt(0).toUpperCase() + currentVantaEffect.slice(1)}</span>
                  </h5>
                </div>
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  {/* Live Vanta effect preview */}
                  <VantaPreview effect={currentVantaEffect} options={currentVantaOptions} />
                  {/* Overlay with effect info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 border-t border-gray-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                    <p className="text-xs text-black text-center">
                      {currentVantaEffect === 'fog' && '🎭 Animated fog particles with customizable colors'}
                      {currentVantaEffect === 'waves' && '🌊 Flowing wave animation with height controls'}
                      {currentVantaEffect === 'clouds' && '☁️ Floating cloud particles with sky colors'}
                      {currentVantaEffect === 'birds' && '🐦 Flying bird animation with flock behavior'}
                      {currentVantaEffect === 'net' && '🕸️ Geometric network pattern with connections'}
                      {currentVantaEffect === 'cells' && '🔬 Organic cell structure with color variations'}
                      {currentVantaEffect === 'trunk' && '🌳 Tree-like branching structure with chaos'}
                      {currentVantaEffect === 'topology' && '🗺️ Network topology map with connections'}
                      {currentVantaEffect === 'dots' && '⚫ Particle dot field with spacing controls'}
                      {currentVantaEffect === 'rings' && '🏹 Concentric ring pattern with colors'}
                      {currentVantaEffect === 'halo' && '✨ Radiant halo effect with amplitude'}
                      {currentVantaEffect === 'globe' && '🌍 3D globe visualization with rotation'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Button Colors */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-black">Primary Button</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Background</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.primaryButton?.background || DEFAULT_CUSTOMIZATION.primaryButton.background}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  primaryButton: {
                    ...prev.primaryButton,
                    background: e.target.value,
                    hover: prev.primaryButton?.hover || DEFAULT_CUSTOMIZATION.primaryButton.hover,
                    text: prev.primaryButton?.text || DEFAULT_CUSTOMIZATION.primaryButton.text,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Hover</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.primaryButton?.hover || DEFAULT_CUSTOMIZATION.primaryButton.hover}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  primaryButton: {
                    ...prev.primaryButton,
                    background: prev.primaryButton?.background || DEFAULT_CUSTOMIZATION.primaryButton.background,
                    hover: e.target.value,
                    text: prev.primaryButton?.text || DEFAULT_CUSTOMIZATION.primaryButton.text,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Text</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.primaryButton?.text || DEFAULT_CUSTOMIZATION.primaryButton.text}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  primaryButton: {
                    ...prev.primaryButton,
                    background: prev.primaryButton?.background || DEFAULT_CUSTOMIZATION.primaryButton.background,
                    hover: prev.primaryButton?.hover || DEFAULT_CUSTOMIZATION.primaryButton.hover,
                    text: e.target.value,
                  },
                }))
              }}
            />
          </div>
        </div>
      </div>

      {/* OTP Form Colors */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-black">OTP Form</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Input Border</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.otpForm?.inputBorder || DEFAULT_CUSTOMIZATION.otpForm.inputBorder}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  otpForm: {
                    ...DEFAULT_CUSTOMIZATION.otpForm,
                    ...prev.otpForm,
                    inputBorder: e.target.value,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Border (Focus)</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.otpForm?.inputBorderFocus || DEFAULT_CUSTOMIZATION.otpForm.inputBorderFocus}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  otpForm: {
                    ...DEFAULT_CUSTOMIZATION.otpForm,
                    ...prev.otpForm,
                    inputBorderFocus: e.target.value,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.otpForm?.inputBackground || DEFAULT_CUSTOMIZATION.otpForm.inputBackground}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  otpForm: {
                    ...DEFAULT_CUSTOMIZATION.otpForm,
                    ...prev.otpForm,
                    inputBackground: e.target.value,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Background (Filled)</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.otpForm?.inputBackgroundFilled || DEFAULT_CUSTOMIZATION.otpForm.inputBackgroundFilled}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  otpForm: {
                    ...DEFAULT_CUSTOMIZATION.otpForm,
                    ...prev.otpForm,
                    inputBackgroundFilled: e.target.value,
                  },
                }))
              }}
            />
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-black">Input Fields</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Background</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.inputFields?.background || DEFAULT_CUSTOMIZATION.inputFields.background}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  inputFields: {
                    ...DEFAULT_CUSTOMIZATION.inputFields,
                    ...prev.inputFields,
                    background: e.target.value,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Border</Label>
            <Input
              type="color"
              className="text-black border-gray-200 bg-gray-50"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              value={customization.inputFields?.border || DEFAULT_CUSTOMIZATION.inputFields.border}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  inputFields: {
                    ...DEFAULT_CUSTOMIZATION.inputFields,
                    ...prev.inputFields,
                    border: e.target.value,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-black">Border (Focus)</Label>
            <Input
              type="color"
              className="bg-gray-50 text-black border-gray-200"
              style={{ backgroundColor: '#f9fafb', color: 'black', borderColor: '#e5e7eb' }}
              value={customization.inputFields?.borderFocus || DEFAULT_CUSTOMIZATION.inputFields.borderFocus}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  inputFields: {
                    ...DEFAULT_CUSTOMIZATION.inputFields,
                    ...prev.inputFields,
                    borderFocus: e.target.value,
                  },
                }))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-black">Text Color</Label>
            <Input
              type="color"
              className="bg-gray-50 text-black border-gray-200"
              style={{ backgroundColor: '#f9fafb', color: 'black', borderColor: '#e5e7eb' }}
              value={customization.inputFields?.text || DEFAULT_CUSTOMIZATION.inputFields.text}
              onChange={(e) => {
                setCustomization(prev => ({
                  ...prev,
                  inputFields: {
                    ...DEFAULT_CUSTOMIZATION.inputFields,
                    ...prev.inputFields,
                    text: e.target.value,
                  },
                }))
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
          style={{
            backgroundColor: saving ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none'
          }}
        >
          {saving ? 'Saving...' : 'Save Customization'}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          disabled={saving}
          className="bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200"
          style={{
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
            borderColor: '#a5b4fc'
          }}
        >
          Reset to Default
        </Button>
      </div>

      {/* Preview Note */}
      <Alert className="bg-gray-50 border-gray-200" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
        <AlertDescription className="text-black">
          <strong className="text-black">Note:</strong> Changes will be applied to the OTP login page immediately after saving.
          Test the login page at <code className="rounded bg-gray-100 px-1 py-0.5 text-sm text-black">/otp-login</code> to see your changes.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default TenantCustomizationEditor

