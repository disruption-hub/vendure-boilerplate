'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getBrevoSettings,
  getLabsMobileSettings,
  getRealtimeSettings,
  getOpenRouterSettings,
  getRootDomainSettings,
  updateBrevoSettings,
  updateLabsMobileSettings,
  updateRealtimeSettings,
  updateOpenRouterSettings,
  updateRootDomainSettings,
  type LabsMobileSettings,
  type RealtimeSettings,
  type OpenRouterSettings,
} from '@/features/admin/api/admin-api'
import { toast } from '@/stores'

type MessageState = {
  type: 'success' | 'error'
  text: string
} | null

type BrevoFormState = {
  apiKey: string
  ccEmail: string
}

type OpenRouterFormState = {
  apiKey: string
  baseUrl: string
}

const defaultBrevoForm: BrevoFormState = {
  apiKey: '',
  ccEmail: '',
}

type LabsMobileFormState = {
  username: string
  token: string
  senderId: string
  baseUrl: string
}

const defaultLabsMobileForm: LabsMobileFormState = {
  username: '',
  token: '',
  senderId: '',
  baseUrl: '',
}

type RealtimeFormState = {
  appId: string
  key: string
  secret: string
  publicHost: string
  publicPort: string
  internalHost: string
  internalPort: string
  useTLS: boolean
  enabled: boolean
}

const defaultRealtimeForm: RealtimeFormState = {
  appId: '',
  key: '',
  secret: '',
  publicHost: '',
  publicPort: '443',
  internalHost: '',
  internalPort: '',
  useTLS: true,
  enabled: true,
}

const DEFAULT_ROOT_DOMAIN_FALLBACK = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'flowcast.chat').trim()

