import Image from 'next/image'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type {
  AdminStats,
  CreateUserPayload,
  Tenant,
  TenantChatContact,
  UpdateUserRequestPayload,
  User
} from '@/features/admin/api/admin-api'
import {
  getUsers as getUsersApi,
  createUser as createUserRequest,
  updateUser as updateUserRequest,
  deleteUser as deleteUserRequest,
  revokeUserSessions,
  getTenants as getTenantsApi,
  getTenantChatContacts,
} from '@/features/admin/api/admin-api'
import { UserFormModal } from '@/features/admin/components/UserFormModal'
import { toast } from '@/stores'
import { DEFAULT_COUNTRY, extractCountryCode, isValidPhoneNumber } from '@/lib/utils/phone'

interface UserManagementSectionProps {
  stats: AdminStats | null
  actorRole: 'admin' | 'super_admin'
  actorTenantId: string | null
}

const createEmptyUserPayload = (tenantId?: string | null): CreateUserPayload => ({
  name: '',
  email: '',
  password: '',
  role: 'user',
  tenantId: tenantId ?? '',
  phone: '',
  phoneCountryCode: DEFAULT_COUNTRY.dialCode,
  contactIds: [],
  chatbotAccessStatus: 'pending',
  status: 'invited',
  approvalStatus: 'pending',
  approvalMessage: '',
})

