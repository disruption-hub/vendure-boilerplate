'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getLyraSettings,
  getPaymentLinks,
  getPaymentProducts,
  type LyraSettings,
  type LyraCredentialSettings,
  type LyraModeSettings,
  type AdminPaymentLinkStatus,
  type PaymentLinkRecord,
  type PaymentProduct,
  updateLyraSettings,
  createPaymentLinkApi,
  updatePaymentLinkStatusApi,
  deletePaymentLinkApi,
} from '@/features/admin/api/admin-api'
import { Button } from '@/components/ui/button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { MoreHorizontal } from 'lucide-react'
import { roundedCurrency } from '@/lib/utils/currency'
import { createDefaultLyraPaymentConfig } from '@/lib/constants/lyra-defaults'
import { toast } from '@/stores'

interface LinkFormState {
  productId: string
  productName: string
  amountOverride: string
  expiresInMinutes: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCountryCode: string
}

const emptyLinkForm: LinkFormState = {
  productId: '',
  productName: '',
  amountOverride: '',
  expiresInMinutes: '1440', // 1 day (24 hours * 60 minutes)
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerCountryCode: '+34', // Default to Spain
}

const paymentLinkStatusOptions: Array<{ value: AdminPaymentLinkStatus | 'all'; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All statuses' },
]

const paymentLinkStatusOrder: AdminPaymentLinkStatus[] = ['pending', 'processing', 'completed', 'failed', 'expired', 'cancelled']

const cloneCredentials = (credentials: LyraCredentialSettings | null | undefined): LyraCredentialSettings | null => {
  if (!credentials) {
    return null
  }

  const cloned: LyraCredentialSettings = {
    apiUser: credentials.apiUser,
    apiPassword: credentials.apiPassword,
    publicKey: credentials.publicKey,
    hmacKey: credentials.hmacKey,
  }

  if (credentials.apiBaseUrl) {
    cloned.apiBaseUrl = credentials.apiBaseUrl
  }

  if (credentials.scriptBaseUrl) {
    cloned.scriptBaseUrl = credentials.scriptBaseUrl
  }

  return cloned
}

const cloneModeSettings = (mode: LyraModeSettings): LyraModeSettings => ({
  enabled: mode.enabled,
  credentials: cloneCredentials(mode.credentials),
})

const createEmptyCredentials = (): LyraCredentialSettings => ({
  apiUser: '',
  apiPassword: '',
  publicKey: '',
  hmacKey: '',
})

const buildDefaultLyraSettings = (): LyraSettings => {
  const defaults = createDefaultLyraPaymentConfig()
  return {
    ...defaults,
    activeMode: defaults.activeMode || 'test',
    testMode: cloneModeSettings(defaults.testMode),
    productionMode: cloneModeSettings(defaults.productionMode),
    paymentMethods: defaults.paymentMethods ? [...defaults.paymentMethods] : undefined,
  }
}

const mergeModeSettings = (
  base: LyraModeSettings,
  incoming?: LyraModeSettings,
  modeLabel?: 'test' | 'production'
): LyraModeSettings => {
  if (!incoming) {
    return cloneModeSettings(base)
  }

  // Debug logging
  if (modeLabel === 'production') {
    console.log('[mergeModeSettings] Processing PRODUCTION mode:', {
      incomingEnabled: incoming.enabled,
      incomingCredentials: incoming.credentials ? 'present' : 'missing',
      incomingCredentialsKeys: incoming.credentials ? Object.keys(incoming.credentials) : [],
      incomingCredentialsValues: incoming.credentials ? {
        hasApiUser: !!incoming.credentials.apiUser,
        hasApiPassword: !!incoming.credentials.apiPassword,
        hasPublicKey: !!incoming.credentials.publicKey,
        hasHmacKey: !!incoming.credentials.hmacKey,
      } : null,
      baseCredentials: base.credentials ? 'present' : 'missing',
    })
  }

  const clonedIncoming = incoming.credentials === null ? null : cloneCredentials(incoming.credentials)
  const clonedBase = cloneCredentials(base.credentials)

  if (modeLabel === 'production') {
    console.log('[mergeModeSettings] After cloning PRODUCTION:', {
      clonedIncoming: clonedIncoming ? {
        hasApiUser: !!clonedIncoming.apiUser,
        hasApiPassword: !!clonedIncoming.apiPassword,
        hasPublicKey: !!clonedIncoming.publicKey,
        hasHmacKey: !!clonedIncoming.hmacKey,
      } : 'null',
      clonedBase: clonedBase ? {
        hasApiUser: !!clonedBase.apiUser,
        hasApiPassword: !!clonedBase.apiPassword,
        hasPublicKey: !!clonedBase.publicKey,
        hasHmacKey: !!clonedBase.hmacKey,
      } : 'null',
      finalCredentials: clonedIncoming ?? clonedBase ? 'present' : 'null',
    })
  }

  // CRITICAL FIX: If incoming has credentials (even if empty), use them
  // Only fall back to base if incoming has no credentials at all
  const finalCredentials = incoming.credentials !== undefined && incoming.credentials !== null
    ? clonedIncoming
    : (clonedIncoming ?? clonedBase)

  return {
    enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : base.enabled,
    credentials: finalCredentials,
  }
}

const mergeLyraSettings = (defaults: LyraSettings, overrides?: LyraSettings | null): LyraSettings => {
  if (!overrides) {
    return {
      ...defaults,
      testMode: cloneModeSettings(defaults.testMode),
      productionMode: cloneModeSettings(defaults.productionMode),
      paymentMethods: defaults.paymentMethods ? [...defaults.paymentMethods] : undefined,
    }
  }

  console.log('[mergeLyraSettings] Overrides production mode:', {
    enabled: overrides.productionMode?.enabled,
    hasCredentials: !!overrides.productionMode?.credentials,
    credentialsKeys: overrides.productionMode?.credentials ? Object.keys(overrides.productionMode.credentials) : [],
  })
  console.log('[mergeLyraSettings] Overrides test mode:', {
    enabled: overrides.testMode?.enabled,
    hasCredentials: !!overrides.testMode?.credentials,
    credentialsKeys: overrides.testMode?.credentials ? Object.keys(overrides.testMode.credentials) : [],
  })

  const merged = {
    ...defaults,
    ...overrides,
    testMode: mergeModeSettings(defaults.testMode, overrides.testMode, 'test'),
    productionMode: mergeModeSettings(defaults.productionMode, overrides.productionMode, 'production'),
    paymentMethods: Array.isArray(overrides.paymentMethods)
      ? [...overrides.paymentMethods]
      : defaults.paymentMethods
        ? [...defaults.paymentMethods]
        : undefined,
  }

  const successRedirectUrl =
    typeof overrides.successRedirectUrl === 'string' && overrides.successRedirectUrl.trim()
      ? overrides.successRedirectUrl.trim()
      : defaults.successRedirectUrl

  const failureRedirectUrl =
    typeof overrides.failureRedirectUrl === 'string' && overrides.failureRedirectUrl.trim()
      ? overrides.failureRedirectUrl.trim()
      : defaults.failureRedirectUrl

  return {
    ...merged,
    successRedirectUrl,
    failureRedirectUrl,
  }
}

