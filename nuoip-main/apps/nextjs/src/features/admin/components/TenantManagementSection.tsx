import { useEffect, useState, useCallback, type FormEvent } from 'react'
import {
  type Tenant,
  type TenantPayload,
  getTenants as getTenantsApi,
  getTenant,
  createTenant as createTenantRequest,
  updateTenant as updateTenantRequest,
  deleteTenant as deleteTenantRequest,
  getTenantPersonalization,
  updateTenantPersonalization,
} from '@/features/admin/api/admin-api'
import {
  DEFAULT_TENANT_PERSONALIZATION,
  mergeTenantPersonalization,
  type TenantPersonalization,
} from '@/lib/tenant/personalization'
import { TenantFormModal } from '@/features/admin/components/TenantFormModal'
import { TenantPersonalizationModal } from '@/features/admin/components/TenantPersonalizationModal'
import { TenantCustomizationModal } from '@/features/admin/components/TenantCustomizationModal'
import { toast } from '@/stores'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Users, CheckCircle, XCircle, AlertCircle, Loader2, Key, Settings, Palette, Grid3x3, List, X, Edit } from 'lucide-react'
import { getUsers as getUsersApi, type User } from '@/features/admin/api/admin-api'
import * as Dialog from '@radix-ui/react-dialog'

const createEmptyTenantPayload = (): TenantPayload => ({
  name: '',
  displayName: '',
  legalName: '',
  subdomain: '',
  domain: '',
  tagline: '',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  paymentReturnHomeUrl: '',
  industry: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  primaryColor: '',
  logoUrl: null,
  logoWidth: null,
  logoHeight: null,
  logoMimeType: null,
  logoBlurData: null,
  settings: {
    personalization: { ...DEFAULT_TENANT_PERSONALIZATION },
  },
})