export function UserManagementSection({ stats, actorRole, actorTenantId }: UserManagementSectionProps) {
  const isSuperAdmin = actorRole === 'super_admin'
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [tenantsError, setTenantsError] = useState<string | null>(null)

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [savingAssignments, setSavingAssignments] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<CreateUserPayload>(() => createEmptyUserPayload(actorTenantId))

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all')

  const extractErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true)
      setUsersError(null)
      const data = await getUsersApi()
      console.log('[UserManagement] Fetched users data:', data)
      
      // Handle both array and object with users property
      const usersArray = Array.isArray(data) ? data : (data.users || [])
      
      console.log('[UserManagement] Normalized users:', usersArray)
      setUsers(usersArray)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      const message = extractErrorMessage(err, 'Failed to load users')
      setUsersError(message)
      toast.error('Failed to load users', message)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const fetchTenants = useCallback(async () => {
    try {
      setTenantsError(null)
      const data = await getTenantsApi()
      setTenants(data.tenants || [])
    } catch (err) {
      console.error('Failed to fetch tenants for users section:', err)
      const message = extractErrorMessage(err, 'Failed to load tenants')
      setTenantsError(message)
      toast.error('Failed to load tenant list', message)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
      void fetchTenants()
  }, [fetchUsers, fetchTenants])

  // Listen for edit user event from tenant management section
  useEffect(() => {
    const handleEditUserFromTenant = (event: Event) => {
      console.log('[UserManagement] Received edit-user-from-tenant event:', event)
      const customEvent = event as CustomEvent<{ user: User }>
      const user = customEvent.detail?.user
      console.log('[UserManagement] User from event:', user)
      if (user) {
        console.log('[UserManagement] Opening edit modal for user:', user.email)
        // Use the same logic as handleEditUser
        const trimmedPhone = user.phone?.trim() || ''
        let resolvedCountry = user.phoneCountryCode?.trim() || ''
        let resolvedPhone = trimmedPhone

        if (trimmedPhone.startsWith('+')) {
          const extracted = extractCountryCode(trimmedPhone)
          if (extracted.countryCode) {
            resolvedCountry = extracted.countryCode
          }
          resolvedPhone = extracted.phone
        }

        if (resolvedCountry) {
          const normalizedCode = resolvedCountry.startsWith('+')
            ? resolvedCountry
            : `+${resolvedCountry.replace(/[^0-9]/g, '')}`
          if (normalizedCode && resolvedPhone.startsWith(normalizedCode)) {
            resolvedPhone = resolvedPhone.slice(normalizedCode.length)
          }
        }

        const sanitizedPhone = sanitizePhoneValue(resolvedPhone)
        const countryCode = sanitizedPhone ? (resolvedCountry || DEFAULT_COUNTRY.dialCode) : DEFAULT_COUNTRY.dialCode

        setSelectedUser(user)
        setUserForm({
          name: user.name || '',
          email: user.email,
          password: '',
          role: user.role || 'user',
          tenantId: user.tenantId || '',
          phone: sanitizedPhone,
          phoneCountryCode: countryCode,
          contactIds: user.chatbotContactIds || [],
          chatbotAccessStatus: user.chatbotAccessStatus || 'pending',
          status: user.status || 'invited',
          approvalStatus: user.approvalStatus || 'pending',
          approvalMessage: user.approvalMessage || '',
          approvedById: user.approvedById ?? undefined,
          invitedById: user.invitedById ?? undefined,
          profilePictureUrl: user.profilePictureUrl ?? null,
          preferredLanguage: user.preferredLanguage ?? undefined,
          timezone: user.timezone ?? undefined,
          departmentId: (user as any).departmentId ?? null,
          metadata: user.metadata ?? undefined,
        })
        setShowEditUser(true)
        console.log('[UserManagement] Edit modal should now be open, showEditUser set to true')
        void fetchTenants()
      } else {
        console.warn('[UserManagement] No user found in event detail')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('edit-user-from-tenant', handleEditUserFromTenant)
      return () => {
        window.removeEventListener('edit-user-from-tenant', handleEditUserFromTenant)
      }
    }
  }, [fetchTenants])

  const resetUserForm = () => {
    setUserForm(createEmptyUserPayload(actorTenantId))
  }

  const closeUserModals = () => {
    setShowCreateUser(false)
    setShowEditUser(false)
    setShowUserProfile(false)
    setSelectedUser(null)
    resetUserForm()
  }

  // Filter users based on search term and tenant filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Tenant filter
      if (selectedTenantFilter !== 'all') {
        if (selectedTenantFilter === 'no-tenant') {
          if (user.tenantId) return false
        } else if (user.tenantId !== selectedTenantFilter) {
          return false
        }
      }

      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase()
        const matchesName = user.name?.toLowerCase().includes(search)
        const matchesEmail = user.email?.toLowerCase().includes(search)
        const matchesPhone = user.phone?.toLowerCase().includes(search)

        if (!matchesName && !matchesEmail && !matchesPhone) {
          return false
        }
      }

      return true
    })
  }, [users, searchTerm, selectedTenantFilter])

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTenantFilter('all')
  }

  const sanitizePhoneValue = (value: string): string => {
    const trimmed = value?.trim() ?? ''
    if (!trimmed) {
      return ''
    }
    if (trimmed.startsWith('+')) {
      const digits = trimmed.slice(1).replace(/[^0-9]/g, '')
      return digits ? `+${digits}` : ''
    }
    return trimmed.replace(/[^0-9]/g, '')
  }

  const handleUserFormChange = (updates: Partial<CreateUserPayload>) => {
    setUserForm(prev => ({
      ...prev,
      ...updates,
    }))
  }

  const createUserDisabled =
    !userForm.name?.trim() ||
    !userForm.email?.trim() ||
    !userForm.password?.trim() ||
    !userForm.phone?.trim() ||
    !userForm.phoneCountryCode?.trim()

  // For updates, phone is optional - only validate if phone number is provided
  // If phone number exists, country code is required
  const hasPhoneNumber = Boolean(userForm.phone?.trim())
  const hasPhoneCountryCode = Boolean(userForm.phoneCountryCode?.trim())
  const updateUserDisabled =
    !userForm.name?.trim() ||
    !userForm.email?.trim() ||
    (hasPhoneNumber && !hasPhoneCountryCode) // If phone number is provided, country code is required
  
  // Debug logging for update button state
  useEffect(() => {
    if (showEditUser) {
      console.log('[UserManagement] Update button state:', {
        name: userForm.name?.trim(),
        email: userForm.email?.trim(),
        phone: userForm.phone?.trim(),
        phoneCountryCode: userForm.phoneCountryCode?.trim(),
        hasPhoneNumber,
        hasPhoneCountryCode,
        updateUserDisabled,
      })
    }
  }, [showEditUser, userForm.name, userForm.email, userForm.phone, userForm.phoneCountryCode, hasPhoneNumber, hasPhoneCountryCode, updateUserDisabled])

  const handleCreateUser = async () => {
    const trimmedPhone = sanitizePhoneValue(userForm.phone ?? '')
    const trimmedCountry = userForm.phoneCountryCode?.trim() ?? ''

    if (!trimmedPhone || !trimmedCountry) {
      toast.error('Teléfono requerido', 'Ingresa un número telefónico válido.')
      return
    }

    if (!isValidPhoneNumber(trimmedPhone, trimmedCountry)) {
      toast.error('Teléfono inválido', 'Verifica el código de país y el número ingresado.')
      return
    }

    const payload: CreateUserPayload = {
      ...userForm,
      phone: trimmedPhone,
      phoneCountryCode: trimmedCountry,
    }

    try {
      console.log('[UserManagement] Creating user with payload:', { ...payload, password: '[REDACTED]' })
      const result = await createUserRequest(payload)
      console.log('[UserManagement] User created successfully:', result)
      
      // Force refresh the user list
      await fetchUsers()
      
      // If tenant was assigned, dispatch event to refresh tenant counts
      if (payload.tenantId) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tenant-user-count-changed', {
            detail: { newTenantId: payload.tenantId }
          }))
        }
      }
      
      closeUserModals()
      toast.success('User created', `${userForm.name || userForm.email} created successfully.`)
    } catch (error) {
      console.error('Error creating user:', error)
      // Extract more detailed error message
      let message = 'Unable to create user'
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
      toast.error('User creation failed', message)
    }
  }

  const handleEditUser = (user: User) => {
    const trimmedPhone = user.phone?.trim() || ''
    let resolvedCountry = user.phoneCountryCode?.trim() || ''
    let resolvedPhone = trimmedPhone

    if (trimmedPhone.startsWith('+')) {
      const extracted = extractCountryCode(trimmedPhone)
      if (extracted.countryCode) {
        resolvedCountry = extracted.countryCode
      }
      resolvedPhone = extracted.phone
    }

    if (resolvedCountry) {
      const normalizedCode = resolvedCountry.startsWith('+')
        ? resolvedCountry
        : `+${resolvedCountry.replace(/[^0-9]/g, '')}`
      if (normalizedCode && resolvedPhone.startsWith(normalizedCode)) {
        resolvedPhone = resolvedPhone.slice(normalizedCode.length)
      }
    }

    const sanitizedPhone = sanitizePhoneValue(resolvedPhone)
    // Only set country code if there's a phone number, otherwise leave it empty (phone is optional for updates)
    const countryCode = sanitizedPhone ? (resolvedCountry || DEFAULT_COUNTRY.dialCode) : DEFAULT_COUNTRY.dialCode

    setSelectedUser(user)
    setUserForm({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role || 'user',
      tenantId: user.tenantId || '',
      phone: sanitizedPhone,
      phoneCountryCode: countryCode, // Always set a default country code even if phone is empty
      contactIds: user.chatbotContactIds || [],
      chatbotAccessStatus: user.chatbotAccessStatus || 'pending',
      status: user.status || 'invited',
      approvalStatus: user.approvalStatus || 'pending',
      approvalMessage: user.approvalMessage || '',
      approvedById: user.approvedById ?? undefined,
      invitedById: user.invitedById ?? undefined,
      profilePictureUrl: user.profilePictureUrl ?? null,
      preferredLanguage: user.preferredLanguage ?? undefined,
      timezone: user.timezone ?? undefined,
      departmentId: (user as any).departmentId ?? null,
      metadata: user.metadata ?? undefined,
    })
    setShowEditUser(true)
    void fetchTenants()
  }

  const handleManageContacts = (user: User) => {
    setSelectedUser(user)
    setShowUserProfile(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    const trimmedPhone = sanitizePhoneValue(userForm.phone ?? '')
    // Always ensure a country code is set - use form value or default
    let trimmedCountry = userForm.phoneCountryCode?.trim() || ''
    if (!trimmedCountry && trimmedPhone) {
      // If phone is provided but no country code, use default
      trimmedCountry = DEFAULT_COUNTRY.dialCode
    }

    // Only validate phone if it's provided (phone is optional for updates)
    if (trimmedPhone || trimmedCountry) {
      if (!trimmedPhone || !trimmedCountry) {
        toast.error('Teléfono inválido', 'Si proporcionas un teléfono, debes incluir tanto el número como el código de país.')
        return
      }

      if (!isValidPhoneNumber(trimmedPhone, trimmedCountry)) {
        toast.error('Teléfono inválido', 'Verifica el código de país y el número ingresado.')
        return
      }
    }

    try {
      const payload: UpdateUserRequestPayload = {
        // Core fields
        name: userForm.name?.trim() || null,
        email: userForm.email?.trim(),
        role: userForm.role,
        status: userForm.status,
        tenantId: userForm.tenantId || null,
        
        // Phone fields - always include country code if phone is provided
        phone: trimmedPhone || null,
        phoneCountryCode: trimmedPhone ? (trimmedCountry || null) : null,
        
        // Profile fields
        profilePictureUrl: userForm.profilePictureUrl || null,
        preferredLanguage: userForm.preferredLanguage || undefined,
        timezone: userForm.timezone || undefined,
        departmentId: userForm.departmentId || null,
        
        // Approval and access fields
        approvalStatus: userForm.approvalStatus,
        approvalMessage: userForm.approvalMessage?.trim() || null,
        approvedById: userForm.approvedById || undefined,
        invitedById: userForm.invitedById || undefined,
        chatbotAccessStatus: userForm.chatbotAccessStatus,
        
        // Contact assignments
        contactIds: userForm.contactIds || [],
        
        // Metadata
        metadata: userForm.metadata || undefined,
      }
      
      // Only include password if provided
      if (userForm.password?.trim()) {
        payload.password = userForm.password
      }
      
      console.log('[UserManagement] Updating user with payload:', {
        ...payload,
        password: payload.password ? '[REDACTED]' : undefined,
        contactIds: payload.contactIds?.length || 0,
      })

      const oldTenantId = selectedUser.tenantId
      await updateUserRequest(selectedUser.id, payload)
      await fetchUsers()
      
      // If tenant changed, dispatch event to refresh tenant counts
      const newTenantId = payload.tenantId
      if (oldTenantId !== newTenantId) {
        // Dispatch custom event to notify tenant management to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tenant-user-count-changed', {
            detail: { oldTenantId, newTenantId }
          }))
        }
      }
      
      closeUserModals()
      toast.success('User updated', `${userForm.name || selectedUser.email} updated successfully.`)
    } catch (error) {
      console.error('Error updating user:', error)
      const message = extractErrorMessage(error, 'Unable to update user')
      toast.error('User update failed', message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    const userName = user?.name || user?.email || 'User'
    const tenantId = user?.tenantId
    
    try {
      await deleteUserRequest(userId)
      await fetchUsers()
      
      // If user had a tenant, refresh tenant counts
      if (tenantId) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tenant-user-count-changed', {
            detail: { oldTenantId: tenantId }
          }))
        }
      }
      
      setSelectedUser(null)
      toast.success('User deleted', `${userName} has been deleted.`)
    } catch (error) {
      console.error('Error deleting user:', error)
      const message = extractErrorMessage(error, 'Unable to delete user')
      toast.error('User deletion failed', message)
    }
  }

  const handleRevokeSessions = async (userId: string) => {
    const userName = users.find(user => user.id === userId)?.name || users.find(user => user.id === userId)?.email || 'User'
    try {
      await revokeUserSessions(userId)
      await fetchUsers()
      toast.success('Sessions revoked', `All sessions for ${userName} have been revoked. They will need to log in again.`)
    } catch (error) {
      console.error('Error revoking sessions:', error)
      const message = extractErrorMessage(error, 'Unable to revoke sessions')
      toast.error('Session revocation failed', message)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const payload: UpdateUserRequestPayload = {
        approvalStatus: 'approved',
        chatbotAccessStatus: 'approved',
        approvedById: actorRole === 'super_admin' ? actorTenantId : undefined,
      }

      await updateUserRequest(userId, payload)
      await fetchUsers()
      toast.success('User approved', `${user.name || user.email} has been approved and granted chatbot access.`)
    } catch (error) {
      console.error('Error approving user:', error)
      const message = extractErrorMessage(error, 'Unable to approve user')
      toast.error('User approval failed', message)
    }
  }

  const handleDenyUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const payload: UpdateUserRequestPayload = {
        approvalStatus: 'rejected',
        chatbotAccessStatus: 'revoked',
        approvedById: actorRole === 'super_admin' ? actorTenantId : undefined,
      }

      await updateUserRequest(userId, payload)
      await fetchUsers()
      toast.success('User denied', `${user.name || user.email} has been denied access.`)
    } catch (error) {
      console.error('Error denying user:', error)
      const message = extractErrorMessage(error, 'Unable to deny user')
      toast.error('User denial failed', message)
    }
  }

  const handleRevokeAccess = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const payload: UpdateUserRequestPayload = {
        chatbotAccessStatus: 'revoked',
      }

      await updateUserRequest(userId, payload)
      await fetchUsers()
      toast.success('Access revoked', `${user.name || user.email}'s chatbot access has been revoked.`)
    } catch (error) {
      console.error('Error revoking access:', error)
      const message = extractErrorMessage(error, 'Unable to revoke access')
      toast.error('Access revocation failed', message)
    }
  }

  const handleUpdateContactAssignments = async (user: User, contactIds: string[]): Promise<boolean> => {
    try {
      setSavingAssignments(true)
      const payload: UpdateUserRequestPayload = {
        contactIds,
      }

      await updateUserRequest(user.id, payload)
      await fetchUsers()
      toast.success('Contacts updated', `${user.name || user.email}'s contact assignments have been updated.`)
      return true
    } catch (error) {
      console.error('Error updating contact assignments:', error)
      const message = extractErrorMessage(error, 'Unable to update contact assignments')
      toast.error('Contact assignment failed', message)
      return false
    } finally {
      setSavingAssignments(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">User Management</h2>
          <p className="text-sm text-gray-600">Create and manage users across all tenants</p>
          </div>
          <button
            onClick={() => {
              resetUserForm()
              setShowCreateUser(true)
                void fetchTenants()
            }}
            className="touch-target rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          Create New User
          </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                <span className="text-sm font-medium text-white">U</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Total Users</p>
              <p className="text-2xl font-bold text-black">{stats?.totalUsers ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
                <span className="text-sm font-medium text-white">A</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Active Sessions</p>
              <p className="text-2xl font-bold text-black">{stats?.activeSessions ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 sm:p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
                <span className="text-sm font-medium text-white">T</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Total Tenants</p>
              <p className="text-2xl font-bold text-black">{tenants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {loadingUsers && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Loading Users...</h3>
              <p className="mt-1 text-sm text-blue-700">Fetching user data...</p>
            </div>
          </div>
        </div>
      )}

      {usersError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
              <p className="mt-1 text-sm text-red-700">{usersError}</p>
              <button onClick={fetchUsers} className="mt-2 text-sm text-red-600 underline hover:text-red-500">
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="rounded-lg bg-white shadow p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tenant Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="tenant-filter" className="text-sm font-medium text-gray-700">
                Filter by Tenant:
              </label>
              <select
                id="tenant-filter"
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                className="block w-full min-w-[200px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tenants</option>
                {tenants
                  .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
                  .map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.displayName || tenant.name}
                    </option>
                  ))}
                <option value="no-tenant">Users without tenant</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedTenantFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Summary */}
        {(searchTerm || selectedTenantFilter !== 'all') && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: &ldquo;{searchTerm}&rdquo;
              </span>
            )}
            {selectedTenantFilter !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Tenant: {
                  selectedTenantFilter === 'no-tenant'
                    ? 'No tenant'
                    : tenants.find(t => t.id === selectedTenantFilter)?.displayName || tenants.find(t => t.id === selectedTenantFilter)?.name || selectedTenantFilter
                }
              </span>
            )}
            <span className="text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {(() => {
          // Group filtered users by tenant
          const usersByTenant = filteredUsers.reduce((acc, user) => {
            const tenantId = user.tenantId || 'no-tenant'
            if (!acc[tenantId]) {
              acc[tenantId] = []
            }
            acc[tenantId].push(user)
            return acc
          }, {} as Record<string, User[]>)

          // Sort tenants by name
          const sortedTenantIds = Object.keys(usersByTenant).sort((a, b) => {
            if (a === 'no-tenant') return 1
            if (b === 'no-tenant') return -1

            const tenantA = tenants.find(t => t.id === a)
            const tenantB = tenants.find(t => t.id === b)

            const nameA = tenantA?.displayName || tenantA?.name || a
            const nameB = tenantB?.displayName || tenantB?.name || b

            return nameA.localeCompare(nameB)
          })

          return sortedTenantIds.map(tenantId => {
            const tenantUsers = usersByTenant[tenantId]
            const tenant = tenants.find(t => t.id === tenantId)

            return (
              <div key={tenantId} className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-3">
                    {tenant?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tenant.logoUrl}
                        alt={`${tenant.displayName || tenant.name} logo`}
                        className="h-8 w-8 rounded-md object-contain"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                        <span className="text-xs font-semibold text-gray-600">
                          {(tenant?.displayName || tenant?.name || tenantId)?.[0]?.toUpperCase() || 'T'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {tenant?.displayName || tenant?.name || 'Users without tenant'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {tenantUsers.length} user{tenantUsers.length !== 1 ? 's' : ''} • {tenant?.domain ? `https://${tenant.domain}` : 'No domain'}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        tenant?.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tenant?.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {tenantUsers.map(user => (
                      <div key={user.id} className="rounded-lg border p-3 transition-shadow hover:shadow-md sm:p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="truncate text-sm font-medium text-gray-900">{user.name || 'No name'}</h4>
                            <p className="truncate text-xs text-gray-500">{user.email}</p>
                          </div>
                          <span
                            className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-1 text-xs font-medium ${
                              user.role === 'super_admin'
                                ? 'bg-red-100 text-red-800'
                                : user.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        {user.phone ? (
                          <p className="text-xs text-gray-500">Phone: {user.phone}</p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            user.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : user.approvalStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : user.approvalStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.approvalStatus}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            user.chatbotAccessStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : user.chatbotAccessStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : user.chatbotAccessStatus === 'revoked'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            Access: {user.chatbotAccessStatus}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="touch-target rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
                          >
                            Edit
                          </button>

                          {/* Approval buttons for pending users */}
                          {user.approvalStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="touch-target rounded bg-green-100 px-2 py-1 text-xs text-green-800 hover:bg-green-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDenyUser(user.id)}
                                className="touch-target rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 hover:bg-orange-200"
                              >
                                Deny
                              </button>
                            </>
                          )}

                          {/* Revoke button for approved users */}
                          {user.chatbotAccessStatus === 'approved' && (
                            <button
                              onClick={() => handleRevokeAccess(user.id)}
                              className="touch-target rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 hover:bg-yellow-200"
                            >
                              Revoke Access
                            </button>
                          )}

                          {/* Manage contacts button */}
                          <button
                            onClick={() => handleManageContacts(user)}
                            className="touch-target rounded bg-purple-100 px-2 py-1 text-xs text-purple-800 hover:bg-purple-200"
                          >
                            Manage Contacts
                          </button>

                          <button
                            onClick={() => handleRevokeSessions(user.id)}
                            className="touch-target rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 hover:bg-orange-200"
                          >
                            End Sessions
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="touch-target rounded bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        })()}
      </div>

      {tenantsError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Unable to load tenant details. Tenant selection may be incomplete.
        </div>
      )}

      <UserFormModal
        title="Create New User"
        confirmLabel="Create User"
        isOpen={showCreateUser}
        user={userForm}
        tenants={tenants}
        onChange={handleUserFormChange}
        onClose={closeUserModals}
        onSubmit={handleCreateUser}
        submitDisabled={createUserDisabled}
        passwordPlaceholder="Enter password"
        isSuperAdmin={isSuperAdmin}
      />

      <UserFormModal
        title="Edit User"
        confirmLabel="Update User"
        isOpen={showEditUser && Boolean(selectedUser)}
        user={userForm}
        tenants={tenants}
        onChange={handleUserFormChange}
        onClose={closeUserModals}
        onSubmit={handleUpdateUser}
        submitDisabled={updateUserDisabled}
        passwordPlaceholder="Leave blank to keep current password"
        isSuperAdmin={isSuperAdmin}
      />

      <UserProfileDrawer
        user={selectedUser}
        isOpen={showUserProfile && Boolean(selectedUser)}
        onClose={closeUserModals}
        onUpdateAssignments={handleUpdateContactAssignments}
        isSavingAssignments={savingAssignments}
        focus="assignments"
      />
    </div>
  )
}

interface UserProfileDrawerProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUpdateAssignments: (user: User, contactIds: string[]) => Promise<boolean>
  isSavingAssignments: boolean
  focus: 'overview' | 'assignments'
}

export function UserProfileDrawer({ user, isOpen, onClose, onUpdateAssignments, isSavingAssignments, focus }: UserProfileDrawerProps) {
  const assignmentSectionRef = useRef<HTMLDivElement | null>(null)
  const [tenantContacts, setTenantContacts] = useState<TenantChatContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(() => user?.chatbotContactIds || [])

  useEffect(() => {
    if (!user) {
      setSelectedContactIds([])
      return
    }

    setSelectedContactIds(prev => {
      const next = user.chatbotContactIds || []
      const prevSet = new Set(prev)
      const nextSet = new Set(next)
      if (prevSet.size === nextSet.size && Array.from(nextSet).every((id: string) => prevSet.has(id))) {
        return prev
      }
      return next
    })
  }, [user])

  useEffect(() => {
    setSearchTerm('')
  }, [user])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!user) {
      setTenantContacts([])
      setContactsError(null)
      setContactsLoading(false)
      return
    }

    const tenantId = user.tenantId?.trim()
    if (!tenantId) {
      setTenantContacts([])
      setContactsError('Este usuario no tiene un tenant asignado.')
      setContactsLoading(false)
      return
    }

    let active = true
    setContactsLoading(true)
    setContactsError(null)

    getTenantChatContacts(tenantId)
      .then(contacts => {
        if (!active) {
          return
        }
        setTenantContacts(contacts.filter(contact => !contact.isFlowbot))
      })
      .catch(error => {
        if (!active) {
          return
        }
        const message = error instanceof Error ? error.message : 'No se pudieron cargar las listas del tenant'
        setContactsError(message)
        setTenantContacts([])
      })
      .finally(() => {
        if (active) {
          setContactsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isOpen, user])

  useEffect(() => {
    if (!isOpen || focus !== 'assignments') {
      return
    }
    if (assignmentSectionRef.current) {
      assignmentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [focus, isOpen])

  const availableAssignments = useMemo(() => tenantContacts.filter(contact => !contact.isFlowbot), [tenantContacts])

  const contactsByType = useMemo(() => {
    return {
      contacts: availableAssignments.filter(contact => contact.type === 'CONTACT'),
      groups: availableAssignments.filter(contact => contact.type === 'GROUP'),
    }
  }, [availableAssignments])

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return contactsByType
    }
    return {
      contacts: contactsByType.contacts.filter(contact => contact.displayName.toLowerCase().includes(query)),
      groups: contactsByType.groups.filter(contact => contact.displayName.toLowerCase().includes(query)),
    }
  }, [contactsByType, searchTerm])

  const originalContactIds = useMemo(() => user?.chatbotContactIds || [], [user])

  const hasChanges = useMemo(() => {
    const originalSet = new Set(originalContactIds)
    if (selectedContactIds.length !== originalSet.size) {
      return true
    }
    for (const id of selectedContactIds) {
      if (!originalSet.has(id)) {
        return true
      }
    }
    for (const id of originalContactIds) {
      if (!selectedContactIds.includes(id)) {
        return true
      }
    }
    return false
  }, [originalContactIds, selectedContactIds])

  const summaryAssignments = useMemo(() => {
    if (!user) {
      return []
    }

    if (availableAssignments.length) {
      const map = new Map(availableAssignments.map(contact => [contact.id, contact]))
      return selectedContactIds
        .map(id => map.get(id))
        .filter((value): value is TenantChatContact => Boolean(value))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
    }

    return (user.chatbotContacts ?? []).map(contact => ({
      id: contact.id,
      tenantId: (contact as any).tenantId ?? user.tenantId ?? '',
      type: (contact.type as TenantChatContact['type']) || 'CONTACT',
      displayName: contact.displayName,
      phone: (contact as any).phone ?? null,
      description: (contact as any).description ?? null,
      avatarUrl: (contact as any).avatarUrl ?? null,
      isFlowbot: Boolean((contact as any).isFlowbot),
    }))
  }, [availableAssignments, selectedContactIds, user])

  const totalAvailable = availableAssignments.length
  const assignedCount = selectedContactIds.length
  const filteredCount = filteredAssignments.contacts.length + filteredAssignments.groups.length
  const assignmentsDisabled = !user?.normalizedPhone && !user?.phone
  const disableSelection = assignmentsDisabled || isSavingAssignments
  const disableSave = assignmentsDisabled || !hasChanges || isSavingAssignments
  const hasTenant = Boolean(user?.tenantId?.trim())
  const showEmptyState = hasTenant && !contactsLoading && !contactsError && totalAvailable === 0

  const handleAssignmentToggle = (contactId: string, checked: boolean) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(contactId)
      } else {
        next.delete(contactId)
      }
      return Array.from(next)
    })
  }

  const handleSelectFiltered = () => {
    setSelectedContactIds(prev => {
      const next = new Set(prev)
      filteredAssignments.contacts.forEach(contact => next.add(contact.id))
      filteredAssignments.groups.forEach(contact => next.add(contact.id))
      return Array.from(next)
    })
  }

  const handleClearAll = () => {
    setSelectedContactIds([])
  }

  const handleResetAssignments = () => {
    setSelectedContactIds([...originalContactIds])
  }

  const handleSaveAssignments = async () => {
    if (!user || disableSave) {
      return
    }
    const success = await onUpdateAssignments(user, selectedContactIds)
    if (success) {
      setSearchTerm('')
    }
  }

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return 'Nunca'
    try {
      return new Date(value).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return value
    }
  }

  if (!isOpen || !user) {
    return null
  }

  const accessStatus = user.chatbotAccessStatus || 'pending'
  const statusLabel = accessStatus === 'approved' ? 'Aprobado' : accessStatus === 'revoked' ? 'Revocado' : 'Pendiente'
  const statusColor = accessStatus === 'approved' ? 'text-green-700' : accessStatus === 'revoked' ? 'text-red-700' : 'text-yellow-700'
  const tenantLabel = user.tenantName || user.tenantId || 'Sin tenant'
  const avatarInitial = (user.name?.[0] || user.email?.[0] || '?').toUpperCase()

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
              {user.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.name || user.email || 'Usuario'}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name || 'Sin nombre'}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-4rem)]">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <section className="space-y-6">
              <div>
                  <h4 className="text-sm font-semibold text-gray-800">Información básica</h4>
                  <dl className="mt-3 space-y-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Estado de aprobación</dt>
                      <dd className={`mt-0.5 font-medium ${statusColor}`}>{statusLabel}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Rol</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{user.role || 'Sin rol'}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Estado de usuario</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{user.status || 'Sin estado'}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Última actividad</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{formatDateTime(user.lastChatbotInteractionAt)}</dd>
              </div>
                  </dl>
                </div>

              <div>
                  <h4 className="text-sm font-semibold text-gray-800">Acceso al chatbot</h4>
                  <dl className="mt-3 space-y-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Estado de acceso</dt>
                      <dd className={`mt-0.5 font-medium ${statusColor}`}>{statusLabel}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Aprobado el</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{formatDateTime(user.chatbotApprovedAt)}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Revocado el</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{formatDateTime(user.chatbotRevokedAt)}</dd>
              </div>
            </dl>
                </div>
          </section>

              <section className="space-y-6">
              <div>
                  <h4 className="text-sm font-semibold text-gray-800">Información de contacto</h4>
                  <dl className="mt-3 space-y-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{user.email}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Teléfono</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">
                        {user.phone || 'No registrado'}
                        {user.phoneCountryCode && user.phone ? ` (${user.phoneCountryCode})` : ''}
                      </dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Tenant</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">{tenantLabel}</dd>
              </div>
              <div>
                      <dt className="text-xs uppercase tracking-wide text-gray-500">Teléfono OTP</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">
                        {user.normalizedPhone || user.phone || 'No registrado'}
                        {user.phoneCountryCode && (user.normalizedPhone || user.phone) ? ` (${user.phoneCountryCode})` : ''}
                      </dd>
              </div>
            </dl>
                </div>
          </section>
            </div>

            <section
              ref={assignmentSectionRef}
              className={`mt-6 rounded-lg border p-4 transition ${
                focus === 'assignments' ? 'border-blue-300 shadow-sm ring-1 ring-blue-200 ring-offset-1' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                  <h4 className="text-sm font-semibold text-gray-800">Listas y grupos asignados</h4>
                  <p className="text-xs text-gray-500">
                    Gestiona los accesos del usuario a listas de difusión y grupos del chatbot.
                  </p>
              </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Asignados: {assignedCount}
                  </span>
                  <span className="text-xs text-gray-400">Disponibles: {totalAvailable}</span>
              </div>
              </div>

              {assignmentsDisabled ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Agrega un teléfono OTP para habilitar la asignación de listas.
              </div>
            ) : null}

              {summaryAssignments.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {summaryAssignments.map(contact => (
                  <span
                    key={contact.id}
                      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                  >
                    {contact.displayName}
                  </span>
                ))}
              </div>
            ) : (
                <p className="mt-4 text-sm text-gray-500">Sin listas asignadas.</p>
              )}

              <div className="mt-4">
                {contactsLoading ? (
                  <p className="text-xs text-gray-500">Cargando listas y grupos…</p>
                ) : contactsError ? (
                  <p className="text-xs text-rose-600">{contactsError}</p>
                ) : showEmptyState ? (
                  <p className="text-xs text-gray-500">No hay listas ni grupos disponibles para este tenant.</p>
                ) : hasTenant ? (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-gray-600">
                        {filteredCount === totalAvailable
                          ? `Mostrando ${totalAvailable} elementos`
                          : `Mostrando ${filteredCount} de ${totalAvailable} elementos`}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <input
                          type="search"
                          value={searchTerm}
                          onChange={event => setSearchTerm(event.target.value)}
                          placeholder="Buscar listas o grupos"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:w-64"
                          disabled={disableSelection}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSelectFiltered}
                            disabled={disableSelection || filteredCount === 0}
                            className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Seleccionar visibles
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={disableSelection || assignedCount === 0}
                            className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">Listas</p>
                        {filteredAssignments.contacts.length ? (
                          <div className="mt-2 space-y-2">
                            {filteredAssignments.contacts.map(contact => {
                              const checked = selectedContactIds.includes(contact.id)
                              return (
                                <label
                                  key={contact.id}
                                  className={`flex items-center gap-2 rounded-md border px-2 py-2 text-sm transition ${
                                    checked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={disableSelection}
                                    checked={checked}
                                    onChange={event => handleAssignmentToggle(contact.id, event.target.checked)}
                                  />
                                  <span className="flex-1 truncate">{contact.displayName}</span>
                                </label>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-500">
                            {searchTerm.trim() ? 'Sin coincidencias para este filtro.' : 'No hay listas disponibles.'}
                          </p>
                        )}
              </div>
              <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">Grupos</p>
                        {filteredAssignments.groups.length ? (
                          <div className="mt-2 space-y-2">
                            {filteredAssignments.groups.map(contact => {
                              const checked = selectedContactIds.includes(contact.id)
                              return (
                                <label
                                  key={contact.id}
                                  className={`flex items-center gap-2 rounded-md border px-2 py-2 text-sm transition ${
                                    checked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={disableSelection}
                                    checked={checked}
                                    onChange={event => handleAssignmentToggle(contact.id, event.target.checked)}
                                  />
                                  <span className="flex-1 truncate">{contact.displayName}</span>
                                </label>
                              )
                            })}
              </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-500">
                            {searchTerm.trim() ? 'Sin coincidencias para este filtro.' : 'No hay grupos disponibles.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Asigna primero un tenant para gestionar listas.</p>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleResetAssignments}
                  disabled={disableSelection || !hasChanges}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Revertir cambios
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={disableSave}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingAssignments ? 'Guardando…' : 'Guardar asignación'}
                </button>
              </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  )
}
