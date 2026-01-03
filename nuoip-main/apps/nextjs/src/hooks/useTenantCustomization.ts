import { useEffect, useState } from 'react'
import type { TenantCustomization } from '@/types/tenant-customization'
import { mergeCustomization } from '@/types/tenant-customization'

/**
 * Hook to fetch and manage tenant customization settings
 * This hook will fetch customization from the tenant's settings
 */
export function useTenantCustomization(tenantId?: string) {
  const [customization, setCustomization] = useState<TenantCustomization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) {
      setCustomization(mergeCustomization())
      setLoading(false)
      return
    }

    const fetchCustomization = async () => {
      try {
        setLoading(true)
        console.log('[useTenantCustomization] Fetching customization for tenant:', tenantId)
        
        // Try public endpoint first, fallback to regular endpoint
        const response = await fetch(`/api/tenants/${tenantId}/customization/public`).catch(() => 
          fetch(`/api/tenants/${tenantId}/customization`)
        )
        
        console.log('[useTenantCustomization] Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch customization: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[useTenantCustomization] Received data:', {
          hasCustomization: !!data.customization,
          customizationKeys: data.customization ? Object.keys(data.customization) : [],
          hasBackground: !!data.customization?.background,
          backgroundType: data.customization?.background?.type,
        })
        
        const merged = mergeCustomization(data.customization)
        console.log('[useTenantCustomization] Merged customization:', {
          hasBackground: !!merged?.background,
          backgroundType: merged?.background?.type,
        })
        
        setCustomization(merged)
        setError(null)
      } catch (err) {
        console.error('[useTenantCustomization] Error fetching tenant customization:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Fallback to default customization
        const defaultCustomization = mergeCustomization()
        console.log('[useTenantCustomization] Using default customization:', {
          hasBackground: !!defaultCustomization?.background,
          backgroundType: defaultCustomization?.background?.type,
        })
        setCustomization(defaultCustomization)
      } finally {
        setLoading(false)
      }
    }

    void fetchCustomization()
  }, [tenantId])

  return { customization, loading, error }
}

/**
 * Hook to apply customization as CSS variables
 * This is useful for applying theme colors throughout the app
 */
export function useCustomizationStyles(customization: TenantCustomization | null) {
  useEffect(() => {
    if (!customization) return

    const root = document.documentElement

    // Apply button colors
    root.style.setProperty('--tenant-primary-button-bg', customization.primaryButton.background)
    root.style.setProperty('--tenant-primary-button-hover', customization.primaryButton.hover)
    root.style.setProperty('--tenant-primary-button-text', customization.primaryButton.text)

    // Apply OTP colors
    root.style.setProperty('--tenant-otp-border', customization.otpForm.inputBorder)
    root.style.setProperty('--tenant-otp-border-focus', customization.otpForm.inputBorderFocus)
    root.style.setProperty('--tenant-otp-bg', customization.otpForm.inputBackground)
    root.style.setProperty('--tenant-otp-bg-filled', customization.otpForm.inputBackgroundFilled)
    root.style.setProperty('--tenant-otp-text', customization.otpForm.inputText)
    root.style.setProperty('--tenant-otp-border-filled', customization.otpForm.inputBorderFilled || customization.otpForm.inputBorderFocus)

    // Apply input field colors
    root.style.setProperty('--tenant-input-bg', customization.inputFields.background)
    root.style.setProperty('--tenant-input-border', customization.inputFields.border)
    root.style.setProperty('--tenant-input-border-focus', customization.inputFields.borderFocus)
    root.style.setProperty('--tenant-input-text', customization.inputFields.text)
    root.style.setProperty('--tenant-input-placeholder', customization.inputFields.placeholder)

    // Apply text colors
    if (customization.textColors) {
      root.style.setProperty('--tenant-text-heading', customization.textColors.heading || '#111827')
      root.style.setProperty('--tenant-text-description', customization.textColors.description || '#4b5563')
      root.style.setProperty('--tenant-text-label', customization.textColors.label || '#111827')
      root.style.setProperty('--tenant-text-error', customization.textColors.error || '#111827')
    }

    // Apply container colors
    if (customization.formContainer) {
      root.style.setProperty('--tenant-container-bg', customization.formContainer.background || '#ffffff')
      root.style.setProperty('--tenant-container-border', customization.formContainer.border || 'rgba(255, 255, 255, 0.2)')
    }

    return () => {
      // Cleanup CSS variables on unmount
      root.style.removeProperty('--tenant-primary-button-bg')
      root.style.removeProperty('--tenant-primary-button-hover')
      root.style.removeProperty('--tenant-primary-button-text')
      root.style.removeProperty('--tenant-otp-border')
      root.style.removeProperty('--tenant-otp-border-focus')
      root.style.removeProperty('--tenant-otp-bg')
      root.style.removeProperty('--tenant-otp-bg-filled')
      root.style.removeProperty('--tenant-otp-text')
      root.style.removeProperty('--tenant-otp-border-filled')
      root.style.removeProperty('--tenant-input-bg')
      root.style.removeProperty('--tenant-input-border')
      root.style.removeProperty('--tenant-input-border-focus')
      root.style.removeProperty('--tenant-input-text')
      root.style.removeProperty('--tenant-input-placeholder')
      root.style.removeProperty('--tenant-text-heading')
      root.style.removeProperty('--tenant-text-description')
      root.style.removeProperty('--tenant-text-label')
      root.style.removeProperty('--tenant-text-error')
      root.style.removeProperty('--tenant-container-bg')
      root.style.removeProperty('--tenant-container-border')
    }
  }, [customization])
}

