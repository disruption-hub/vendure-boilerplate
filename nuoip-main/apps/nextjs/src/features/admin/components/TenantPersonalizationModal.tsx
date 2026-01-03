import type { FormEvent } from 'react'
import type { Tenant } from '@/features/admin/api/admin-api'
import type { TenantPersonalization } from '@/lib/tenant/personalization'
import { themes, type ThemeName } from '@/lib/design-tokens'
import { adminThemeOptions, type AdminThemeName } from '@/lib/design-tokens/admin-dashboard-tokens'

interface TenantPersonalizationModalProps {
  isOpen: boolean
  tenant: Tenant | null
  form: TenantPersonalization
  error: string | null
  loading: boolean
  saving: boolean
  onChange: (form: TenantPersonalization) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

export function TenantPersonalizationModal({
  isOpen,
  tenant,
  form,
  error,
  loading,
  saving,
  onChange,
  onClose,
  onSubmit,
}: TenantPersonalizationModalProps) {
  if (!isOpen || !tenant) return null

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'fr', label: 'French' },
  ]

  const styleOptions: Array<{ value: TenantPersonalization['style']; label: string }> = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'technical', label: 'Technical' },
  ]

  const toneOptions: Array<{ value: TenantPersonalization['tone']; label: string }> = [
    { value: 'formal', label: 'Formal' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'casual', label: 'Casual' },
  ]

  const chatThemeOptions: Array<{ value: ThemeName; label: string }> = (
    Object.keys(themes) as ThemeName[]
  ).map(themeName => ({
    value: themeName,
    label: `${themeName.charAt(0).toUpperCase()}${themeName.slice(1)}`,
  }))

  const updateForm = (updates: Partial<TenantPersonalization>) => {
    onChange({
      ...form,
      ...updates,
    })
  }

  const updateMemory = (updates: Partial<TenantPersonalization['memory']>) => {
    updateForm({
      memory: {
        ...form.memory,
        ...updates,
      },
    })
  }

  const updateThemePreferences = (updates: Partial<TenantPersonalization['themePreferences']>) => {
    updateForm({
      themePreferences: {
        ...form.themePreferences,
        ...updates,
      },
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
        className="mobile-scroll relative w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 text-black shadow-xl sm:p-6" 
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation()
        }}
      >
        <h3 className="text-lg font-medium text-black">Customize Chatbot Experience</h3>
        <p className="mb-4 text-sm text-black">
          Personalize the greeting, communication style, and memory preferences for {tenant.name}.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black" htmlFor="personalization-greeting">
                Greeting Message
              </label>
              <textarea
                id="personalization-greeting"
                value={form.greeting || ''}
                onChange={(event) => updateForm({ greeting: event.target.value })}
                className="mobile-scroll mt-1 block h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter greeting message"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-black" htmlFor="personalization-language">
                  Preferred Language
                </label>
                <select
                  id="personalization-language"
                  value={form.language || 'en'}
                  onChange={(event) => updateForm({ language: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black" htmlFor="personalization-style">
                  Language Style
                </label>
                <select
                  id="personalization-style"
                  value={form.style || 'professional'}
                  onChange={(event) =>
                    updateForm({ style: event.target.value as TenantPersonalization['style'] })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {styleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black" htmlFor="personalization-tone">
                  Tone
                </label>
                <select
                  id="personalization-tone"
                  value={form.tone || 'neutral'}
                  onChange={(event) =>
                    updateForm({ tone: event.target.value as TenantPersonalization['tone'] })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black" htmlFor="personalization-summary">
                Summary Format
              </label>
              <input
                id="personalization-summary"
                type="text"
                value={form.summaryFormat || ''}
                onChange={(event) => updateForm({ summaryFormat: event.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter summary format"
              />
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-black">Memory Controls</h4>
                  <p className="text-xs text-black">Adjust how FlowBot retains and recalls conversations.</p>
                </div>
                <label className="flex cursor-pointer items-center">
                  <span className="mr-2 text-xs text-black">Disabled</span>
                  <input
                    type="checkbox"
                    checked={form.memory?.enabled ?? false}
                    onChange={(event) => updateMemory({ enabled: event.target.checked })}
                    className="h-4 w-8 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs text-black">Enabled</span>
                </label>
              </div>

              {form.memory?.enabled && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-black" htmlFor="retention-days">
                      Retention Days
                    </label>
                    <input
                      id="retention-days"
                      type="number"
                      min={0}
                      value={form.memory?.retentionDays ?? 0}
                      onChange={(event) =>
                        updateMemory({ retentionDays: Number(event.target.value) })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black" htmlFor="summary-threshold">
                      Summary Threshold
                    </label>
                    <input
                      id="summary-threshold"
                      type="number"
                      min={0}
                      value={form.memory?.summaryThreshold ?? 0}
                      onChange={(event) =>
                        updateMemory({ summaryThreshold: Number(event.target.value) })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <h4 className="text-sm font-medium text-black">Theme Preferences</h4>
              <p className="text-xs text-black">
                Choose distinct visual systems for the customer-facing chatbot and the administrative dashboard.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-black" htmlFor="chat-theme">
                    Chatbot Theme
                  </label>
                  <select
                    id="chat-theme"
                    value={form.themePreferences?.chat ?? 'dark'}
                    onChange={event =>
                      updateThemePreferences({ chat: event.target.value as ThemeName })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {chatThemeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black" htmlFor="admin-theme">
                    Admin Dashboard Theme
                  </label>
                  <select
                    id="admin-theme"
                    value={form.themePreferences?.admin ?? 'adminMidnight'}
                    onChange={event =>
                      updateThemePreferences({ admin: event.target.value as AdminThemeName })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {adminThemeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-black">
                    {adminThemeOptions.find(option => option.value === form.themePreferences?.admin)?.description ?? 'High-contrast palette for operational clarity.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
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
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 touch-target"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