export function TenantManagementSection() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list')

  const [showCreateTenant, setShowCreateTenant] = useState(false)
  const [showEditTenant, setShowEditTenant] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [tenantForm, setTenantForm] = useState<TenantPayload>(createEmptyTenantPayload)

  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false)
  const [personalizationTenant, setPersonalizationTenant] = useState<Tenant | null>(null)
  const [personalizationForm, setPersonalizationForm] = useState<TenantPersonalization>({
    ...DEFAULT_TENANT_PERSONALIZATION,
  })
  const [personalizationError, setPersonalizationError] = useState<string | null>(null)
  const [personalizationLoading, setPersonalizationLoading] = useState(false)
  const [savingPersonalization, setSavingPersonalization] = useState(false)

  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [customizationTenant, setCustomizationTenant] = useState<Tenant | null>(null)

  const [showUsersModal, setShowUsersModal] = useState(false)
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState<Tenant | null>(null)
  const [tenantUsers, setTenantUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const extractErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback

  const resolvePersonalization = (settings: Tenant['settings']): Partial<TenantPersonalization> | null => {
    if (!settings || typeof settings !== 'object') {
      return null
    }
    const personalization = (settings as { personalization?: unknown }).personalization
    if (!personalization || typeof personalization !== 'object') {
      return null
    }
    return personalization as Partial<TenantPersonalization>
  }

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTenantsApi()
      console.log('[TenantManagement] Fetched tenants data:', data)
      
      // Handle both array and object with tenants property
      const tenantsArray = Array.isArray(data) ? data : (data.tenants || [])
      
      const normalizedTenants = tenantsArray.map((tenant: Tenant) => ({
        ...tenant,
        // Map userCount (from backend) to user_count (for frontend compatibility)
        user_count: (tenant as any).userCount ?? (tenant as any).user_count ?? 0,
        settings: {
          ...(tenant.settings || {}),
          personalization: mergeTenantPersonalization(resolvePersonalization(tenant.settings)),
        },
      }))
      
      console.log('[TenantManagement] Normalized tenants:', normalizedTenants)
      setTenants(normalizedTenants)
    } catch (err) {
      console.error('Failed to fetch tenants:', err)
      const message = extractErrorMessage(err, 'Failed to load tenants')
      setError(message)
      toast.error('Failed to load tenants', message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTenants()
  }, [fetchTenants])

  // Listen for tenant user count changes (when users are assigned/unassigned)
  useEffect(() => {
    const handleTenantUserCountChanged = () => {
      // Refresh tenant list to update user counts
      void fetchTenants()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('tenant-user-count-changed', handleTenantUserCountChanged)
      return () => {
        window.removeEventListener('tenant-user-count-changed', handleTenantUserCountChanged)
      }
    }
  }, [fetchTenants])

  const handleTenantFormChange = (updates: Partial<TenantPayload>) => {
    setTenantForm(prev => {
      const merged = {
        ...prev,
        ...updates,
      }
      
      // Deep merge settings to preserve nested objects like lyraConfig
      if (updates.settings) {
        merged.settings = {
          ...(prev.settings || {}),
          ...updates.settings,
          // Deep merge lyraConfig to preserve testMode/productionMode credentials
          lyraConfig: updates.settings.lyraConfig
            ? {
                ...(prev.settings?.lyraConfig || {}),
                ...updates.settings.lyraConfig,
                // Deep merge testMode and productionMode to preserve credentials
                testMode: updates.settings.lyraConfig.testMode
                  ? {
                      ...(prev.settings?.lyraConfig?.testMode || {}),
                      ...updates.settings.lyraConfig.testMode,
                    }
                  : prev.settings?.lyraConfig?.testMode,
                productionMode: updates.settings.lyraConfig.productionMode
                  ? {
                      ...(prev.settings?.lyraConfig?.productionMode || {}),
                      ...updates.settings.lyraConfig.productionMode,
                    }
                  : prev.settings?.lyraConfig?.productionMode,
              }
            : prev.settings?.lyraConfig,
        }
        
        // Log the merge result for debugging
        const mergedLyraConfig = (merged.settings as any)?.lyraConfig
        if (mergedLyraConfig && updates.settings?.lyraConfig) {
          console.log('[TenantManagementSection] Merged lyraConfig:', {
            activeMode: mergedLyraConfig.activeMode,
            testModeEnabled: mergedLyraConfig.testMode?.enabled,
            productionModeEnabled: mergedLyraConfig.productionMode?.enabled,
            hasTestCredentials: !!mergedLyraConfig.testMode?.credentials,
            hasProductionCredentials: !!mergedLyraConfig.productionMode?.credentials,
          })
        }
      }
      
      return merged
    })
  }

  const resetTenantForm = () => {
    setTenantForm(createEmptyTenantPayload())
  }

  const closeTenantModals = () => {
    setShowCreateTenant(false)
    setShowEditTenant(false)
    setSelectedTenant(null)
    resetTenantForm()
  }

  const handleCreateTenant = async () => {
    try {
      console.log('[TenantManagement] Creating tenant:', tenantForm)
      const result = await createTenantRequest(tenantForm)
      console.log('[TenantManagement] Tenant created:', result)
      
      // Force refresh the tenant list
      await fetchTenants()
      closeTenantModals()
      toast.success('Tenant created', `${tenantForm.name || 'Tenant'} created successfully.`)
    } catch (error) {
      console.error('Error creating tenant:', error)
      // Extract more detailed error message
      let message = 'Unable to create tenant'
      if (error instanceof Error) {
        message = error.message || message
        // If message is a JSON string, try to parse it
        if (message.startsWith('{') && message.endsWith('}')) {
          try {
            const parsed = JSON.parse(message)
            message = parsed.message || parsed.error || message
          } catch {
            // Not valid JSON, use as-is
          }
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String(error.message)
      }
      toast.error('Tenant creation failed', message)
    }
  }

  const handleDeleteTenant = async (tenantId: string) => {
    const tenantName = tenants.find(tenant => tenant.id === tenantId)?.name || 'Tenant'
    try {
      await deleteTenantRequest(tenantId)
      await fetchTenants()
      setSelectedTenant(null)
      toast.success('Tenant deleted', `${tenantName} has been deleted.`)
    } catch (error) {
      console.error('Error deleting tenant:', error)
      const message = extractErrorMessage(error, 'Unable to delete tenant')
      toast.error('Tenant deletion failed', message)
    }
  }

  const getTenantLogoUrl = (tenant: Tenant): string | null => {
    // Check settings.branding.logoUrl first (where backend stores it)
    if (tenant.settings && typeof tenant.settings === 'object') {
      const settings = tenant.settings as Record<string, unknown>
      const branding = settings.branding as Record<string, unknown> | undefined
      if (branding && typeof branding.logoUrl === 'string' && branding.logoUrl.trim()) {
        return branding.logoUrl.trim()
      }
    }
    // Fallback to direct logoUrl field
    if (tenant.logoUrl && typeof tenant.logoUrl === 'string' && tenant.logoUrl.trim()) {
      return tenant.logoUrl.trim()
    }
    return null
  }

  const handleEditTenant = async (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowEditTenant(true)
    
    try {
      // Fetch full tenant details from API to ensure we have all fields
      const fullTenant = await getTenant(tenant.id)
      const logoUrl = getTenantLogoUrl(fullTenant)
      
      // Log the loaded tenant's lyraConfig
      const loadedSettings = fullTenant.settings as any
      const loadedLyraConfig = loadedSettings?.lyraConfig
      console.log('[TenantManagementSection] Loading tenant for edit:', {
        tenantId: fullTenant.id,
        tenantName: fullTenant.name,
        hasSettings: !!loadedSettings,
        settingsKeys: loadedSettings ? Object.keys(loadedSettings) : [],
        hasLyraConfig: !!loadedLyraConfig,
        lyraConfigKeys: loadedLyraConfig ? Object.keys(loadedLyraConfig) : [],
        activeMode: loadedLyraConfig?.activeMode,
        testModeEnabled: loadedLyraConfig?.testMode?.enabled,
        productionModeEnabled: loadedLyraConfig?.productionMode?.enabled,
        testModeHasCredentials: !!loadedLyraConfig?.testMode?.credentials,
        productionModeHasCredentials: !!loadedLyraConfig?.productionMode?.credentials,
      })
      
      setTenantForm({
        name: fullTenant.name,
        displayName: fullTenant.displayName ?? fullTenant.name ?? '',
        legalName: fullTenant.legalName ?? '',
        subdomain: fullTenant.subdomain || '',
        domain: fullTenant.domain || '',
        tagline: fullTenant.tagline ?? '',
        contactEmail: fullTenant.contactEmail ?? '',
        contactPhone: fullTenant.contactPhone ?? '',
        websiteUrl: fullTenant.websiteUrl ?? '',
        paymentReturnHomeUrl: fullTenant.paymentReturnHomeUrl ?? '',
        industry: fullTenant.industry ?? '',
        addressLine1: fullTenant.addressLine1 ?? '',
        addressLine2: fullTenant.addressLine2 ?? '',
        city: fullTenant.city ?? '',
        state: fullTenant.state ?? '',
        postalCode: fullTenant.postalCode ?? '',
        country: fullTenant.country ?? '',
        primaryColor: (fullTenant.settings && typeof fullTenant.settings === 'object' 
          ? (fullTenant.settings as Record<string, unknown>).branding as Record<string, unknown> | undefined
          : undefined)?.primaryColor as string | undefined ?? fullTenant.primaryColor ?? '',
        logoUrl: logoUrl,
        logoWidth: fullTenant.logoWidth ?? null,
        logoHeight: fullTenant.logoHeight ?? null,
        logoMimeType: fullTenant.logoMimeType ?? null,
        logoBlurData: fullTenant.logoBlurData ?? null,
        settings: {
          ...(fullTenant.settings || {}),
          personalization: mergeTenantPersonalization(resolvePersonalization(fullTenant.settings)),
        },
      })
      
      // Log what was set in tenantForm
      const setLyraConfig = ((fullTenant.settings as any)?.lyraConfig)
      console.log('[TenantManagementSection] Tenant form set with lyraConfig:', {
        hasLyraConfig: !!setLyraConfig,
        activeMode: setLyraConfig?.activeMode,
        testModeEnabled: setLyraConfig?.testMode?.enabled,
        productionModeEnabled: setLyraConfig?.productionMode?.enabled,
      })
    } catch (error) {
      console.error('Error fetching tenant details:', error)
      // Fallback to using the tenant from the list if API call fails
      const logoUrl = getTenantLogoUrl(tenant)
      setTenantForm({
        name: tenant.name,
        displayName: tenant.displayName ?? tenant.name ?? '',
        legalName: tenant.legalName ?? '',
        subdomain: tenant.subdomain || '',
        domain: tenant.domain || '',
        tagline: tenant.tagline ?? '',
        contactEmail: tenant.contactEmail ?? '',
        contactPhone: tenant.contactPhone ?? '',
        websiteUrl: tenant.websiteUrl ?? '',
        paymentReturnHomeUrl: tenant.paymentReturnHomeUrl ?? '',
        industry: tenant.industry ?? '',
        addressLine1: tenant.addressLine1 ?? '',
        addressLine2: tenant.addressLine2 ?? '',
        city: tenant.city ?? '',
        state: tenant.state ?? '',
        postalCode: tenant.postalCode ?? '',
        country: tenant.country ?? '',
        primaryColor: (tenant.settings && typeof tenant.settings === 'object' 
          ? (tenant.settings as Record<string, unknown>).branding as Record<string, unknown> | undefined
          : undefined)?.primaryColor as string | undefined ?? tenant.primaryColor ?? '',
        logoUrl: logoUrl,
        logoWidth: tenant.logoWidth ?? null,
        logoHeight: tenant.logoHeight ?? null,
        logoMimeType: tenant.logoMimeType ?? null,
        logoBlurData: tenant.logoBlurData ?? null,
        settings: {
          ...(tenant.settings || {}),
          personalization: mergeTenantPersonalization(resolvePersonalization(tenant.settings)),
        },
      })
      toast.error('Load failed', 'Unable to load full tenant details. Using cached data.')
    }
  }

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return

    try {
      // Log what we're sending, especially lyraConfig
      const lyraConfig = (tenantForm.settings as any)?.lyraConfig
      if (lyraConfig) {
        console.log('[TenantManagementSection] Updating tenant with lyraConfig:', {
          activeMode: lyraConfig.activeMode,
          testModeEnabled: lyraConfig.testMode?.enabled,
          productionModeEnabled: lyraConfig.productionMode?.enabled,
          hasTestCredentials: !!lyraConfig.testMode?.credentials,
          hasProductionCredentials: !!lyraConfig.productionMode?.credentials,
          testModeKeys: lyraConfig.testMode ? Object.keys(lyraConfig.testMode) : [],
          productionModeKeys: lyraConfig.productionMode ? Object.keys(lyraConfig.productionMode) : [],
          fullLyraConfig: JSON.stringify(lyraConfig, null, 2).substring(0, 500), // First 500 chars
        })
      } else {
        console.warn('[TenantManagementSection] ⚠️ No lyraConfig in tenantForm.settings when updating tenant!')
        console.log('[TenantManagementSection] tenantForm.settings keys:', tenantForm.settings ? Object.keys(tenantForm.settings as any) : 'no settings')
      }
      
      // Verify that settings.lyraConfig is included in the payload
      const payloadToSend = { ...tenantForm }
      const payloadLyraConfig = (payloadToSend.settings as any)?.lyraConfig
      console.log('[TenantManagementSection] Full payload being sent:', {
        hasSettings: !!payloadToSend.settings,
        settingsKeys: payloadToSend.settings ? Object.keys(payloadToSend.settings as any) : [],
        hasLyraConfig: !!payloadLyraConfig,
        lyraConfigKeys: payloadLyraConfig ? Object.keys(payloadLyraConfig) : [],
        activeMode: payloadLyraConfig?.activeMode,
        testModeEnabled: payloadLyraConfig?.testMode?.enabled,
        productionModeEnabled: payloadLyraConfig?.productionMode?.enabled,
        testModeHasCredentials: !!payloadLyraConfig?.testMode?.credentials,
        productionModeHasCredentials: !!payloadLyraConfig?.productionMode?.credentials,
        fullLyraConfigPreview: payloadLyraConfig ? JSON.stringify(payloadLyraConfig, null, 2).substring(0, 1000) : 'none',
      })
      
      await updateTenantRequest(selectedTenant.id, payloadToSend)
      await fetchTenants()
      closeTenantModals()
      toast.success('Tenant updated', `${tenantForm.name || 'Tenant'} updated successfully.`)
    } catch (error) {
      console.error('Error updating tenant:', error)
      const message = extractErrorMessage(error, 'Unable to update tenant')
      toast.error('Tenant update failed', message)
    }
  }

  const closePersonalizationModal = () => {
    setShowPersonalizationModal(false)
    setPersonalizationTenant(null)
    setPersonalizationForm({ ...DEFAULT_TENANT_PERSONALIZATION })
    setPersonalizationError(null)
    setPersonalizationLoading(false)
  }

  const handleOpenPersonalization = async (tenant: Tenant) => {
    setPersonalizationTenant(tenant)
    setPersonalizationError(null)
    setShowPersonalizationModal(true)
    setPersonalizationLoading(true)
    setPersonalizationForm(
      mergeTenantPersonalization(resolvePersonalization(tenant.settings)),
    )

    try {
      const data = await getTenantPersonalization(tenant.id)
      if (data?.personalization) {
        setPersonalizationForm(mergeTenantPersonalization(data.personalization))
      } else {
        // Use personalization from tenant settings if available, otherwise use default
        setPersonalizationForm(mergeTenantPersonalization(resolvePersonalization(tenant.settings)))
      }
    } catch (error) {
      console.error('Failed to load personalization settings:', error)
      // Don't show error if it's a 404 - use tenant settings as fallback
      if (error instanceof Error && error.message.includes('404')) {
        setPersonalizationForm(mergeTenantPersonalization(resolvePersonalization(tenant.settings)))
      } else {
        setPersonalizationError('Failed to load personalization settings')
        toast.error('Load personalization failed', 'Unable to load personalization settings for this tenant.')
        setPersonalizationForm({ ...DEFAULT_TENANT_PERSONALIZATION })
      }
    } finally {
      setPersonalizationLoading(false)
    }
  }

  const handlePersonalizationChange = (form: TenantPersonalization) => {
    setPersonalizationForm(form)
  }

  const handlePersonalizationSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!personalizationTenant) return

    try {
      setSavingPersonalization(true)
      setPersonalizationError(null)
      const updated = await updateTenantPersonalization(
        personalizationTenant.id,
        personalizationForm,
      )

      setTenants(prev =>
        prev.map(tenant =>
          tenant.id === personalizationTenant.id
            ? {
                ...tenant,
                settings: {
                  ...(tenant.settings || {}),
                  personalization: mergeTenantPersonalization(updated.personalization),
                },
              }
            : tenant,
        ),
      )

      closePersonalizationModal()
      toast.success('Personalization saved', 'Tenant personalization settings updated.')
    } catch (error) {
      console.error('Failed to save personalization settings:', error)
      setPersonalizationError('Failed to save personalization settings')
      toast.error('Personalization failed', 'Unable to save personalization settings.')
    } finally {
      setSavingPersonalization(false)
    }
  }

  const handleOpenCustomization = (tenant: Tenant) => {
    setCustomizationTenant(tenant)
    setShowCustomizationModal(true)
  }

  const handleShowUsers = async (tenant: Tenant) => {
    setSelectedTenantForUsers(tenant)
    setShowUsersModal(true)
    setLoadingUsers(true)
    try {
      const allUsers = await getUsersApi()
      const usersArray = Array.isArray(allUsers) ? allUsers : (allUsers.users || [])
      const filteredUsers = usersArray.filter((user: User) => user.tenantId === tenant.id)
      setTenantUsers(filteredUsers)
    } catch (err) {
      console.error('Failed to fetch tenant users:', err)
      toast.error('Failed to load users', 'Unable to fetch users for this tenant')
      setTenantUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCloseCustomization = () => {
    setShowCustomizationModal(false)
    setCustomizationTenant(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold text-black">Organization Management</h1>
      </div>

      <Alert className="bg-white border-gray-200">
        <Building2 className="h-4 w-4" />
        <AlertDescription className="text-black">
          Manage organizations (tenants) and their configurations. Each organization can have its own branding, users, and settings.
        </AlertDescription>
      </Alert>

      {loading && (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-black">Loading Organizations...</h3>
                <p className="text-sm text-gray-600">Fetching organization data...</p>
            </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-500 bg-white">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-black">
            {error}
            <Button
              variant="outline"
              size="sm"
                onClick={fetchTenants}
              className="mt-2 bg-white text-black border-gray-300 hover:bg-gray-50"
              >
                Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Card className="bg-white border-gray-200 flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-black">{tenants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Organizations</p>
                <p className="text-2xl font-bold text-black">{tenants.filter(t => t.isActive !== false).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
          </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-black">{tenants.reduce((sum, t) => sum + (t.user_count || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-black">
                <Building2 className="h-5 w-5 text-green-600" />
                All Organizations
              </CardTitle>
              <CardDescription className="text-black">
                Manage and configure your organizations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-gray-300 rounded-md bg-white">
                <Button
                  onClick={() => setViewMode('card')}
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 ${viewMode === 'card' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:text-black'}`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 ${viewMode === 'list' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:text-black'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => {
                  resetTenantForm()
                  setShowCreateTenant(true)
                }}
                variant="outline"
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Create New Organization
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          {viewMode === 'card' ? (
          <div className="flex flex-wrap gap-4">
            {tenants.map(tenant => {
              const personalization = resolvePersonalization(tenant.settings)
              const style = personalization?.style ?? 'professional'
              const tone = personalization?.tone ?? 'neutral'
              const logoUrl = getTenantLogoUrl(tenant)
              return (
                <Card key={tenant.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow flex-shrink-0 w-[350px]">
                  <CardHeader className="bg-white pb-3">
                    <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                          {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                              src={logoUrl}
                            alt={`${tenant.displayName ?? tenant.name} logo`}
                              className="h-full w-full object-contain"
                          />
                        ) : (
                            <Building2 className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                          <CardTitle className="text-base text-black">
                          {tenant.displayName || tenant.name}
                          </CardTitle>
                        {tenant.tagline && (
                            <CardDescription className="text-gray-600 mt-1">
                            {tenant.tagline}
                            </CardDescription>
                        )}
                        </div>
                      </div>
                      <Badge variant="outline" className={tenant.isActive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}>
                        {tenant.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white space-y-3">
                    <div className="space-y-2 text-sm">
                      {tenant.domain && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 w-20">Domain:</span>
                          <span className="text-black font-mono text-xs">{tenant.domain}</span>
                        </div>
                      )}
                      {tenant.contactEmail && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 w-20">Email:</span>
                          <span className="text-black text-xs">{tenant.contactEmail}</span>
                        </div>
                      )}
                      {tenant.contactPhone && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 w-20">Phone:</span>
                          <span className="text-black text-xs">{tenant.contactPhone}</span>
                        </div>
                      )}
                      {(tenant.city || tenant.country) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 w-20">Location:</span>
                          <span className="text-black text-xs">{[tenant.city, tenant.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Users:</span>
                        <span className="text-black font-semibold">{tenant.user_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                      <Button
                        onClick={() => handleShowUsers(tenant)}
                        variant="outline"
                        size="sm"
                        className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        View Users
                      </Button>
                      <Button
                        onClick={() => handleOpenPersonalization(tenant)}
                        variant="outline"
                        size="sm"
                        className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        Personalize
                      </Button>
                      <Button
                        onClick={() => handleOpenCustomization(tenant)}
                        variant="outline"
                        size="sm"
                        className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                      >
                        <Settings className="h-3 w-3 mr-1 text-black" strokeWidth={2} />
                        Customize
                      </Button>
                      <Button
                        onClick={() => handleEditTenant(tenant)}
                        variant="outline"
                        size="sm"
                        className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        variant="outline"
                        size="sm"
                        className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          ) : (
          <div className="space-y-2">
            {tenants.map(tenant => {
              const personalization = resolvePersonalization(tenant.settings)
              const logoUrl = getTenantLogoUrl(tenant)
              return (
                <div
                  key={tenant.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={`${tenant.displayName ?? tenant.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-black truncate">
                        {tenant.displayName || tenant.name}
                      </h3>
                      <Badge variant="outline" className={tenant.isActive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}>
                        {tenant.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    {tenant.tagline && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{tenant.tagline}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      {tenant.domain && (
                        <span className="font-mono">{tenant.domain}</span>
                    )}
                      {tenant.contactEmail && (
                        <span>{tenant.contactEmail}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{tenant.user_count || 0} users</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleShowUsers(tenant)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-xs"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Users
                    </Button>
                    <Button
                      onClick={() => handleOpenPersonalization(tenant)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                    >
                      <Palette className="h-3 w-3 mr-1" />
                      Personalize
                    </Button>
                    <Button
                      onClick={() => handleOpenCustomization(tenant)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1 text-black" strokeWidth={2} />
                      Customize
                    </Button>
                    <Button
                      onClick={() => handleEditTenant(tenant)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteTenant(tenant.id)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </CardContent>
      </Card>

      <TenantFormModal
        title="Create New Tenant"
        confirmLabel="Create Tenant"
        isOpen={showCreateTenant}
        tenant={tenantForm}
        onChange={handleTenantFormChange}
        onClose={closeTenantModals}
        onSubmit={handleCreateTenant}
        tenantId={null}
      />

      <TenantFormModal
        title="Edit Tenant"
        confirmLabel="Update Tenant"
        isOpen={showEditTenant && Boolean(selectedTenant)}
        tenant={tenantForm}
        onChange={handleTenantFormChange}
        onClose={closeTenantModals}
        onSubmit={handleUpdateTenant}
        tenantId={selectedTenant?.id ?? null}
      />

      <TenantPersonalizationModal
        isOpen={showPersonalizationModal}
        tenant={personalizationTenant}
        form={personalizationForm}
        error={personalizationError}
        loading={personalizationLoading}
        saving={savingPersonalization}
        onChange={handlePersonalizationChange}
        onClose={closePersonalizationModal}
        onSubmit={handlePersonalizationSubmit}
      />

      <TenantCustomizationModal
        isOpen={showCustomizationModal}
        tenant={customizationTenant}
        onClose={handleCloseCustomization}
      />

      {/* Tenant Users Modal */}
      <Dialog.Root open={showUsersModal} onOpenChange={setShowUsersModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <Dialog.Content className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Users - {selectedTenantForUsers?.displayName || selectedTenantForUsers?.name || 'Tenant'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading users...</span>
                </div>
              ) : tenantUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No users found for this tenant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenantUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0">
                        {user.profilePictureUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.profilePictureUrl}
                            alt={user.name || user.email}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name || 'No name'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-gray-500 mt-1">
                            {user.phone}
                            {user.phoneCountryCode && ` (${user.phoneCountryCode})`}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            user.status === 'active'
                              ? 'text-green-600 border-green-200'
                              : user.status === 'suspended'
                              ? 'text-red-600 border-red-200'
                              : 'text-gray-600 border-gray-200'
                          }
                        >
                          {user.status || 'invited'}
                        </Badge>
                        {user.role && (
                          <Badge variant="outline" className="text-gray-600 border-gray-200">
                            {user.role}
                          </Badge>
                        )}
                        <Button
                          onClick={() => {
                            console.log('[TenantManagement] Edit button clicked for user:', user.email)
                            // Dispatch event to open user edit modal in UserManagementSection
                            if (typeof window !== 'undefined') {
                              const event = new CustomEvent('edit-user-from-tenant', {
                                detail: { user }
                              })
                              console.log('[TenantManagement] Dispatching edit-user-from-tenant event:', event)
                              window.dispatchEvent(event)
                            }
                            // Close the tenant users modal
                            setShowUsersModal(false)
                            console.log('[TenantManagement] Tenant users modal closed')
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1 text-blue-600" strokeWidth={2} />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Dialog.Close asChild>
                <Button variant="outline" className="bg-white">
                  Close
                </Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