export function SystemSettingsSection() {
  const [brevoForm, setBrevoForm] = useState<BrevoFormState>({ ...defaultBrevoForm })
  const [openRouterForm, setOpenRouterForm] = useState<OpenRouterFormState>({ apiKey: '', baseUrl: '' })
  const [labsMobileForm, setLabsMobileForm] = useState<LabsMobileFormState>({ ...defaultLabsMobileForm })
  const [realtimeForm, setRealtimeForm] = useState<RealtimeFormState>({ ...defaultRealtimeForm })
  const [rootDomain, setRootDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingBrevo, setSavingBrevo] = useState(false)
  const [savingOpenRouter, setSavingOpenRouter] = useState(false)
  const [savingLabsMobile, setSavingLabsMobile] = useState(false)
  const [savingRealtime, setSavingRealtime] = useState(false)
  const [savingRootDomain, setSavingRootDomain] = useState(false)
  const [brevoMessage, setBrevoMessage] = useState<MessageState>(null)
  const [openRouterMessage, setOpenRouterMessage] = useState<MessageState>(null)
  const [labsMobileMessage, setLabsMobileMessage] = useState<MessageState>(null)
  const [realtimeMessage, setRealtimeMessage] = useState<MessageState>(null)
  const [rootDomainMessage, setRootDomainMessage] = useState<MessageState>(null)
  const [showBrevoApiKey, setShowBrevoApiKey] = useState(false)
  const [showOpenRouterApiKey, setShowOpenRouterApiKey] = useState(false)
  const [showLabsMobileToken, setShowLabsMobileToken] = useState(false)
  const [showRealtimeSecret, setShowRealtimeSecret] = useState(false)

  useEffect(() => {
    void loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setBrevoMessage(null)
      setOpenRouterMessage(null)
      setLabsMobileMessage(null)
      setRealtimeMessage(null)
      setRootDomainMessage(null)

      const [brevoResult, openRouterResult, labsMobileResult, realtimeResult, rootDomainResult] = await Promise.allSettled([
        getBrevoSettings(),
        getOpenRouterSettings(),
        getLabsMobileSettings(),
        getRealtimeSettings(),
        getRootDomainSettings(),
      ])

      if (brevoResult.status === 'fulfilled' && brevoResult.value.config) {
        setBrevoForm({
          apiKey: brevoResult.value.config.apiKey,
          ccEmail: brevoResult.value.config.ccEmail ?? '',
        })
      } else if (brevoResult.status === 'rejected') {
        console.error('Failed to load Brevo settings', brevoResult.reason)
        setBrevoMessage({ type: 'error', text: 'Unable to load Brevo configuration.' })
        setBrevoForm({ ...defaultBrevoForm })
      } else if (brevoResult.status === 'fulfilled' && !brevoResult.value.config) {
        setBrevoForm({ ...defaultBrevoForm })
      }

      if (openRouterResult.status === 'fulfilled' && openRouterResult.value.config) {
        console.log('[SystemSettings] OpenRouter: Loaded config:', {
          hasApiKey: !!openRouterResult.value.config.apiKey,
          apiKeyLength: openRouterResult.value.config.apiKey?.length || 0,
          baseUrl: openRouterResult.value.config.baseUrl,
        })
        setOpenRouterForm({
          apiKey: openRouterResult.value.config.apiKey,
          baseUrl: openRouterResult.value.config.baseUrl ?? '',
        })
      } else if (openRouterResult.status === 'rejected') {
        console.error('[SystemSettings] OpenRouter: Failed to load', openRouterResult.reason)
        setOpenRouterMessage({ type: 'error', text: 'Unable to load OpenRouter configuration.' })
        setOpenRouterForm({ apiKey: '', baseUrl: '' })
      } else if (openRouterResult.status === 'fulfilled' && !openRouterResult.value.config) {
        console.warn('[SystemSettings] OpenRouter: No config returned from backend')
        setOpenRouterForm({ apiKey: '', baseUrl: '' })
      }

      if (labsMobileResult.status === 'fulfilled' && labsMobileResult.value.config) {
        const config = labsMobileResult.value.config
        console.log('[SystemSettings] LabsMobile: Loaded config:', {
          username: config.username,
          hasToken: !!config.token,
          tokenLength: config.token?.length || 0,
          senderId: config.senderId,
        })
        setLabsMobileForm({
          username: config.username,
          token: config.token,
          senderId: config.senderId ?? '',
          baseUrl: config.baseUrl ?? '',
        })
      } else if (labsMobileResult.status === 'rejected') {
        console.error('[SystemSettings] LabsMobile: Failed to load', labsMobileResult.reason)
        setLabsMobileMessage({ type: 'error', text: 'Unable to load LabsMobile configuration.' })
        setLabsMobileForm({ ...defaultLabsMobileForm })
      } else if (labsMobileResult.status === 'fulfilled' && !labsMobileResult.value.config) {
        console.warn('[SystemSettings] LabsMobile: No config returned from backend')
        setLabsMobileForm({ ...defaultLabsMobileForm })
      }

      if (realtimeResult.status === 'fulfilled' && realtimeResult.value.config) {
        const config = realtimeResult.value.config
        console.log('[SystemSettings] Realtime: Loaded config:', {
          hasAppId: !!config.appId,
          hasKey: !!config.key,
          keyLength: config.key?.length || 0,
          hasSecret: !!config.secret,
          publicHost: config.publicHost,
        })
        setRealtimeForm({
          appId: config.appId,
          key: config.key,
          secret: config.secret,
          publicHost: config.publicHost,
          publicPort: String(config.publicPort ?? ''),
          internalHost: config.internalHost ?? '',
          internalPort: config.internalPort ? String(config.internalPort) : '',
          useTLS: config.useTLS,
          enabled: config.enabled,
        })
      } else if (realtimeResult.status === 'rejected') {
        console.error('[SystemSettings] Realtime: Failed to load', realtimeResult.reason)
        setRealtimeMessage({ type: 'error', text: 'Unable to load realtime configuration.' })
        setRealtimeForm({ ...defaultRealtimeForm })
      } else if (realtimeResult.status === 'fulfilled' && !realtimeResult.value.config) {
        console.warn('[SystemSettings] Realtime: No config returned from backend')
        setRealtimeForm({ ...defaultRealtimeForm })
      }

      if (rootDomainResult.status === 'fulfilled') {
        setRootDomain(rootDomainResult.value.rootDomain)
      } else if (rootDomainResult.status === 'rejected') {
        console.error('Failed to load root domain configuration', rootDomainResult.reason)
        setRootDomainMessage({ type: 'error', text: 'Unable to load root domain configuration.' })
        setRootDomain(DEFAULT_ROOT_DOMAIN_FALLBACK)
      }
    } catch (error) {
      console.error('Failed to load system settings', error)
      setBrevoMessage({ type: 'error', text: 'Unable to load Brevo configuration.' })
      setOpenRouterMessage({ type: 'error', text: 'Unable to load OpenRouter configuration.' })
      setLabsMobileMessage({ type: 'error', text: 'Unable to load LabsMobile configuration.' })
      setRealtimeMessage({ type: 'error', text: 'Unable to load realtime configuration.' })
      setRootDomainMessage({ type: 'error', text: 'Unable to load root domain configuration.' })
      setBrevoForm({ ...defaultBrevoForm })
      setOpenRouterForm({ apiKey: '', baseUrl: '' })
      setLabsMobileForm({ ...defaultLabsMobileForm })
      setRealtimeForm({ ...defaultRealtimeForm })
      setRootDomain(DEFAULT_ROOT_DOMAIN_FALLBACK)
      toast.error('Failed to load system settings', 'Unable to load Brevo or OpenRouter configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleBrevoChange = (field: keyof BrevoFormState, value: string) => {
    setBrevoForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleOpenRouterChange = (field: keyof OpenRouterFormState, value: string) => {
    setOpenRouterForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLabsMobileChange = (field: keyof LabsMobileFormState, value: string) => {
    setLabsMobileForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRealtimeChange = <K extends keyof RealtimeFormState>(field: K, value: RealtimeFormState[K]) => {
    setRealtimeForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRootDomainSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRootDomain) return

    if (!rootDomain.trim()) {
      setRootDomainMessage({ type: 'error', text: 'Root domain is required.' })
      return
    }

    try {
      setSavingRootDomain(true)
      setRootDomainMessage(null)

      const response = await updateRootDomainSettings(rootDomain)
      setRootDomain(response.rootDomain)
      setRootDomainMessage({ type: 'success', text: 'Root domain updated successfully.' })
      toast.success('Root domain updated', 'The base domain is now applied to new tenant URLs.')
    } catch (error) {
      console.error('Failed to update root domain configuration', error)
      setRootDomainMessage({ type: 'error', text: 'Unable to update root domain configuration.' })
      toast.error('Root domain update failed', 'Unable to update root domain configuration.')
    } finally {
      setSavingRootDomain(false)
    }
  }

  const handleOpenRouterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingOpenRouter) return

    try {
      setSavingOpenRouter(true)
      setOpenRouterMessage(null)

      const trimmedBaseUrl = openRouterForm.baseUrl.trim()
      const payload: OpenRouterSettings = {
        apiKey: openRouterForm.apiKey.trim(),
        ...(trimmedBaseUrl ? { baseUrl: trimmedBaseUrl } : {}),
      }

      const updated = await updateOpenRouterSettings(payload)
      setOpenRouterForm({
        apiKey: updated.apiKey,
        baseUrl: updated.baseUrl ?? '',
      })
      setOpenRouterMessage({ type: 'success', text: 'OpenRouter configuration updated successfully.' })
      toast.success('OpenRouter settings updated', 'OpenRouter configuration updated successfully.')
    } catch (error) {
      console.error('Failed to update OpenRouter settings', error)
      setOpenRouterMessage({ type: 'error', text: 'Unable to update OpenRouter configuration.' })
      toast.error('OpenRouter update failed', 'Unable to update OpenRouter configuration.')
    } finally {
      setSavingOpenRouter(false)
    }
  }

  const handleLabsMobileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingLabsMobile) return

    try {
      setSavingLabsMobile(true)
      setLabsMobileMessage(null)

      const payload: LabsMobileSettings = {
        username: labsMobileForm.username.trim(),
        token: labsMobileForm.token.trim(),
        ...(labsMobileForm.senderId.trim() ? { senderId: labsMobileForm.senderId.trim() } : {}),
        ...(labsMobileForm.baseUrl.trim() ? { baseUrl: labsMobileForm.baseUrl.trim() } : {}),
      }

      const updated = await updateLabsMobileSettings(payload)
      setLabsMobileForm({
        username: updated.username,
        token: updated.token,
        senderId: updated.senderId ?? '',
        baseUrl: updated.baseUrl ?? '',
      })
      setLabsMobileMessage({ type: 'success', text: 'LabsMobile configuration updated successfully.' })
      toast.success('LabsMobile settings updated', 'LabsMobile configuration updated successfully.')
    } catch (error) {
      console.error('Failed to update LabsMobile settings', error)
      setLabsMobileMessage({ type: 'error', text: 'Unable to update LabsMobile configuration.' })
      toast.error('LabsMobile update failed', 'Unable to update LabsMobile configuration.')
    } finally {
      setSavingLabsMobile(false)
    }
  }

  const handleRealtimeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRealtime) return

    const appId = realtimeForm.appId.trim()
    const key = realtimeForm.key.trim()
    const secret = realtimeForm.secret.trim()
    const publicHost = realtimeForm.publicHost.trim()
    const publicPortValue = Number(realtimeForm.publicPort.trim())
    const internalHost = realtimeForm.internalHost.trim()
    const internalPortValue = realtimeForm.internalPort.trim()

    if (!appId || !key || !secret || !publicHost) {
      setRealtimeMessage({ type: 'error', text: 'App ID, key, secret, and public host are required.' })
      return
    }

    if (!Number.isFinite(publicPortValue) || publicPortValue <= 0) {
      setRealtimeMessage({ type: 'error', text: 'Public port must be a positive number.' })
      return
    }

    let internalPort: number | undefined
    if (internalPortValue) {
      const parsed = Number(internalPortValue)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setRealtimeMessage({ type: 'error', text: 'Internal port must be a positive number when provided.' })
        return
      }
      internalPort = parsed
    }

    try {
      setSavingRealtime(true)
      setRealtimeMessage(null)

      const payload: RealtimeSettings = {
        appId,
        key,
        secret,
        publicHost,
        publicPort: Math.trunc(publicPortValue),
        internalHost: internalHost || undefined,
        internalPort,
        useTLS: realtimeForm.useTLS,
        enabled: realtimeForm.enabled,
      }

      const updated = await updateRealtimeSettings(payload)
      setRealtimeForm({
        appId: updated.appId,
        key: updated.key,
        secret: updated.secret,
        publicHost: updated.publicHost,
        publicPort: String(updated.publicPort ?? ''),
        internalHost: updated.internalHost ?? '',
        internalPort: updated.internalPort ? String(updated.internalPort) : '',
        useTLS: updated.useTLS,
        enabled: updated.enabled,
      })
      setRealtimeMessage({ type: 'success', text: 'Realtime configuration updated successfully.' })
      toast.success('Realtime settings updated', 'Soketi configuration saved successfully.')
    } catch (error) {
      console.error('Failed to update realtime settings', error)
      setRealtimeMessage({ type: 'error', text: 'Unable to update realtime configuration.' })
      toast.error('Realtime update failed', 'Unable to update realtime configuration.')
    } finally {
      setSavingRealtime(false)
    }
  }

  const handleBrevoSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingBrevo) return

    try {
      setSavingBrevo(true)
      setBrevoMessage(null)
      const updated = await updateBrevoSettings({
        apiKey: brevoForm.apiKey.trim(),
        ccEmail: brevoForm.ccEmail?.trim() || undefined,
      })
      setBrevoForm({
        apiKey: updated.apiKey,
        ccEmail: updated.ccEmail ?? '',
      })
      setBrevoMessage({ type: 'success', text: 'Brevo configuration updated successfully.' })
      toast.success('Brevo settings updated', 'Brevo configuration updated successfully.')
    } catch (error) {
      console.error('Failed to update Brevo settings', error)
      setBrevoMessage({ type: 'error', text: 'Unable to update Brevo configuration.' })
      toast.error('Brevo update failed', 'Unable to update Brevo configuration.')
    } finally {
      setSavingBrevo(false)
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tenant Root Domain</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Define the primary domain used to generate tenant subdomains. Existing DNS should point wildcard entries to this project.
          </p>
        </div>

        {rootDomainMessage && (
          <Alert variant={rootDomainMessage.type === 'error' ? 'destructive' : rootDomainMessage.type === 'success' ? 'success' : 'default'}>
            <AlertDescription className={rootDomainMessage.type === 'success' ? 'text-white' : ''}>{rootDomainMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRootDomainSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="root-domain">Root domain</Label>
            <Input
              id="root-domain"
              value={rootDomain}
              onChange={event => setRootDomain(event.target.value)}
              placeholder="flowcast.chat"
              autoComplete="off"
              disabled={loading}
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Subdomains like <strong className="text-slate-900 dark:text-white">tenant.{rootDomain || 'example.com'}</strong> will be generated automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingRootDomain || loading}>
              {savingRootDomain ? 'Saving…' : 'Save domain'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => void loadSettings()} 
              disabled={loading}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Reload
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">OpenRouter Configuration</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">Manage the OpenRouter credentials used for AI responses.</p>
        </div>

        {openRouterMessage && (
          <Alert variant={openRouterMessage.type === 'error' ? 'destructive' : openRouterMessage.type === 'success' ? 'success' : 'default'}>
            <AlertDescription className={openRouterMessage.type === 'success' ? 'text-white' : ''}>{openRouterMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleOpenRouterSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="openrouter-api-key">OpenRouter API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="openrouter-api-key"
                type={showOpenRouterApiKey ? 'text' : 'password'}
                value={openRouterForm.apiKey}
                onChange={event => handleOpenRouterChange('apiKey', event.target.value)}
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOpenRouterApiKey(prev => !prev)}
                disabled={loading}
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                {showOpenRouterApiKey ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openrouter-base-url">OpenRouter Base URL</Label>
            <Input
              id="openrouter-base-url"
              type="url"
              value={openRouterForm.baseUrl}
              onChange={event => handleOpenRouterChange('baseUrl', event.target.value)}
              placeholder="https://openrouter.ai/api/v1"
              disabled={loading}
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">Leave blank to use the default OpenRouter endpoint.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingOpenRouter || loading}>
              {savingOpenRouter ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => void loadSettings()} 
              disabled={loading}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Reload
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">LabsMobile SMS Configuration</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">Configure the LabsMobile credentials used to deliver OTP codes.</p>
        </div>

        {labsMobileMessage && (
          <Alert variant={labsMobileMessage.type === 'error' ? 'destructive' : labsMobileMessage.type === 'success' ? 'success' : 'default'}>
            <AlertDescription className={labsMobileMessage.type === 'success' ? 'text-white' : ''}>{labsMobileMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLabsMobileSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="labsmobile-username">LabsMobile Username</Label>
            <Input
              id="labsmobile-username"
              value={labsMobileForm.username}
              onChange={event => handleLabsMobileChange('username', event.target.value)}
              required
              disabled={loading}
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labsmobile-token">LabsMobile API Token</Label>
            <div className="flex items-center gap-2">
              <Input
                id="labsmobile-token"
                type={showLabsMobileToken ? 'text' : 'password'}
                value={labsMobileForm.token}
                onChange={event => handleLabsMobileChange('token', event.target.value)}
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLabsMobileToken(prev => !prev)}
                disabled={loading}
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                {showLabsMobileToken ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="labsmobile-sender">Sender ID (optional)</Label>
            <Input
              id="labsmobile-sender"
              value={labsMobileForm.senderId}
              onChange={event => handleLabsMobileChange('senderId', event.target.value)}
              placeholder="FlowBot"
              disabled={loading}
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labsmobile-base-url">LabsMobile Base URL</Label>
            <Input
              id="labsmobile-base-url"
              type="url"
              value={labsMobileForm.baseUrl}
              onChange={event => handleLabsMobileChange('baseUrl', event.target.value)}
              placeholder="https://api.labsmobile.com/json/send"
              disabled={loading}
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">Leave blank to use LabsMobile&apos;s default endpoint.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingLabsMobile || loading}>
              {savingLabsMobile ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => void loadSettings()} 
              disabled={loading}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Reload
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Realtime Chat (Soketi)</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Configure the Soketi credentials used to deliver realtime chat updates across tenant workspaces.
          </p>
        </div>

        {realtimeMessage && (
          <Alert variant={realtimeMessage.type === 'error' ? 'destructive' : realtimeMessage.type === 'success' ? 'success' : 'default'}>
            <AlertDescription className={realtimeMessage.type === 'success' ? 'text-white' : ''}>{realtimeMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRealtimeSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="realtime-app-id">App ID</Label>
              <Input
                id="realtime-app-id"
                value={realtimeForm.appId}
                onChange={event => handleRealtimeChange('appId', event.target.value)}
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-key">Public Key</Label>
              <Input
                id="realtime-key"
                value={realtimeForm.key}
                onChange={event => handleRealtimeChange('key', event.target.value)}
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-secret">Secret</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="realtime-secret"
                  type={showRealtimeSecret ? 'text' : 'password'}
                  value={realtimeForm.secret}
                  onChange={event => handleRealtimeChange('secret', event.target.value)}
                  required
                  disabled={loading}
                  className="bg-white text-black border-gray-300"
                  style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRealtimeSecret(prev => !prev)}
                  disabled={loading}
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                  style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                >
                  {showRealtimeSecret ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-public-host">Public Host</Label>
              <Input
                id="realtime-public-host"
                value={realtimeForm.publicHost}
                onChange={event => handleRealtimeChange('publicHost', event.target.value)}
                placeholder="soketi-production-xxxx.up.railway.app"
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-public-port">Public Port</Label>
              <Input
                id="realtime-public-port"
                type="number"
                min={1}
                value={realtimeForm.publicPort}
                onChange={event => handleRealtimeChange('publicPort', event.target.value)}
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-internal-host">Internal Host (optional)</Label>
              <Input
                id="realtime-internal-host"
                value={realtimeForm.internalHost}
                onChange={event => handleRealtimeChange('internalHost', event.target.value)}
                placeholder="soketi.railway.internal"
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="realtime-internal-port">Internal Port (optional)</Label>
              <Input
                id="realtime-internal-port"
                type="number"
                min={1}
                value={realtimeForm.internalPort}
                onChange={event => handleRealtimeChange('internalPort', event.target.value)}
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-900 dark:text-white">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={realtimeForm.useTLS}
                onChange={event => handleRealtimeChange('useTLS', event.target.checked)}
                disabled={loading}
              />
              Use TLS for public connections
            </label>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-900 dark:text-white">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={realtimeForm.enabled}
                onChange={event => handleRealtimeChange('enabled', event.target.checked)}
                disabled={loading}
              />
              Enable realtime broadcasting
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingRealtime || loading}>
              {savingRealtime ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => void loadSettings()} 
              disabled={loading}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Reload
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Brevo Email Configuration</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">Update the Brevo credentials used for transactional email delivery.</p>
        </div>

        {brevoMessage && (
          <Alert variant={brevoMessage.type === 'error' ? 'destructive' : brevoMessage.type === 'success' ? 'success' : 'default'}>
            <AlertDescription className={brevoMessage.type === 'success' ? 'text-white' : ''}>{brevoMessage.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleBrevoSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brevo-api-key">Brevo API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="brevo-api-key"
                type={showBrevoApiKey ? 'text' : 'password'}
                value={brevoForm.apiKey}
                onChange={event => handleBrevoChange('apiKey', event.target.value)}
                required
                disabled={loading}
                className="bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBrevoApiKey(prev => !prev)}
                disabled={loading}
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                {showBrevoApiKey ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brevo-cc-email">CC Email</Label>
            <Input
              id="brevo-cc-email"
              type="email"
              value={brevoForm.ccEmail ?? ''}
              onChange={event => handleBrevoChange('ccEmail', event.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingBrevo || loading}>
              {savingBrevo ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => void loadSettings()} 
              disabled={loading}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            >
              Reload
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
