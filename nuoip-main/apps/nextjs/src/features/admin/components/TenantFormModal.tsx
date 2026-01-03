import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { getRootDomainSettings, type TenantPayload } from '@/features/admin/api/admin-api'
import { buildTenantDomain, sanitizeSubdomainInput } from '@/lib/utils/subdomain'
import { toast } from '@/stores'

// Helper to get auth token for FormData uploads
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed?.state?.token || null
    }
  } catch (e) {
    console.error('Failed to get auth token:', e)
  }
  return null
}

interface TenantFormModalProps {
  title: string
  confirmLabel: string
  isOpen: boolean
  tenant: TenantPayload
  onChange: (updates: Partial<TenantPayload>) => void
  onClose: () => void
  onSubmit: () => void
  isSaving?: boolean
  tenantId?: string | null
}

const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5MB

export function TenantFormModal({
  title,
  confirmLabel,
  isOpen,
  tenant,
  onChange,
  onClose,
  onSubmit,
  isSaving,
  tenantId,
}: TenantFormModalProps) {
  const [rootDomain, setRootDomain] = useState(() => (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'flowcast.chat').trim())
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const response = await getRootDomainSettings()
        if (response?.rootDomain) {
          setRootDomain(response.rootDomain)
        }
      } catch (error) {
        console.warn('Unable to load root domain configuration, using default fallback', error)
      }
    })()
  }, [])

  if (!isOpen) return null

  const subdomain = tenant.subdomain ?? ''
  const derivedDomain = subdomain ? buildTenantDomain(subdomain, rootDomain) : ''
  const domainPreview = derivedDomain || `<subdomain>.${rootDomain}`
  const colorValue = tenant.primaryColor?.trim() ?? ''
  const colorInputValue = colorValue
    ? colorValue.startsWith('#')
      ? colorValue
      : `#${colorValue}`
    : '#3b82f6'
  
  // For edit mode (when tenantId exists), subdomain is optional
  // For create mode, both name and subdomain are required
  const isEditMode = Boolean(tenantId)
  const confirmDisabled = isEditMode
    ? !tenant.name.trim() || Boolean(isSaving) || logoUploading
    : !tenant.name.trim() || !subdomain.trim() || Boolean(isSaving) || logoUploading

  const handleSubdomainChange = (value: string) => {
    const sanitized = sanitizeSubdomainInput(value)
    const nextDomain = sanitized ? buildTenantDomain(sanitized, rootDomain) : ''
    onChange({ subdomain: sanitized, domain: nextDomain })
  }

  const handleLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error('Unsupported file type', 'Please upload a PNG, JPG, WEBP, or SVG logo.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      toast.error('Logo too large', 'Please upload a logo smaller than 5MB.')
      event.target.value = ''
      return
    }

    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (tenantId) {
        formData.append('tenantId', tenantId)
      }

      const token = getAuthToken()
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/admin/tenants/logo', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Upload failed')
      }

      const result = await response.json()
      onChange({
        logoUrl: typeof result.logoUrl === 'string' ? result.logoUrl : null,
        logoWidth: typeof result.width === 'number' ? result.width : null,
        logoHeight: typeof result.height === 'number' ? result.height : null,
        logoMimeType: typeof result.mimeType === 'string' ? result.mimeType : null,
        logoBlurData: null,
      })
      toast.success('Logo uploaded', 'Tenant logo uploaded successfully.')
    } catch (error) {
      console.error('Tenant logo upload failed', error)
      toast.error('Logo upload failed', error instanceof Error ? error.message : 'Unable to upload logo')
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = () => {
    onChange({
      logoUrl: null,
      logoWidth: null,
      logoHeight: null,
      logoMimeType: null,
      logoBlurData: null,
    })
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        // Close modal when clicking overlay
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="mobile-scroll relative w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 text-black shadow-xl sm:p-6" 
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation()
        }}
      >
        <h3 className="mb-4 text-lg font-medium text-gray-900">{title}</h3>
        <div className="space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-gray-900">Basic Information</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-name">
                  Tenant Name
                </label>
                <input
                  id="tenant-name"
                  type="text"
                  value={tenant.name}
                  onChange={(event) => onChange({ name: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
                  placeholder="Internal tenant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-display-name">
                  Display Name
                </label>
                <input
                  id="tenant-display-name"
                  type="text"
                  value={tenant.displayName ?? ''}
                  onChange={(event) => onChange({ displayName: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
                  placeholder="Shown to users"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-tagline">
                  Tagline
                </label>
                <textarea
                  id="tenant-tagline"
                  value={tenant.tagline ?? ''}
                  onChange={(event) => onChange({ tagline: event.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Short phrase displayed on login screens"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-legal-name">
                  Legal Name
                </label>
                <input
                  id="tenant-legal-name"
                  type="text"
                  value={tenant.legalName ?? ''}
                  onChange={(event) => onChange({ legalName: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Registered legal entity"
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900">Domain</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-subdomain">
                  Subdomain
                </label>
                <input
                  id="tenant-subdomain"
                  type="text"
                  value={subdomain}
                  onChange={(event) => handleSubdomainChange(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black lowercase placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
                  placeholder="Choose a unique subdomain"
                />
                <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-domain">
                  Generated Domain
                </label>
                <div className="mt-1 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
                  <span className="font-medium">https://{domainPreview}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Tenants access FlowBot at this URL.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900">Branding</h4>
            <div className="mt-3 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                  {tenant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tenant.logoUrl}
                      alt="Tenant logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-gray-400">No logo</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="touch-target rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {logoUploading ? 'Uploading logo…' : tenant.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                    </button>
                    {tenant.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="touch-target rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP, or SVG up to 5MB. Logos are stored as uploaded without optimization.
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept={ACCEPTED_LOGO_TYPES.join(',')}
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-primary-color">
                  Primary Brand Color
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    id="tenant-primary-color"
                    type="color"
                    value={colorInputValue}
                    onChange={(event) => onChange({ primaryColor: event.target.value })}
                    className="h-10 w-16 cursor-pointer rounded-md border border-gray-300"
                  />
                  <input
                    type="text"
                    value={tenant.primaryColor ?? ''}
                    onChange={(event) => onChange({ primaryColor: event.target.value })}
                    className="block w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="#3b82f6"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ primaryColor: '' })}
                    className="touch-target rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900">Contact & Identity</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-contact-email">
                  Contact Email
                </label>
                <input
                  id="tenant-contact-email"
                  type="email"
                  value={tenant.contactEmail ?? ''}
                  onChange={(event) => onChange({ contactEmail: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="contact@tenant.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-contact-phone">
                  Contact Phone
                </label>
                <input
                  id="tenant-contact-phone"
                  type="text"
                  value={tenant.contactPhone ?? ''}
                  onChange={(event) => onChange({ contactPhone: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-website">
                  Website URL
                </label>
                <input
                  id="tenant-website"
                  type="url"
                  value={tenant.websiteUrl ?? ''}
                  onChange={(event) => onChange({ websiteUrl: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://tenant.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-payment-return-home">
                  Payment Return Home URL
                </label>
                <input
                  id="tenant-payment-return-home"
                  type="url"
                  value={tenant.paymentReturnHomeUrl ?? ''}
                  onChange={(event) => onChange({ paymentReturnHomeUrl: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://tenant.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL for "Return Home" button on payment success page. If empty, uses domain or website URL.
                </p>
              </div>
              {isEditMode && (() => {
                const settings = tenant.settings as any
                const lyraConfig = settings?.lyraConfig
                // Read activeMode from lyraConfig, but also check enabled flags for visual state
                const currentActiveMode = lyraConfig?.activeMode || 'test'
                // Check if modes have credentials (required to enable)
                const testModeHasCredentials = !!lyraConfig?.testMode?.credentials
                const productionModeHasCredentials = !!lyraConfig?.productionMode?.credentials
                // Visual state: enabled flag determines if button is active
                const testModeEnabled = lyraConfig?.testMode?.enabled === true
                const productionModeEnabled = lyraConfig?.productionMode?.enabled === true
                // Can activate if has credentials
                const hasTestMode = testModeHasCredentials
                const hasProductionMode = productionModeHasCredentials
                
                if (!lyraConfig) {
                  return (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <p className="text-sm text-amber-800">
                        ⚠️ No Lyra payment configuration found. Payment links will not work until Lyra is configured.
                      </p>
                    </div>
                  )
                }
                
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Environment
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (hasTestMode) {
                            const updatedSettings = {
                              ...settings,
                              lyraConfig: {
                                ...lyraConfig,
                                activeMode: 'test',
                                // Mutually exclusive: activate test, deactivate production
                                testMode: {
                                  ...lyraConfig.testMode,
                                  enabled: true,
                                },
                                productionMode: {
                                  ...lyraConfig.productionMode,
                                  enabled: false,
                                },
                              },
                            }
                            console.log('[TenantFormModal] Switching to TEST mode:', {
                              activeMode: 'test',
                              testModeEnabled: true,
                              productionModeEnabled: false,
                              hasTestCredentials: !!lyraConfig.testMode?.credentials,
                            })
                            onChange({ settings: updatedSettings })
                          }
                        }}
                        disabled={!hasTestMode}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          testModeEnabled && currentActiveMode === 'test'
                            ? 'bg-blue-600 text-white'
                            : hasTestMode
                              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Test / Sandbox
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasProductionMode) {
                            const updatedSettings = {
                              ...settings,
                              lyraConfig: {
                                ...lyraConfig,
                                activeMode: 'production',
                                // Mutually exclusive: activate production, deactivate test
                                testMode: {
                                  ...lyraConfig.testMode,
                                  enabled: false,
                                },
                                productionMode: {
                                  ...lyraConfig.productionMode,
                                  enabled: true,
                                },
                              },
                            }
                            console.log('[TenantFormModal] Switching to PRODUCTION mode:', {
                              activeMode: 'production',
                              testModeEnabled: false,
                              productionModeEnabled: true,
                              hasProductionCredentials: !!lyraConfig.productionMode?.credentials,
                            })
                            onChange({ settings: updatedSettings })
                          }
                        }}
                        disabled={!hasProductionMode}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          productionModeEnabled && currentActiveMode === 'production'
                            ? 'bg-blue-600 text-white'
                            : hasProductionMode
                              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Production / Live
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Active environment determines which credentials are used for payment links. Only environments with complete credentials can be activated.
                    </p>
                  </div>
                )
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-industry">
                  Industry
                </label>
                <input
                  id="tenant-industry"
                  type="text"
                  value={tenant.industry ?? ''}
                  onChange={(event) => onChange({ industry: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Healthcare, Retail, Finance..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-address-line1">
                  Address Line 1
                </label>
                <input
                  id="tenant-address-line1"
                  type="text"
                  value={tenant.addressLine1 ?? ''}
                  onChange={(event) => onChange({ addressLine1: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-address-line2">
                  Address Line 2
                </label>
                <input
                  id="tenant-address-line2"
                  type="text"
                  value={tenant.addressLine2 ?? ''}
                  onChange={(event) => onChange({ addressLine2: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Suite 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-city">
                  City
                </label>
                <input
                  id="tenant-city"
                  type="text"
                  value={tenant.city ?? ''}
                  onChange={(event) => onChange({ city: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-state">
                  State / Region
                </label>
                <input
                  id="tenant-state"
                  type="text"
                  value={tenant.state ?? ''}
                  onChange={(event) => onChange({ state: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-postal-code">
                  Postal Code
                </label>
                <input
                  id="tenant-postal-code"
                  type="text"
                  value={tenant.postalCode ?? ''}
                  onChange={(event) => onChange({ postalCode: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant-country">
                  Country
                </label>
                <input
                  id="tenant-country"
                  type="text"
                  value={tenant.country ?? ''}
                  onChange={(event) => onChange({ country: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="United States"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 touch-target"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!confirmDisabled) {
                onSubmit()
              } else {
                console.warn('Submit disabled:', { confirmDisabled, isSaving, logoUploading, name: tenant.name.trim(), subdomain: tenant.subdomain?.trim() })
              }
            }}
            disabled={confirmDisabled}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 touch-target"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
