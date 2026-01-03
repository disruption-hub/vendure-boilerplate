/**
 * TENANT CUSTOMIZATION EXAMPLES
 * 
 * This file contains examples of how to use the tenant customization system.
 * Copy and adapt these examples for your specific needs.
 */

// ============================================================================
// Example 1: Using the TenantCustomizationEditor in an Admin Page
// ============================================================================

'use client'

import { useEffect, useState } from 'react'
import { TenantCustomizationEditor } from '@/components/admin/TenantCustomizationEditor'
import type { TenantCustomization } from '@/types/tenant-customization'

export function AdminCustomizationPage({ tenantId }: { tenantId: string }) {
  const [customization, setCustomization] = useState<Partial<TenantCustomization>>()

  useEffect(() => {
    // Fetch existing customization
    fetch(`/api/tenants/${tenantId}/customization`)
      .then(res => res.json())
      .then(data => setCustomization(data.customization))
      .catch(console.error)
  }, [tenantId])

  const handleSave = (newCustomization: Partial<TenantCustomization>) => {
    console.log('Customization saved:', newCustomization)
    // Optionally show a success message or redirect
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <TenantCustomizationEditor
        tenantId={tenantId}
        initialCustomization={customization}
        onSave={handleSave}
      />
    </div>
  )
}

// ============================================================================
// Example 2: Programmatically Setting Customization via API
// ============================================================================

export async function setTenantCustomization(
  tenantId: string,
  customization: Partial<TenantCustomization>
) {
  const response = await fetch(`/api/tenants/${tenantId}/customization`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customization }),
  })

  if (!response.ok) {
    throw new Error('Failed to update customization')
  }

  return response.json()
}

// Usage:
// await setTenantCustomization('tenant-123', {
//   background: { type: 'solid', solidColor: '#1e3a8a' },
//   primaryButton: { background: '#3b82f6', hover: '#2563eb', text: '#ffffff' }
// })

// ============================================================================
// Example 3: Creating Preset Themes
// ============================================================================

export const PRESET_THEMES: Record<string, Partial<TenantCustomization>> = {
  ocean: {
    background: {
      type: 'vanta',
      vanta: {
        effect: 'waves',
        options: {
          color: 0x1e3a8a,
          shininess: 30,
          waveHeight: 15,
          waveSpeed: 1.0,
          zoom: 0.75,
        },
      },
    },
    primaryButton: {
      background: '#0ea5e9',
      hover: '#0284c7',
      text: '#ffffff',
    },
    otpForm: {
      inputBorder: '#7dd3fc',
      inputBorderFocus: '#0ea5e9',
      inputBackground: '#ffffff',
      inputBackgroundFilled: '#e0f2fe',
      inputText: '#0c4a6e',
      inputBorderFilled: '#0ea5e9',
    },
    inputFields: {
      background: '#f0f9ff',
      border: '#7dd3fc',
      borderFocus: '#0ea5e9',
      text: '#0c4a6e',
      placeholder: '#64748b',
    },
  },
  
  sunset: {
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        direction: 'to bottom',
        colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
      },
    },
    primaryButton: {
      background: '#ff6b6b',
      hover: '#ee5a52',
      text: '#ffffff',
    },
    otpForm: {
      inputBorder: '#feca57',
      inputBorderFocus: '#ff6b6b',
      inputBackground: '#ffffff',
      inputBackgroundFilled: '#fff5f5',
      inputText: '#991b1b',
      inputBorderFilled: '#ff6b6b',
    },
    inputFields: {
      background: '#fff5f5',
      border: '#fecaca',
      borderFocus: '#ff6b6b',
      text: '#991b1b',
      placeholder: '#9ca3af',
    },
  },
  
  forest: {
    background: {
      type: 'particles',
      particles: {
        colors: ['#10b981', '#059669', '#047857'],
        count: 100,
        minAlpha: 0.3,
      },
    },
    primaryButton: {
      background: '#10b981',
      hover: '#059669',
      text: '#ffffff',
    },
    otpForm: {
      inputBorder: '#86efac',
      inputBorderFocus: '#10b981',
      inputBackground: '#ffffff',
      inputBackgroundFilled: '#f0fdf4',
      inputText: '#064e3b',
      inputBorderFilled: '#10b981',
    },
    inputFields: {
      background: '#f0fdf4',
      border: '#86efac',
      borderFocus: '#10b981',
      text: '#064e3b',
      placeholder: '#6b7280',
    },
  },

  minimal: {
    background: {
      type: 'solid',
      solidColor: '#f9fafb',
    },
    primaryButton: {
      background: '#111827',
      hover: '#030712',
      text: '#ffffff',
    },
    otpForm: {
      inputBorder: '#d1d5db',
      inputBorderFocus: '#111827',
      inputBackground: '#ffffff',
      inputBackgroundFilled: '#f3f4f6',
      inputText: '#111827',
      inputBorderFilled: '#111827',
    },
    inputFields: {
      background: '#ffffff',
      border: '#d1d5db',
      borderFocus: '#111827',
      text: '#111827',
      placeholder: '#9ca3af',
    },
  },
}