function deriveBaseAndTaxFromTotal(totalCents: number, rateBps: number) {
  if (!rateBps) {
    return {
      baseCents: totalCents,
      taxCents: 0,
    }
  }

  const denominator = 10_000 + rateBps
  const baseCents = Math.round((totalCents * 10_000) / denominator)
  const taxCents = Math.max(totalCents - baseCents, 0)
  return {
    baseCents,
    taxCents,
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '—'
  }
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

interface PaymentManagementSectionProps {
  tenantId?: string
}

export function PaymentManagementSection({ tenantId }: PaymentManagementSectionProps) {
  const [lyraForm, setLyraForm] = useState<LyraSettings>(() => buildDefaultLyraSettings())
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [secretVisibility, setSecretVisibility] = useState({
    test: { apiPassword: false, hmacKey: false },
    production: { apiPassword: false, hmacKey: false },
  })
  const [paymentMethodsInput, setPaymentMethodsInput] = useState('')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productError, setProductError] = useState<string | null>(null)

  const [links, setLinks] = useState<PaymentLinkRecord[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [ipnMessage, setIpnMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [lastCreatedLink, setLastCreatedLink] = useState<PaymentLinkRecord | null>(null)
  const [linkForm, setLinkForm] = useState<LinkFormState>({ ...emptyLinkForm })
  const [creatingLink, setCreatingLink] = useState(false)
  const [linkStatusFilter, setLinkStatusFilter] = useState<AdminPaymentLinkStatus | 'all'>('pending')
  const [updatingLinkIds, setUpdatingLinkIds] = useState<Record<string, boolean>>({})
  const [deletingLinkIds, setDeletingLinkIds] = useState<Record<string, boolean>>({})
  const [appOrigin, setAppOrigin] = useState('')
  const [isCustomLink, setIsCustomLink] = useState(false)

  const loadSettings = useCallback(async () => {
    const defaults = buildDefaultLyraSettings()
    try {
      setLoadingSettings(true)
      setSettingsMessage(null)

      let config: LyraSettings | null = null

      // If tenantId provided, load from tenant settings instead of global
      if (tenantId) {
        console.log('[PaymentManagementSection] Loading Lyra settings for tenant:', tenantId)
        const { getTenant } = await import('@/features/admin/api/admin-api')
        const tenant = await getTenant(tenantId)
        const settings = tenant.settings as any
        config = settings?.lyraConfig || null
        console.log('[PaymentManagementSection] Loaded tenant Lyra config:', {
          hasTenantConfig: !!config,
          activeMode: config?.activeMode,
          hasTestMode: !!config?.testMode,
          hasProductionMode: !!config?.productionMode,
        })
      } else {
        console.log('[PaymentManagementSection] Loading global Lyra settings')
        const response = await getLyraSettings()
        config = response.config
      }

      console.log('[PaymentManagementSection] Lyra settings config:', config)
      if (config) {
        console.log('[PaymentManagementSection] Production mode enabled:', config.productionMode?.enabled)
        console.log('[PaymentManagementSection] Production mode credentials:', config.productionMode?.credentials ? 'present' : 'missing')
        if (config.productionMode?.credentials) {
          console.log('[PaymentManagementSection] Production credentials keys:', Object.keys(config.productionMode.credentials))
        }
      }
      const merged = mergeLyraSettings(defaults, config ?? null)
      console.log('[PaymentManagementSection] Merged settings:', merged)
      console.log('[PaymentManagementSection] Merged production mode:', merged.productionMode)
      console.log('[PaymentManagementSection] Merged production credentials:', merged.productionMode.credentials ? {
        hasApiUser: !!merged.productionMode.credentials.apiUser,
        hasApiPassword: !!merged.productionMode.credentials.apiPassword,
        hasPublicKey: !!merged.productionMode.credentials.publicKey,
        hasHmacKey: !!merged.productionMode.credentials.hmacKey,
        keys: Object.keys(merged.productionMode.credentials),
      } : 'null')
      console.log('[PaymentManagementSection] Merged test mode:', merged.testMode)
      console.log('[PaymentManagementSection] Merged test credentials:', merged.testMode.credentials ? {
        hasApiUser: !!merged.testMode.credentials.apiUser,
        hasApiPassword: !!merged.testMode.credentials.apiPassword,
        hasPublicKey: !!merged.testMode.credentials.publicKey,
        hasHmacKey: !!merged.testMode.credentials.hmacKey,
        keys: Object.keys(merged.testMode.credentials),
      } : 'null')
      setLyraForm(merged)
      setPaymentMethodsInput(merged.paymentMethods?.join(', ') ?? '')
      setSecretVisibility({
        test: { apiPassword: false, hmacKey: false },
        production: { apiPassword: false, hmacKey: false },
      })
      setSettingsLoaded(true)
    } catch (error) {
      console.error('Failed to load Lyra settings', error)
      setSettingsMessage({ type: 'error', text: 'Unable to load Lyra payment settings.' })
      const fallback = buildDefaultLyraSettings()
      setLyraForm(fallback)
      setPaymentMethodsInput(fallback.paymentMethods?.join(', ') ?? '')
      setSettingsLoaded(true)
    } finally {
      setLoadingSettings(false)
    }
  }, [tenantId])

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      setProductError(null)
      const response = await getPaymentProducts()
      setProducts(response.products)
      setLinkForm(prev => {
        if (prev.productId && response.products.some(product => product.id === prev.productId)) {
          return prev
        }
        const nextProductId = response.products[0]?.id ?? ''
        if (prev.productId === nextProductId) {
          return prev
        }
        return { ...prev, productId: nextProductId }
      })
    } catch (error) {
      console.error('Failed to load payment products', error)
      setProductError('Unable to load payment products.')
      setProducts([])
      setLinkForm(prev => ({ ...prev, productId: '' }))
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  const loadLinks = useCallback(async (options?: { preserveSorting?: boolean }) => {
    try {
      setLoadingLinks(true)
      const response = await getPaymentLinks({ status: linkStatusFilter, limit: 50 })
      setLinks(prev => {
        if (options?.preserveSorting) {
          const preserved = new Map(prev.map(link => [link.id, link]))
          const merged = response.links.map(link => preserved.get(link.id) ?? link)
          const missing = prev.filter(link => !merged.some(item => item.id === link.id))
          return [...merged, ...missing]
        }
        return response.links
      })
      setLastCreatedLink(prev => {
        if (!prev) {
          return prev
        }
        const updated = response.links.find(link => link.id === prev.id)
        return updated ?? prev
      })
    } catch (error) {
      console.error('Failed to load payment links', error)
      setLinkMessage({ type: 'error', text: 'Unable to load payment links.' })
      setLinks([])
    } finally {
      setLoadingLinks(false)
    }
  }, [linkStatusFilter])

  useEffect(() => {
    void loadSettings()
    void loadProducts()
  }, [loadProducts, loadSettings])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use the current hostname to build tenant-specific URLs
      // This ensures each tenant gets their own subdomain-based webhook URLs
      const hostname = window.location.hostname
      const protocol = window.location.protocol
      setAppOrigin(`${protocol}//${hostname}`)
    }
  }, [])

  const updateGeneralField = (field: 'language' | 'successRedirectUrl' | 'failureRedirectUrl' | 'theme', value: string) => {
    setLyraForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const updatePaymentMethods = (value: string) => {
    setPaymentMethodsInput(value)
    const parsed = value
      .split(',')
      .map(method => method.trim().toUpperCase())
      .filter(Boolean)
    setLyraForm(prev => ({
      ...prev,
      paymentMethods: parsed.length ? parsed : undefined,
    }))
  }

  const updateModeEnabled = (mode: 'testMode' | 'productionMode', enabled: boolean) => {
    setLyraForm(prev => {
      const current = prev[mode]
      return {
        ...prev,
        [mode]: {
          ...current,
          enabled,
          credentials: enabled ? current.credentials ?? createEmptyCredentials() : current.credentials,
        },
      }
    })
  }

  const updateModeCredential = (
    mode: 'testMode' | 'productionMode',
    field: keyof LyraCredentialSettings,
    value: string,
  ) => {
    setLyraForm(prev => {
      const current = prev[mode]
      const credentials = current.credentials ? { ...current.credentials } : createEmptyCredentials()
      credentials[field] = value

      // Auto-extract API User from Public Key if updating Public Key
      // Lyra Public Key format is typically: USERNAME:PUBLIC_KEY
      if (field === 'publicKey' && value.includes(':')) {
        const [extractedUser] = value.split(':')
        // Only auto-update if it looks like a numeric ID (standard for Lyra)
        if (extractedUser && /^\d+$/.test(extractedUser)) {
          credentials.apiUser = extractedUser
        }
      }

      return {
        ...prev,
        [mode]: {
          ...current,
          credentials,
        },
      }
    })
  }

  const updateActiveMode = (value: 'test' | 'production') => {
    setLyraForm(prev => {
      if (value === 'production' && (!prev.productionMode.enabled || !prev.productionMode.credentials)) {
        toast.error('Cannot switch to Production', 'Production mode must be enabled with complete credentials first.')
        return prev
      }
      if (value === 'test' && (!prev.testMode.enabled || !prev.testMode.credentials)) {
        toast.error('Cannot switch to Test', 'Test mode must be enabled with complete credentials first.')
        return prev
      }

      // Only show toast if actually changing
      if (prev.activeMode !== value) {
        const modeLabel = value === 'test' ? 'Test / Sandbox' : 'Production / Live'
        toast.info('Mode changed', `Active environment changed to ${modeLabel}. Remember to save your settings.`)
      }

      // Mutually exclusive: when one mode is activated, the other is deactivated
      return {
        ...prev,
        activeMode: value,
        testMode: {
          ...prev.testMode,
          enabled: value === 'test',
        },
        productionMode: {
          ...prev.productionMode,
          enabled: value === 'production',
        },
      }
    })
  }

  const toggleSecretVisibility = (mode: 'test' | 'production', field: 'apiPassword' | 'hmacKey') => {
    setSecretVisibility(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [field]: !prev[mode][field],
      },
    }))
  }

  const handleLyraSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSavingSettings(true)
      setSettingsMessage(null)
      const requiredModes: Array<{ key: 'testMode' | 'productionMode'; label: string }> = [
        { key: 'testMode', label: 'Test mode' },
        { key: 'productionMode', label: 'Production mode' },
      ]

      for (const { key, label } of requiredModes) {
        const modeConfig = lyraForm[key]
        if (!modeConfig.enabled) {
          continue
        }

        const credentials = modeConfig.credentials
        if (!credentials) {
          setSettingsMessage({ type: 'error', text: `${label}: provide all required credentials before enabling.` })
          return
        }

        const requiredCredentialFields: Array<keyof Pick<LyraCredentialSettings, 'apiUser' | 'apiPassword' | 'publicKey' | 'hmacKey'>> = [
          'apiUser',
          'apiPassword',
          'publicKey',
          'hmacKey',
        ]

        const missing = requiredCredentialFields.find(field => {
          const value = credentials[field]
          return typeof value !== 'string' || !value.trim()
        })

        if (missing) {
          setSettingsMessage({
            type: 'error',
            text: `${label}: ${missing.replace('api', 'API ')} is required when enabled.`,
          })
          return
        }
      }

      const sanitizeCredentials = (mode: LyraModeSettings): LyraModeSettings => {
        if (!mode.credentials) {
          return {
            enabled: Boolean(mode.enabled),
            credentials: null,
          }
        }

        const trimmed: LyraCredentialSettings = {
          apiUser: mode.credentials.apiUser.trim(),
          apiPassword: mode.credentials.apiPassword.trim(),
          publicKey: mode.credentials.publicKey.trim(),
          hmacKey: mode.credentials.hmacKey.trim(),
        }

        if (mode.credentials.apiBaseUrl?.trim()) {
          trimmed.apiBaseUrl = mode.credentials.apiBaseUrl.trim()
        }

        if (mode.credentials.scriptBaseUrl?.trim()) {
          trimmed.scriptBaseUrl = mode.credentials.scriptBaseUrl.trim()
        }

        return {
          enabled: Boolean(mode.enabled),
          credentials: trimmed,
        }
      }

      const sanitizeUrl = (value: string | undefined): string | undefined => {
        if (!value) return undefined
        const trimmed = value.trim()
        return trimmed || undefined
      }

      const sanitizedPaymentMethods = lyraForm.paymentMethods
        ? lyraForm.paymentMethods.map(method => method.trim().toUpperCase()).filter(Boolean)
        : undefined

      const payload: LyraSettings = {
        ...lyraForm,
        testMode: sanitizeCredentials(lyraForm.testMode),
        productionMode: sanitizeCredentials(lyraForm.productionMode),
        activeMode: lyraForm.activeMode === 'production' ? 'production' : 'test',
        language: lyraForm.language?.trim() || undefined,
        successRedirectUrl: sanitizeUrl(lyraForm.successRedirectUrl),
        failureRedirectUrl: sanitizeUrl(lyraForm.failureRedirectUrl),
        paymentMethods: sanitizedPaymentMethods && sanitizedPaymentMethods.length ? sanitizedPaymentMethods : undefined,
        theme: lyraForm.theme === 'classic' ? 'classic' : 'neon',
      }

      if (payload.activeMode === 'production' && (!payload.productionMode.enabled || !payload.productionMode.credentials)) {
        setSettingsMessage({
          type: 'error',
          text: 'Enable production mode with complete credentials before setting it as active.',
        })
        return
      }

      if (payload.activeMode === 'test' && (!payload.testMode.enabled || !payload.testMode.credentials)) {
        setSettingsMessage({
          type: 'error',
          text: 'Enable test mode with complete credentials before setting it as active.',
        })
        return
      }

      let saved: LyraSettings

      // If tenantId provided, update tenant settings instead of global
      if (tenantId) {
        console.log('[PaymentManagementSection] Updating tenant Lyra config:', { tenantId, payload })
        const { getTenant, updateTenant } = await import('@/features/admin/api/admin-api')
        const tenant = await getTenant(tenantId)
        const currentSettings = (tenant.settings as any) || {}

        await updateTenant(tenantId, {
          settings: {
            ...currentSettings,
            lyraConfig: payload,
          },
        })
        saved = payload
        console.log('[PaymentManagementSection] Tenant Lyra config updated successfully')
      } else {
        console.log('[PaymentManagementSection] Updating global Lyra settings')
        saved = await updateLyraSettings(payload)
      }

      const normalized = mergeLyraSettings(buildDefaultLyraSettings(), saved)
      setLyraForm(normalized)
      setPaymentMethodsInput(normalized.paymentMethods?.join(', ') ?? '')
      setSecretVisibility({
        test: { apiPassword: false, hmacKey: false },
        production: { apiPassword: false, hmacKey: false },
      })
      const modeLabel = saved.activeMode === 'test' ? 'Test / Sandbox' : 'Production / Live'
      const settingsType = tenantId ? 'Tenant-specific' : 'Global'
      setSettingsMessage({ type: 'success', text: `${settingsType} Lyra payment settings updated successfully. Active mode: ${modeLabel}.` })
      toast.success('Settings saved', `${settingsType} Lyra payment settings saved successfully. Active environment: ${modeLabel}.`)
    } catch (error) {
      console.error('Failed to save Lyra settings', error)
      const errorMessage = error instanceof Error ? error.message : 'Unable to update Lyra payment settings.'
      setSettingsMessage({ type: 'error', text: errorMessage })
      toast.error('Save failed', errorMessage)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveMode = async (mode: 'testMode' | 'productionMode') => {
    try {
      setSavingSettings(true)
      setSettingsMessage(null)

      const modeConfig = lyraForm[mode]
      const modeLabel = mode === 'testMode' ? 'Test' : 'Production'

      if (modeConfig.enabled) {
        const credentials = modeConfig.credentials
        if (!credentials) {
          toast.error(`${modeLabel} mode save failed`, 'Provide all required credentials before enabling.')
          return
        }

        const requiredCredentialFields: Array<keyof Pick<LyraCredentialSettings, 'apiUser' | 'apiPassword' | 'publicKey' | 'hmacKey'>> = [
          'apiUser',
          'apiPassword',
          'publicKey',
          'hmacKey',
        ]

        const missing = requiredCredentialFields.find(field => {
          const value = credentials[field]
          return typeof value !== 'string' || !value.trim()
        })

        if (missing) {
          toast.error(`${modeLabel} mode save failed`, `${missing.replace('api', 'API ')} is required when enabled.`)
          return
        }
      }

      const sanitizeCredentials = (modeConfig: LyraModeSettings): LyraModeSettings => {
        if (!modeConfig.credentials) {
          return {
            enabled: Boolean(modeConfig.enabled),
            credentials: null,
          }
        }

        return {
          enabled: Boolean(modeConfig.enabled),
          credentials: {
            apiUser: (modeConfig.credentials.apiUser || '').trim(),
            apiPassword: (modeConfig.credentials.apiPassword || '').trim(),
            publicKey: (modeConfig.credentials.publicKey || '').trim(),
            hmacKey: (modeConfig.credentials.hmacKey || '').trim(),
            apiBaseUrl: modeConfig.credentials.apiBaseUrl?.trim() || undefined,
            scriptBaseUrl: modeConfig.credentials.scriptBaseUrl?.trim() || undefined,
          },
        }
      }

      // Save only the specific mode, preserving the other mode
      const payload: LyraSettings = {
        ...lyraForm,
        [mode]: sanitizeCredentials(modeConfig),
      }

      let saved: LyraSettings

      // If tenantId provided, update tenant settings instead of global
      if (tenantId) {
        console.log('[PaymentManagementSection] Updating tenant mode config:', { tenantId, mode, modeLabel })
        const { getTenant, updateTenant } = await import('@/features/admin/api/admin-api')
        const tenant = await getTenant(tenantId)
        const currentSettings = (tenant.settings as any) || {}
        const currentLyraConfig = currentSettings.lyraConfig || {}

        await updateTenant(tenantId, {
          settings: {
            ...currentSettings,
            lyraConfig: {
              ...currentLyraConfig,
              ...payload,
            },
          },
        })
        saved = payload
        console.log('[PaymentManagementSection] Tenant mode config updated successfully')
      } else {
        console.log('[PaymentManagementSection] Updating global mode config')
        saved = await updateLyraSettings(payload)
      }

      const normalized = mergeLyraSettings(buildDefaultLyraSettings(), saved)
      setLyraForm(normalized)
      setPaymentMethodsInput(normalized.paymentMethods?.join(', ') ?? '')
      const settingsType = tenantId ? 'Tenant-specific' : 'Global'
      toast.success(`${modeLabel} mode saved`, `${settingsType} ${modeLabel} credentials saved successfully.`)
    } catch (error) {
      console.error(`Failed to save ${mode} settings`, error)
      const errorMessage = error instanceof Error ? error.message : `Unable to save ${mode} settings.`
      toast.error('Save failed', errorMessage)
    } finally {
      setSavingSettings(false)
    }
  }

  const resetLinkForm = () => {
    setLinkForm(prev => ({ ...emptyLinkForm, productId: prev.productId }))
    setLinkMessage(null)
  }

  const handleLinkFieldChange = (field: keyof LinkFormState, value: string) => {
    setLinkForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!linkForm.productId) {
      setLinkMessage({ type: 'error', text: 'Select a product to generate a payment link.' })
      return
    }

    if (isCustomLink && (!linkForm.productName || !linkForm.amountOverride)) {
      setLinkMessage({ type: 'error', text: 'Product name and amount are required for custom links.' })
      return
    }

    let amountCents: number | undefined
    if (linkForm.amountOverride.trim()) {
      const amount = parseFloat(linkForm.amountOverride)
      if (isNaN(amount) || amount <= 0) {
        setLinkMessage({ type: 'error', text: 'Invalid amount.' })
        return
      }
      amountCents = Math.round(amount * 100)
    }

    let expiresInMinutes: number | undefined
    if (linkForm.expiresInMinutes.trim()) {
      const parsedMinutes = Number.parseInt(linkForm.expiresInMinutes, 10)
      if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
        setLinkMessage({ type: 'error', text: 'Expiration minutes must be a positive number.' })
        return
      }
      expiresInMinutes = parsedMinutes
    }

    try {
      setCreatingLink(true)
      setLinkMessage(null)

      const payload: any = {
        productId: isCustomLink ? undefined : linkForm.productId,
        productName: isCustomLink ? linkForm.productName : undefined,
        amountCents,
        expiresInMinutes,
        customerName: linkForm.customerName || undefined,
        customerEmail: linkForm.customerEmail || undefined,
        customerPhone: linkForm.customerPhone || undefined,
        customerCountryCode: linkForm.customerCountryCode || undefined,
        tenantId, // Explicitly pass tenantId for manual creation
      }

      // Remove undefined fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

      const created = await createPaymentLinkApi(payload)
      setLastCreatedLink(created)
      setLinks(prev => [created, ...prev.filter(link => link.id !== created.id)])
      setLinkMessage({ type: 'success', text: 'Payment link created successfully.' })
      setLinkForm(prev => ({ ...emptyLinkForm, productId: isCustomLink ? '' : prev.productId })) // Keep product selected if not custom
      void loadLinks()
    } catch (error) {
      console.error('Failed to create payment link', error)
      setLinkMessage({ type: 'error', text: 'Unable to create payment link.' })
    } finally {
      setCreatingLink(false)
    }
  }

  const handleRefreshLinks = () => {
    void loadLinks({ preserveSorting: true })
  }

  const handleUpdateLinkStatus = async (linkId: string, status: AdminPaymentLinkStatus) => {
    const current = links.find(link => link.id === linkId)
    if (current?.status === status) {
      setLinkMessage({ type: 'success', text: 'Payment link status already up to date.' })
      return
    }
    setUpdatingLinkIds(prev => ({ ...prev, [linkId]: true }))
    try {
      const updated = await updatePaymentLinkStatusApi(linkId, status)
      setLinks(prev => prev.map(link => (link.id === updated.id ? updated : link)))
      setLinkMessage({ type: 'success', text: 'Payment link updated successfully.' })
    } catch (error) {
      console.error('Failed to update payment link status', error)
      setLinkMessage({ type: 'error', text: 'Unable to update payment link status.' })
    } finally {
      setUpdatingLinkIds(prev => {
        const next = { ...prev }
        delete next[linkId]
        return next
      })
    }
  }

  const handleCopyLink = async (token: string) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/pay/${token}`
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        throw new Error('Clipboard API not available')
      }
      setLinkMessage({ type: 'success', text: 'Payment link copied to clipboard.' })
    } catch (error) {
      console.error('Failed to copy payment link', error)
      setLinkMessage({ type: 'error', text: 'Unable to copy payment link. Copy manually from the list.' })
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this payment link? This cannot be undone.')
    if (!confirmed) {
      return
    }

    setDeletingLinkIds(prev => ({ ...prev, [linkId]: true }))
    setLinkMessage(null)

    try {
      await deletePaymentLinkApi(linkId)
      setLinks(prev => prev.filter(link => link.id !== linkId))
      setLastCreatedLink(prev => (prev?.id === linkId ? null : prev))
      setLinkMessage({ type: 'success', text: 'Payment link deleted successfully.' })
    } catch (error) {
      console.error('Failed to delete payment link', error)
      setLinkMessage({ type: 'error', text: 'Unable to delete payment link.' })
    } finally {
      setDeletingLinkIds(prev => {
        const next = { ...prev }
        delete next[linkId]
        return next
      })
    }
  }

  const linkStatusLabel = (status: AdminPaymentLinkStatus) =>
    paymentLinkStatusOptions.find(option => option.value === status)?.label ?? status

  const isLinkUpdating = (id: string) => Boolean(updatingLinkIds[id])
  const isLinkDeleting = (id: string) => Boolean(deletingLinkIds[id])

  const settingsDisabled = loadingSettings || savingSettings || !settingsLoaded

  const selectedLinkProduct = useMemo(
    () => products.find(product => product.id === linkForm.productId) ?? null,
    [products, linkForm.productId],
  )

  const ipnUrls = useMemo(() => {
    if (!appOrigin) {
      return {
        test: '',
        production: '',
        successTest: '',
        successProduction: '',
        failureTest: '',
        failureProduction: '',
      }
    }

    // Use the tenant-specific origin (e.g., https://matmax.flowcast.chat)
    // This ensures each tenant has their own webhook URLs based on their subdomain
    const base = appOrigin.replace(/\/$/, '')
    const webhookBase = `${base}/api/payments/lyra/webhook`
    // Note: browser-success and browser-failure are pages, not API routes (no /api prefix)
    const successBase = `${base}/payments/lyra/browser-success`
    const failureBase = `${base}/payments/lyra/browser-failure`

    return {
      test: `${webhookBase}?mode=test`,
      production: `${webhookBase}?mode=production`,
      successTest: `${successBase}?mode=test`,
      successProduction: `${successBase}?mode=production`,
      failureTest: `${failureBase}?mode=test`,
      failureProduction: `${failureBase}?mode=production`,
    }
  }, [appOrigin])

  const handleCopyIpnUrl = async (value: string, label: string) => {
    if (!value) {
      setIpnMessage({ type: 'error', text: `${label} URL unavailable. Reload the page and try again.` })
      return
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        setIpnMessage({ type: 'success', text: `${label} copied to clipboard.` })
      } else {
        throw new Error('Clipboard API not available')
      }
    } catch (error) {
      console.error('Failed to copy IPN URL', error)
      setIpnMessage({ type: 'error', text: `Unable to copy ${label}. Copy manually instead.` })
    }
  }

  const linkPreview = useMemo(() => {
    if (!selectedLinkProduct) {
      return {
        baseCents: 0,
        taxCents: 0,
        totalCents: 0,
        taxRateBps: 0,
      }
    }

    const taxRateBps = selectedLinkProduct.tax?.rateBps ?? 0
    const override = Number.parseFloat(linkForm.amountOverride)

    if (Number.isFinite(override) && override > 0) {
      const totalCents = Math.round(override * 100)
      const { baseCents, taxCents } = deriveBaseAndTaxFromTotal(totalCents, taxRateBps)
      return {
        baseCents,
        taxCents,
        totalCents,
        taxRateBps,
      }
    }

    return {
      baseCents: selectedLinkProduct.baseAmountCents,
      taxCents: selectedLinkProduct.taxAmountCents,
      totalCents: selectedLinkProduct.amountCents,
      taxRateBps,
    }
  }, [linkForm.amountOverride, selectedLinkProduct])

  const sortedLinks = useMemo(
    () =>
      [...links].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime(),
      ),
    [links],
  )

  const lastCreatedLinkSuccessUrl = useMemo(() => {
    if (!lastCreatedLink) {
      return null
    }
    const params = new URLSearchParams({
      token: lastCreatedLink.token,
      amount: (lastCreatedLink.amountCents / 100).toFixed(2),
      currency: lastCreatedLink.currency,
    })
    return `/payments/lyra/browser-success?${params.toString()}`
  }, [lastCreatedLink])

  const lastCreatedLinkFailureUrl = useMemo(() => {
    if (!lastCreatedLink) {
      return null
    }
    const params = new URLSearchParams({ token: lastCreatedLink.token, reason: 'failed' })
    return `/payments/lyra/browser-failure?${params.toString()}`
  }, [lastCreatedLink])

  const lastCreatedPublicUrl = useMemo(() => {
    return lastCreatedLink ? `/pay/${lastCreatedLink.token}` : null
  }, [lastCreatedLink])

  const environmentConfigs: Array<{
    key: 'testMode' | 'productionMode'
    mode: 'test' | 'production'
    title: string
    description: string
  }> = [
      {
        key: 'testMode',
        mode: 'test',
        title: 'Test / Sandbox',
        description: 'Use for integration testing with Lyra sandbox credentials before going live.',
      },
      {
        key: 'productionMode',
        mode: 'production',
        title: 'Production / Live',
        description: 'Serve real customers using live credentials once you are ready to charge.',
      },
    ]

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-black">Lyra Payment Gateway Settings</h3>
          <p className="text-sm text-black">
            Manage Lyra (IziPay) sandbox and production credentials, choose the active environment, and validate the
            embedded smart form integration.
          </p>
        </div>

        {settingsMessage && (
          <Alert variant={settingsMessage.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{settingsMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLyraSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {environmentConfigs.map(environment => {
              const config = lyraForm[environment.key]
              const visibility = secretVisibility[environment.mode]
              const idPrefix = `lyra-${environment.mode}`

              return (
                <div key={environment.mode} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-black">{environment.title}</h4>
                      <p className="text-sm text-black">{environment.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-black">
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={config.enabled}
                        disabled={settingsDisabled}
                        onCheckedChange={value => updateModeEnabled(environment.key, value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`${idPrefix}-api-user`} className="text-black">API User</Label>
                      <Input
                        id={`${idPrefix}-api-user`}
                        value={config.credentials?.apiUser ?? ''}
                        onChange={event => updateModeCredential(environment.key, 'apiUser', event.target.value)}
                        disabled={settingsDisabled}
                        className="bg-white text-black border-gray-300"
                        style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${idPrefix}-api-password`} className="text-black">API Password</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`${idPrefix}-api-password`}
                          type={visibility.apiPassword ? 'text' : 'password'}
                          value={config.credentials?.apiPassword ?? ''}
                          onChange={event => updateModeCredential(environment.key, 'apiPassword', event.target.value)}
                          disabled={settingsDisabled}
                          className="bg-white text-black border-gray-300"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={settingsDisabled}
                          onClick={() => toggleSecretVisibility(environment.mode, 'apiPassword')}
                          className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        >
                          {visibility.apiPassword ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${idPrefix}-public-key`} className="text-black">Public Key</Label>
                      <Input
                        id={`${idPrefix}-public-key`}
                        value={config.credentials?.publicKey ?? ''}
                        onChange={event => updateModeCredential(environment.key, 'publicKey', event.target.value)}
                        disabled={settingsDisabled}
                        className="bg-white text-black border-gray-300"
                        style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${idPrefix}-hmac-key`} className="text-black">HMAC Key</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`${idPrefix}-hmac-key`}
                          type={visibility.hmacKey ? 'text' : 'password'}
                          value={config.credentials?.hmacKey ?? ''}
                          onChange={event => updateModeCredential(environment.key, 'hmacKey', event.target.value)}
                          disabled={settingsDisabled}
                          className="bg-white text-black border-gray-300"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={settingsDisabled}
                          onClick={() => toggleSecretVisibility(environment.mode, 'hmacKey')}
                          className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        >
                          {visibility.hmacKey ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${idPrefix}-api-base-url`} className="text-black">API Endpoint (optional)</Label>
                      <Input
                        id={`${idPrefix}-api-base-url`}
                        placeholder="https://api.lyra.com/api-payment/V4/Charge/CreatePayment"
                        value={config.credentials?.apiBaseUrl ?? ''}
                        onChange={event => updateModeCredential(environment.key, 'apiBaseUrl', event.target.value)}
                        disabled={settingsDisabled}
                        className="bg-white text-black border-gray-300"
                        style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${idPrefix}-script-base-url`} className="text-black">Script Base URL (optional)</Label>
                      <Input
                        id={`${idPrefix}-script-base-url`}
                        placeholder="https://static.lyra.com/static/js/krypton-client/V4.0"
                        value={config.credentials?.scriptBaseUrl ?? ''}
                        onChange={event => updateModeCredential(environment.key, 'scriptBaseUrl', event.target.value)}
                        disabled={settingsDisabled}
                        className="bg-white text-black border-gray-300"
                        style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                      />
                    </div>
                  </div>

                  {!config.enabled && (
                    <p className="text-xs text-black">
                      Provide credentials and enable this environment to make it available for activation.
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSaveMode(environment.key)}
                      disabled={settingsDisabled || savingSettings}
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                      style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                    >
                      {savingSettings ? 'Saving...' : `Save ${environment.title}`}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-black font-semibold">Active Environment</Label>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${lyraForm.activeMode === 'test'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-green-100 text-green-800 border border-green-300'
                }`}>
                {lyraForm.activeMode === 'test' ? '🧪 TEST MODE ACTIVE' : '✅ PRODUCTION MODE ACTIVE'}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={lyraForm.activeMode === 'test' ? 'default' : 'outline'}
                disabled={!lyraForm.testMode.enabled || !lyraForm.testMode.credentials || settingsDisabled}
                onClick={() => updateActiveMode('test')}
                className={lyraForm.activeMode === 'test'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black'}
                style={lyraForm.activeMode === 'test'
                  ? { backgroundColor: '#d97706', borderColor: '#d97706' }
                  : { backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                🧪 Test / Sandbox
              </Button>
              <Button
                type="button"
                variant={lyraForm.activeMode === 'production' ? 'default' : 'outline'}
                disabled={!lyraForm.productionMode.enabled || !lyraForm.productionMode.credentials || settingsDisabled}
                onClick={() => updateActiveMode('production')}
                className={lyraForm.activeMode === 'production'
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black'}
                style={lyraForm.activeMode === 'production'
                  ? { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                  : { backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                ✅ Production / Live
              </Button>
            </div>
            <div className={`p-3 rounded-md border ${lyraForm.activeMode === 'test'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
              }`}>
              <p className={`text-xs font-medium ${lyraForm.activeMode === 'test' ? 'text-amber-800' : 'text-green-800'
                }`}>
                {lyraForm.activeMode === 'test' ? (
                  <>
                    <strong>⚠️ Test Mode Active:</strong> Payment links will use test/sandbox credentials.
                    No real transactions will be processed. Perfect for testing and development.
                  </>
                ) : (
                  <>
                    <strong>✅ Production Mode Active:</strong> Payment links will use production credentials.
                    Real transactions will be processed. Use with caution.
                  </>
                )}
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Only environments with complete credentials can be activated. Active mode determines which credentials are
              used when issuing payment links. <strong>Remember to save your settings after changing the active mode.</strong>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="lyra-language" className="text-black">Form Language</Label>
              <Input
                id="lyra-language"
                placeholder="en-EN"
                value={lyraForm.language ?? ''}
                onChange={event => updateGeneralField('language', event.target.value)}
                disabled={settingsDisabled}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lyra-theme" className="text-black">Theme</Label>
              <select
                id="lyra-theme"
                className="h-10 w-full rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                value={lyraForm.theme ?? 'neon'}
                onChange={event => updateGeneralField('theme', event.target.value)}
                disabled={settingsDisabled}
              >
                <option value="neon">Neon</option>
                <option value="classic">Classic</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="lyra-payment-methods" className="text-black">Allowed Payment Methods</Label>
              <Input
                id="lyra-payment-methods"
                placeholder="CARDS, PAYPAL"
                value={paymentMethodsInput}
                onChange={event => updatePaymentMethods(event.target.value)}
                disabled={settingsDisabled}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
              <p className="text-xs text-black">
                Optional. Provide comma-separated Lyra payment method codes. Leave blank for the default set (CARDS).
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lyra-success-url" className="text-black">Browser Success Redirect</Label>
              <Input
                id="lyra-success-url"
                placeholder="https://your-app.com/payments/lyra/browser-success"
                value={lyraForm.successRedirectUrl ?? ''}
                onChange={event => updateGeneralField('successRedirectUrl', event.target.value)}
                disabled={settingsDisabled}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lyra-failure-url" className="text-black">Browser Failure Redirect</Label>
              <Input
                id="lyra-failure-url"
                placeholder="https://your-app.com/payments/lyra/browser-failure"
                value={lyraForm.failureRedirectUrl ?? ''}
                onChange={event => updateGeneralField('failureRedirectUrl', event.target.value)}
                disabled={settingsDisabled}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>
          </div>

          {ipnMessage && (
            <Alert variant={ipnMessage.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{ipnMessage.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <h4 className="text-sm font-semibold text-black">Instant Payment Notification URLs</h4>
              <p className="text-xs text-black">
                Configure these callback endpoints in Lyra so payment status updates reach FlowBot in both sandbox and live environments.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-black">Sandbox / Test</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={ipnUrls.test}
                    placeholder={appOrigin ? '' : 'Loading origin…'}
                    className="bg-white text-black border-gray-300"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopyIpnUrl(ipnUrls.test, 'Sandbox IPN URL')}
                    disabled={!ipnUrls.test}
                    className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-black">Production / Live</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={ipnUrls.production}
                    placeholder={appOrigin ? '' : 'Loading origin…'}
                    className="bg-white text-black border-gray-300"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopyIpnUrl(ipnUrls.production, 'Production IPN URL')}
                    disabled={!ipnUrls.production}
                    className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-black">
              These endpoints include the required <span className="font-mono text-[0.7rem]">mode</span> query parameter. If you override the browser success
              or failure URLs, be sure to append <span className="font-mono text-[0.7rem]">mode=test</span> or <span className="font-mono text-[0.7rem]">mode=production</span> as needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={settingsDisabled}
              variant={lyraForm.activeMode === 'test' ? 'default' : 'default'}
              className={lyraForm.activeMode === 'test'
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                : 'bg-green-600 hover:bg-green-700 text-white border-green-600'}
              style={lyraForm.activeMode === 'test'
                ? { backgroundColor: '#d97706', borderColor: '#d97706' }
                : { backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            >
              {savingSettings ? (
                'Saving…'
              ) : (
                <>
                  {lyraForm.activeMode === 'test' ? '🧪' : '✅'} Save Settings
                  {lyraForm.activeMode === 'test' ? ' (Test Mode)' : ' (Production Mode)'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadSettings()}
              disabled={loadingSettings || savingSettings}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Reload
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={settingsDisabled}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              <Link href={`/admin/payments/lyra/test?mode=${lyraForm.activeMode}`} target="_blank" rel="noreferrer">
                Open Smart Form Test
              </Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">Payment Links</h3>
                <p className="text-sm text-black">
                  Generate, monitor, and manage one-off payment links for chatbot transactions.
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${lyraForm.activeMode === 'test'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-green-100 text-green-800 border border-green-300'
                }`}>
                {lyraForm.activeMode === 'test' ? '🧪' : '✅'}
                <span>{lyraForm.activeMode === 'test' ? 'TEST MODE' : 'PRODUCTION MODE'}</span>
              </div>
            </div>
            {lyraForm.activeMode === 'test' && (
              <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">
                  ⚠️ <strong>Test Mode Active:</strong> Payment links generated will use test credentials. No real transactions will be processed.
                </p>
              </div>
            )}
          </div>
        </div>

        {productError && (
          <Alert variant="destructive">
            <AlertDescription>{productError}</AlertDescription>
          </Alert>
        )}

        {linkMessage && (
          <Alert variant={linkMessage.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{linkMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLinkSubmit} className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="col-span-2 flex items-center space-x-2 pb-2">
              <Switch
                id="custom-link-mode"
                checked={isCustomLink}
                onCheckedChange={setIsCustomLink}
              />
              <Label htmlFor="custom-link-mode" className="text-black">Custom Product Link</Label>
            </div>

            <div className="space-y-2">
              {isCustomLink ? (
                <>
                  <Label htmlFor="link-product-name" className="text-black">Product Name</Label>
                  <Input
                    id="link-product-name"
                    value={linkForm.productName}
                    onChange={event => handleLinkFieldChange('productName', event.target.value)}
                    placeholder="e.g. Custom Service"
                    className="bg-white text-black border-gray-300"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                    disabled={creatingLink}
                    required
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="link-product" className="text-black">Product</Label>
                  <select
                    id="link-product"
                    value={linkForm.productId}
                    onChange={event => handleLinkFieldChange('productId', event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                    disabled={creatingLink || loadingProducts || products.length === 0}
                    required
                  >
                    <option value="">
                      {loadingProducts ? 'Loading products...' : 'Select a product'}
                    </option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} • {product.currency} {roundedCurrency(product.amountCents)}
                      </option>
                    ))}
                  </select>
                  {products.length === 0 && !loadingProducts && (
                    <p className="text-xs text-destructive">
                      Create a payment product in the Payment Catalog tab first.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-amount" className="text-black">
                {isCustomLink ? 'Amount (Required)' : 'Override Amount (optional)'}
              </Label>
              <Input
                id="link-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 125.00"
                value={linkForm.amountOverride}
                onChange={event => handleLinkFieldChange('amountOverride', event.target.value)}
                disabled={creatingLink || (!isCustomLink && !selectedLinkProduct)}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                required={isCustomLink}
              />
              {!isCustomLink && (
                <p className="text-xs text-black">
                  Leave empty to use the product total (
                  {selectedLinkProduct
                    ? `${selectedLinkProduct.currency} ${roundedCurrency(selectedLinkProduct.amountCents)}`
                    : '—'}
                  ).
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="link-expires" className="text-black">Expires In (minutes)</Label>
              <Input
                id="link-expires"
                type="number"
                min="1"
                step="1"
                value={linkForm.expiresInMinutes}
                onChange={event => handleLinkFieldChange('expiresInMinutes', event.target.value)}
                disabled={creatingLink}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
              <p className="text-xs text-black">Defaults to 60 minutes if left blank.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-black">Estimated Charge Preview</Label>
              <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-4 text-sm">
                <div className="flex items-center justify-between text-black">
                  <span>Subtotal</span>
                  <span>
                    {selectedLinkProduct?.currency ?? 'USD'} {roundedCurrency(linkPreview.baseCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-black">
                  <span>
                    Tax {linkPreview.taxRateBps ? `${(linkPreview.taxRateBps / 100).toFixed(2)}%` : '0%'}
                  </span>
                  <span>
                    {selectedLinkProduct?.currency ?? 'USD'} {roundedCurrency(linkPreview.taxCents)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm font-semibold text-black">
                  <span>Total charge</span>
                  <span>
                    {selectedLinkProduct?.currency ?? 'USD'} {roundedCurrency(linkPreview.totalCents)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="link-customer-name" className="text-black">Customer Name</Label>
              <Input
                id="link-customer-name"
                value={linkForm.customerName}
                onChange={event => handleLinkFieldChange('customerName', event.target.value)}
                disabled={creatingLink}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-customer-email" className="text-black">Customer Email</Label>
              <Input
                id="link-customer-email"
                type="email"
                value={linkForm.customerEmail}
                onChange={event => handleLinkFieldChange('customerEmail', event.target.value)}
                disabled={creatingLink}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Customer Phone (WhatsApp)</Label>
              <PhoneInput
                value={linkForm.customerPhone}
                countryCode={linkForm.customerCountryCode}
                onValueChange={val => handleLinkFieldChange('customerPhone', val)}
                onCountryCodeChange={val => handleLinkFieldChange('customerCountryCode', val)}
                className="bg-white text-black border-gray-300"
              />
              <p className="text-xs text-gray-500">
                Optional. Use to send the payment link via WhatsApp after creation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={creatingLink || products.length === 0}
              variant="outline"
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              {creatingLink ? 'Generating...' : 'Generate Payment Link'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetLinkForm}
              disabled={creatingLink}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Clear
            </Button>
          </div>
        </form>

        {lastCreatedLink && (
          <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Latest payment link</p>
                <h4 className="text-lg font-semibold text-emerald-900">{lastCreatedLink.product.name}</h4>
                <p className="text-xs text-emerald-700">Token: {lastCreatedLink.token}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Charge</p>
                <p className="font-semibold">
                  {lastCreatedLink.currency} {roundedCurrency(lastCreatedLink.amountCents)}
                </p>
                <p className="text-xs text-emerald-700">Status: {linkStatusLabel(lastCreatedLink.status)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {lastCreatedPublicUrl && (
                <Button
                  variant="default"
                  asChild
                  className="bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border-transparent"
                  style={{ backgroundColor: '#059669', color: 'white' }}
                >
                  <Link href={lastCreatedPublicUrl} target="_blank" rel="noreferrer">
                    Open payment link
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopyLink(lastCreatedLink.token)}
                className="bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100"
                style={{ backgroundColor: 'white', color: '#047857', borderColor: '#6ee7b7' }}
              >
                Copy link URL
              </Button>
              {lastCreatedLinkSuccessUrl && (
                <Button
                  variant="outline"
                  asChild
                  className="bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100"
                  style={{ backgroundColor: 'white', color: '#047857', borderColor: '#6ee7b7' }}
                >
                  <Link href={lastCreatedLinkSuccessUrl} target="_blank" rel="noreferrer">
                    Preview success page
                  </Link>
                </Button>
              )}
              {lastCreatedLinkFailureUrl && (
                <Button
                  variant="outline"
                  asChild
                  className="bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100"
                  style={{ backgroundColor: 'white', color: '#047857', borderColor: '#6ee7b7' }}
                >
                  <Link href={lastCreatedLinkFailureUrl} target="_blank" rel="noreferrer">
                    Preview failure page
                  </Link>
                </Button>
              )}
            </div>

            <p className="text-xs text-emerald-700">
              Share the payment link with the customer. The hosted success and failure pages now inform them about the
              outcome using `/payments/lyra/browser-success` and `/payments/lyra/browser-failure`.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium text-black" htmlFor="link-status-filter">
              Status Filter
            </label>
            <select
              id="link-status-filter"
              value={linkStatusFilter}
              onChange={event => setLinkStatusFilter(event.target.value as AdminPaymentLinkStatus | 'all')}
              className="h-10 rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              {paymentLinkStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshLinks}
              disabled={loadingLinks}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-black">Link</th>
                <th className="px-4 py-3 text-left font-medium text-black">Charge</th>
                <th className="px-4 py-3 text-left font-medium text-black">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-black">Status</th>
                <th className="px-4 py-3 text-left font-medium text-black">Expires</th>
                <th className="px-4 py-3 text-left font-medium text-black">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingLinks ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-black">
                    Loading payment links...
                  </td>
                </tr>
              ) : sortedLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-black">
                    No payment links found for this filter.
                  </td>
                </tr>
              ) : (
                sortedLinks.map(link => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-black">{link.product.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black">Token: {link.token}</span>
                        <Link
                          href={`/pay/${link.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleCopyLink(link.token)}
                          className="text-[10px] font-medium uppercase tracking-wide text-black hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        >
                          Copy
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {link.currency} {roundedCurrency(link.amountCents)}
                      <div className="text-xs text-black">
                        Base {roundedCurrency(link.baseAmountCents)} • Tax {roundedCurrency(link.taxAmountCents)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-black">
                      {link.customerName || '—'}
                      {link.customerEmail && <div>{link.customerEmail}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-black">
                        {linkStatusLabel(link.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-black">{formatDateTime(link.expiresAt)}</td>
                    <td className="px-4 py-3 text-xs text-black">{formatDateTime(link.updatedAt ?? link.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            disabled={isLinkUpdating(link.id) || isLinkDeleting(link.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 text-slate-700">
                          <DropdownMenuItem
                            className="text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                            onSelect={event => {
                              event.preventDefault()
                              void handleCopyLink(link.token)
                            }}
                          >
                            Copy link URL
                          </DropdownMenuItem>
                          {paymentLinkStatusOrder.map(statusOption => (
                            <DropdownMenuItem
                              key={statusOption}
                              className="text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                              disabled={isLinkUpdating(link.id) || link.status === statusOption}
                              onSelect={event => {
                                event.preventDefault()
                                void handleUpdateLinkStatus(link.id, statusOption)
                              }}
                            >
                              {linkStatusLabel(statusOption)}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={isLinkDeleting(link.id)}
                            onSelect={event => {
                              event.preventDefault()
                              void handleDeleteLink(link.id)
                            }}
                          >
                            {isLinkDeleting(link.id) ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
