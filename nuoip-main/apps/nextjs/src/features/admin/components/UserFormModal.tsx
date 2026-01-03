import Image from 'next/image'
import type { CreateUserPayload, Tenant, TenantChatContact, DepartmentRecord } from '@/features/admin/api/admin-api'
import { getTenantChatContacts, getTenantDepartments } from '@/features/admin/api/admin-api'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { toast } from '@/stores'
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY } from '@/lib/utils/phone'

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
const ACCESS_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'revoked', label: 'Revocado' },
]

const APPROVAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
]

const USER_STATUS_OPTIONS = [
  { value: 'invited', label: 'Invitado' },
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'inactive', label: 'Inactivo' },
]

const ACCEPTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_AVATAR_SIZE = 3 * 1024 * 1024

interface UserFormModalProps {
  title: string
  confirmLabel: string
  isOpen: boolean
  user: CreateUserPayload
  tenants: Tenant[]
  isSuperAdmin: boolean
  lockedTenantId?: string | null
  lockedTenantName?: string | null
  onChange: (updates: Partial<CreateUserPayload>) => void
  onClose: () => void
  onSubmit: () => void
  submitDisabled: boolean
  passwordPlaceholder?: string
}

export function UserFormModal({
  title,
  confirmLabel,
  isOpen,
  user,
  tenants,
  isSuperAdmin,
  lockedTenantId,
  lockedTenantName,
  onChange,
  onClose,
  onSubmit,
  submitDisabled,
  passwordPlaceholder,
}: UserFormModalProps) {
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>(DEFAULT_COUNTRY.isoCode)
  const [isCustomCountry, setIsCustomCountry] = useState(false)
  const [customCountryCode, setCustomCountryCode] = useState<string>('')
  const [availableContacts, setAvailableContacts] = useState<TenantChatContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find(option => option.isoCode === selectedCountryIso),
    [selectedCountryIso],
  )
  const selectedFlag = isCustomCountry ? '🏳️' : selectedCountry?.flag ?? '🏳️'

  const sanitizeCountryCode = useCallback((raw: string): string => {
    if (!raw) {
      return '+'
    }
    let value = raw.trim()
    if (!value) {
      return '+'
    }
    if (!value.startsWith('+')) {
      value = `+${value}`
    }
    value = `+${value.slice(1).replace(/[^0-9]/g, '')}`
    return value === '+' ? '+' : value
  }, [])

  const confirmDisabled = submitDisabled || uploadingAvatar

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Formato no soportado', 'Sube una imagen PNG, JPG o WEBP.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Imagen demasiado grande', 'La foto debe pesar menos de 3MB.')
      event.target.value = ''
      return
    }

    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = getAuthToken()
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/admin/users/profile-picture', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Upload failed')
      }

      const result = await response.json()
      const nextUrl = typeof result?.url === 'string' ? result.url : null

      if (!nextUrl) {
        throw new Error('Respuesta inválida del servidor')
      }

      onChange({ profilePictureUrl: nextUrl })
      toast.success('Foto actualizada', 'La foto de perfil se guardó correctamente.')
    } catch (error) {
      console.error('Profile photo upload failed', error)
      toast.error('Error al subir foto', error instanceof Error ? error.message : 'No se pudo subir la foto de perfil')
    } finally {
      setUploadingAvatar(false)
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveProfilePhoto = () => {
    if (user.profilePictureUrl) {
      onChange({ profilePictureUrl: null })
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setAvailableContacts([])
      setContactsError(null)
      setContactsLoading(false)
      setContactSearch('')
      setUploadingAvatar(false)
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
      return
    }

    const providedCode = user.phoneCountryCode?.trim()
    if (!providedCode) {
      setSelectedCountryIso(DEFAULT_COUNTRY.isoCode)
      setIsCustomCountry(false)
      setCustomCountryCode('')
      return
    }

    const match = COUNTRY_OPTIONS.find(option => option.dialCode === providedCode)
    if (match) {
      setSelectedCountryIso(match.isoCode)
      setIsCustomCountry(false)
      setCustomCountryCode('')
    } else {
      setSelectedCountryIso('CUSTOM')
      setIsCustomCountry(true)
      setCustomCountryCode(sanitizeCountryCode(providedCode))
    }
  }, [isOpen, sanitizeCountryCode, user.phoneCountryCode])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!isSuperAdmin && lockedTenantId && user.tenantId !== lockedTenantId) {
      onChange({ tenantId: lockedTenantId })
    }
  }, [isOpen, isSuperAdmin, lockedTenantId, onChange, user.tenantId])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!user.tenantId) {
      setAvailableContacts([])
      setContactsError(null)
      setContactSearch('')
      return
    }

    let active = true
    setContactsLoading(true)
    setContactsError(null)

    getTenantChatContacts(user.tenantId)
      .then(contacts => {
        if (!active) {
          return
        }
        setAvailableContacts(contacts.filter(contact => !contact.isFlowbot))
        setContactsError(null)
      })
      .catch(error => {
        if (!active) {
          return
        }
        console.error('Failed to load tenant chat contacts:', error)
        // Extract error message, handling both Error objects and string responses
        let message = 'Unable to load contacts'
        if (error instanceof Error) {
          message = error.message || message
          // If message contains HTML, it's likely an error page - use a generic message
          if (message.includes('<!DOCTYPE') || message.includes('<html')) {
            message = 'Failed to load contacts. Please try again later.'
          }
        } else if (typeof error === 'string') {
          // If error is a string and contains HTML, use generic message
          if (error.includes('<!DOCTYPE') || error.includes('<html')) {
            message = 'Failed to load contacts. Please try again later.'
          } else {
            message = error
          }
        }
        setContactsError(message)
        setAvailableContacts([])
      })
      .finally(() => {
        if (active) {
          setContactsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isOpen, user.tenantId])

  useEffect(() => {
    if (!isOpen) return
    if (!user.tenantId) {
      setDepartments([])
      return
    }
    let active = true
    getTenantDepartments(user.tenantId)
      .then(list => { if (active) setDepartments(list) })
      .catch(() => { if (active) setDepartments([]) })
    return () => { active = false }
  }, [isOpen, user.tenantId])

  const contactOptions = useMemo(() => {
    return {
      contacts: availableContacts.filter(contact => contact.type === 'CONTACT'),
      groups: availableContacts.filter(contact => contact.type === 'GROUP'),
    }
  }, [availableContacts])

  const filteredContactOptions = useMemo(() => {
    const query = contactSearch.trim().toLowerCase()
    if (!query) {
      return contactOptions
    }

    return {
      contacts: contactOptions.contacts.filter(contact => contact.displayName.toLowerCase().includes(query)),
      groups: contactOptions.groups.filter(contact => contact.displayName.toLowerCase().includes(query)),
    }
  }, [contactOptions, contactSearch])

  const selectedContactIds = useMemo(() => user.contactIds ?? [], [user.contactIds])

  const handleContactToggle = (contactId: string, checked: boolean) => {
    const next = new Set(selectedContactIds)
    if (checked) {
      next.add(contactId)
    } else {
      next.delete(contactId)
    }
    onChange({ contactIds: Array.from(next) })
  }

  const handleSelectFiltered = useCallback(() => {
    const next = new Set(selectedContactIds)
    filteredContactOptions.contacts.forEach(contact => next.add(contact.id))
    filteredContactOptions.groups.forEach(contact => next.add(contact.id))
    onChange({ contactIds: Array.from(next) })
  }, [filteredContactOptions, selectedContactIds, onChange])

  const handleClearAll = useCallback(() => {
    if (selectedContactIds.length) {
      onChange({ contactIds: [] })
    }
  }, [selectedContactIds, onChange])

  const handleCountryChange = (value: string) => {
    if (value === 'CUSTOM') {
      const nextCode = sanitizeCountryCode(customCountryCode || '+')
      setIsCustomCountry(true)
      setSelectedCountryIso('CUSTOM')
      setCustomCountryCode(nextCode)
      onChange({ phoneCountryCode: nextCode })
      return
    }

    const match = COUNTRY_OPTIONS.find(option => option.isoCode === value)
    if (match) {
      setIsCustomCountry(false)
      setSelectedCountryIso(match.isoCode)
      setCustomCountryCode('')
      onChange({ phoneCountryCode: match.dialCode })
    }
  }

  const handleCustomCountryChange = (raw: string) => {
    const value = sanitizeCountryCode(raw)
    setCustomCountryCode(value)
    onChange({ phoneCountryCode: value })
  }

  const handlePhoneInputChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    onChange({ phone: digits })
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Close modal when clicking overlay
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="mobile-scroll relative w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 text-black shadow-xl sm:p-6" 
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation()
        }}
      >
        <h3 className="text-lg font-medium text-black">{title}</h3>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-gray-200 p-4 text-black">
            <h4 className="text-sm font-semibold text-black">Foto de perfil</h4>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-black">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-100 shadow-inner">
                  {user.profilePictureUrl ? (
                    <Image
                      src={user.profilePictureUrl}
                      alt={user.name || user.email}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-black">
                      {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-black">
                  JPG, PNG o WEBP · Máximo 3MB
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <label
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ring-1 transition-colors ${
                    uploadingAvatar
                      ? 'cursor-not-allowed bg-blue-100 text-blue-400 ring-blue-100'
                      : 'cursor-pointer bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleProfilePhotoChange}
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? 'Subiendo…' : 'Subir nueva foto'}
                </label>
                {user.profilePictureUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePhoto}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Quitar foto
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-name">
              Name
            </label>
            <input
              id="user-name"
              type="text"
              value={user.name || ''}
              onChange={(event) => onChange({ name: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
              placeholder="Enter user name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-department">
              Department
            </label>
            <select
              id="user-department"
              value={user.departmentId || ''}
              onChange={(e) => onChange({ departmentId: e.target.value || null })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">General</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              value={user.email}
              onChange={(event) => onChange({ email: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
              placeholder="Enter user email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-password">
              Password
            </label>
            <input
              id="user-password"
              type="password"
              value={user.password}
              onChange={(event) => onChange({ password: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
              placeholder={passwordPlaceholder || 'Enter password'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-phone">
              Phone (OTP verification)
            </label>
            <div className="mt-1 space-y-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                  {selectedFlag}
                </span>
                <select
                  id="user-phone-country"
                  value={isCustomCountry ? 'CUSTOM' : selectedCountryIso}
                  onChange={event => handleCountryChange(event.target.value)}
                  className="touch-target w-full rounded-md border border-gray-300 bg-white pl-9 pr-8 py-3 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COUNTRY_OPTIONS.map(option => (
                    <option key={option.isoCode} value={option.isoCode}>
                      {`${option.dialCode} · ${option.label}`}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom…</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-black">
                  ▼
                </span>
              </div>
              {isCustomCountry && (
                <input
                  id="user-phone-country-custom"
                  type="text"
                  value={customCountryCode}
                  onChange={event => handleCustomCountryChange(event.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+51"
                />
              )}
              <input
                id="user-phone"
                type="tel"
                value={user.phone || ''}
                onChange={event => handlePhoneInputChange(event.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
                placeholder="Phone number (without country code)"
              />
            </div>
            <p className="mt-1 text-xs text-black">
              Used for chatbot OTP authentication. Leave blank to keep existing phone.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              value={user.role || 'user'}
              onChange={(event) => onChange({ role: event.target.value })}
          disabled={!isSuperAdmin}
          className={`mt-1 block w-full rounded-md border px-3 py-3 touch-target text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            isSuperAdmin ? 'border-gray-300 bg-white' : 'cursor-not-allowed border-gray-200 bg-gray-100'
          }`}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
        {!isSuperAdmin && (
          <p className="mt-1 text-xs text-black">Only system administrators can change user roles.</p>
        )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-chatbot-status">
              Estado de acceso al chatbot
            </label>
            <select
              id="user-chatbot-status"
              value={user.chatbotAccessStatus || 'pending'}
              onChange={event => onChange({ chatbotAccessStatus: event.target.value as CreateUserPayload['chatbotAccessStatus'] })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
            >
              {ACCESS_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-black">
              Solo los usuarios con estado <span className="font-semibold">Aprobado</span> podrán iniciar sesión en el chatbot.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-approval-status">
              Estado de aprobación interna
            </label>
            <select
              id="user-approval-status"
              value={user.approvalStatus || 'pending'}
              onChange={event => onChange({ approvalStatus: event.target.value as CreateUserPayload['approvalStatus'] })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
            >
              {APPROVAL_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-black">
              Controla si este usuario tiene autorización para operar dentro del tenant.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-status">
              Estado del usuario
            </label>
            <select
              id="user-status"
              value={user.status || 'invited'}
              onChange={event => onChange({ status: event.target.value as CreateUserPayload['status'] })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
            >
              {USER_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-black">
              El estado <span className="font-semibold">Activo</span> habilita el acceso al dashboard. Suspender evita que inicie sesión sin borrar al usuario.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-approval-message">
              Mensaje para el solicitante (opcional)
            </label>
            <textarea
              id="user-approval-message"
              value={user.approvalMessage ?? ''}
              onChange={event => onChange({ approvalMessage: event.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
              placeholder="Comparte detalles sobre la decisión o próximos pasos"
            />
            <p className="mt-1 text-xs text-black">
              Se incluirá en las notificaciones de aprobación o rechazo enviadas al usuario.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-black" htmlFor="user-tenant">
              Tenant
            </label>
        {isSuperAdmin ? (
          <select
            id="user-tenant"
            value={user.tenantId || ''}
            onChange={event => onChange({ tenantId: event.target.value, contactIds: [] })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 touch-target"
          >
            <option value="">Select Tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-black">
            {lockedTenantName || lockedTenantId || 'Sin tenant asignado'}
          </div>
        )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black">Contact access</label>
            {!user.tenantId ? (
              <p className="mt-1 text-xs text-black">Select a tenant to manage contact permissions.</p>
            ) : contactsLoading ? (
              <p className="mt-1 text-xs text-black">Loading contacts…</p>
            ) : contactsError ? (
              <p className="mt-1 text-xs text-red-600">{contactsError}</p>
            ) : availableContacts.length === 0 ? (
              <p className="mt-1 text-xs text-black">No contacts or groups available for this tenant.</p>
            ) : (
              <div className="mt-2 space-y-3 rounded-md border border-gray-200 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-black">
                    Seleccionados: <span className="font-semibold text-black">{selectedContactIds.length}</span> de{' '}
                    {availableContacts.length}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <input
                      type="search"
                      value={contactSearch}
                      onChange={event => setContactSearch(event.target.value)}
                      placeholder="Buscar contactos o grupos"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectFiltered}
                        disabled={filteredContactOptions.contacts.length + filteredContactOptions.groups.length === 0}
                        className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Seleccionar filtrados
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        disabled={selectedContactIds.length === 0}
                        className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                {filteredContactOptions.contacts.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-black">Contacts</p>
                    <div className="mt-2 space-y-2">
                      {filteredContactOptions.contacts.map(contact => (
                        <label key={contact.id} className="flex items-center gap-2 text-sm text-black">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={event => handleContactToggle(contact.id, event.target.checked)}
                          />
                          <span>{contact.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : contactSearch.trim() && contactOptions.contacts.length ? (
                  <p className="text-xs text-black">No se encontraron contactos con este filtro.</p>
                ) : null}

                {filteredContactOptions.groups.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-black">Groups</p>
                    <div className="mt-2 space-y-2">
                      {filteredContactOptions.groups.map(contact => (
                        <label key={contact.id} className="flex items-center gap-2 text-sm text-black">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={event => handleContactToggle(contact.id, event.target.checked)}
                          />
                          <span>{contact.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : contactSearch.trim() && contactOptions.groups.length ? (
                  <p className="text-xs text-black">No se encontraron grupos con este filtro.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 touch-target"
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
                console.warn('Submit disabled:', { submitDisabled, uploadingAvatar, confirmDisabled })
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