// Apply a preset theme:
export async function applyPresetTheme(tenantId: string, themeName: keyof typeof PRESET_THEMES) {
  const theme = PRESET_THEMES[themeName]
  if (!theme) {
    throw new Error(`Theme "${themeName}" not found`)
  }
  
  return setTenantCustomization(tenantId, theme)
}

// ============================================================================
// Example 4: Theme Selector Component
// ============================================================================

export function ThemeSelector({ 
  tenantId, 
  onApply 
}: { 
  tenantId: string
  onApply?: () => void 
}) {
  const [applying, setApplying] = useState<string | null>(null)

  const handleApplyTheme = async (themeName: keyof typeof PRESET_THEMES) => {
    try {
      setApplying(themeName)
      await applyPresetTheme(tenantId, themeName)
      onApply?.()
    } catch (error) {
      console.error('Failed to apply theme:', error)
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Object.keys(PRESET_THEMES).map((themeName) => (
        <button
          key={themeName}
          onClick={() => handleApplyTheme(themeName as keyof typeof PRESET_THEMES)}
          disabled={applying === themeName}
          className="rounded-lg border border-gray-200 p-4 text-center transition hover:border-gray-300 hover:shadow-md disabled:opacity-50"
        >
          <div className="text-sm font-medium capitalize">{themeName}</div>
          {applying === themeName && (
            <div className="mt-2 text-xs text-gray-600">Applying...</div>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Example 5: Directly in Database (SQL)
// ============================================================================

/*
-- Set Ocean Theme for a tenant
UPDATE tenants 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{customization}',
  '{
    "background": {
      "type": "vanta",
      "vanta": {
        "effect": "waves",
        "options": {
          "color": 2046346,
          "shininess": 30,
          "waveHeight": 15,
          "waveSpeed": 1.0,
          "zoom": 0.75
        }
      }
    },
    "primaryButton": {
      "background": "#0ea5e9",
      "hover": "#0284c7",
      "text": "#ffffff"
    }
  }'::jsonb
)
WHERE id = 'your-tenant-id';

-- Clear customization (use defaults)
UPDATE tenants 
SET settings = settings - 'customization'
WHERE id = 'your-tenant-id';
*/

// ============================================================================
// Example 6: Testing Customization Locally
// ============================================================================

export function CustomizationPreview({ 
  customization 
}: { 
  customization: Partial<TenantCustomization> 
}) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold">Preview</h3>
      
      {/* Button Preview */}
      <div>
        <p className="mb-2 text-sm text-gray-600">Primary Button:</p>
        <button
          style={{
            backgroundColor: customization.primaryButton?.background || '#25d366',
            color: customization.primaryButton?.text || '#171717',
          }}
          className="rounded-full px-6 py-2 font-semibold transition"
          onMouseEnter={(e) => {
            if (customization.primaryButton?.hover) {
              e.currentTarget.style.backgroundColor = customization.primaryButton.hover
            }
          }}
          onMouseLeave={(e) => {
            if (customization.primaryButton?.background) {
              e.currentTarget.style.backgroundColor = customization.primaryButton.background
            }
          }}
        >
          Test Button
        </button>
      </div>

      {/* OTP Input Preview */}
      <div>
        <p className="mb-2 text-sm text-gray-600">OTP Input:</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                borderColor: customization.otpForm?.inputBorder || '#b6d9c4',
                backgroundColor: customization.otpForm?.inputBackground || '#ffffff',
                color: customization.otpForm?.inputText || '#0f3c34',
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border-2 text-center text-lg font-semibold"
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* Input Field Preview */}
      <div>
        <p className="mb-2 text-sm text-gray-600">Input Field:</p>
        <input
          type="text"
          placeholder="Phone number"
          style={{
            backgroundColor: customization.inputFields?.background || '#f5f1ed',
            borderColor: customization.inputFields?.border || '#d1d5db',
            color: customization.inputFields?.text || '#0f172a',
          }}
          className="w-full rounded-2xl border px-4 py-3"
        />
      </div>
    </div>
  )
}

// ============================================================================
// Example 7: Bulk Update Multiple Tenants
// ============================================================================

export async function bulkUpdateTenantCustomization(
  tenantIds: string[],
  customization: Partial<TenantCustomization>
) {
  const results = await Promise.allSettled(
    tenantIds.map(tenantId => 
      setTenantCustomization(tenantId, customization)
    )
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return { succeeded, failed, total: tenantIds.length }
}

// Usage:
// const result = await bulkUpdateTenantCustomization(
//   ['tenant-1', 'tenant-2', 'tenant-3'],
//   PRESET_THEMES.ocean
// )
// console.log(`Updated ${result.succeeded} of ${result.total} tenants`)

