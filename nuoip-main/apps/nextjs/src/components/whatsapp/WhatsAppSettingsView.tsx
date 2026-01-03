'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { authenticatedFetch } from '@/features/admin/api/admin-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Users, RefreshCw, AlertCircle, Settings, Loader2 } from 'lucide-react'
import { toast } from '@/stores'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WhatsAppConfig {
  routingRule: 'FLOWBOT_ONLY' | 'USER_ONLY' | 'FLOWBOT_FIRST' | 'USER_FIRST' | 'MANUAL'
  autoReplyEnabled: boolean
  autoReplyMessage: string | null
  businessHoursEnabled: boolean
  businessHoursStart: string | null
  businessHoursEnd: string | null
  businessHoursTimezone: string | null
  awayMessage: string | null
}

export function WhatsAppSettingsView() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.tenantId) {
      loadSessions()
    }
  }, [user])

  useEffect(() => {
    if (selectedSessionId) {
      loadConfig()
    } else {
      setConfig(null)
      setLoading(false)
    }
  }, [selectedSessionId])

  const loadSessions = async () => {
    try {
      const response = await authenticatedFetch('/api/whatsapp/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        if (data.sessions?.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data.sessions[0].sessionId)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar sesiones')
      }
    } catch (error) {
      console.error('Failed to load sessions', error)
      setError('Error al cargar sesiones')
    }
  }

  const loadConfig = async () => {
    if (!selectedSessionId) return

    setLoading(true)
    setError(null)
    try {
      const response = await authenticatedFetch(`/api/whatsapp/config?sessionId=${selectedSessionId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig({
            routingRule: data.config.routingRule || 'FLOWBOT_FIRST',
            autoReplyEnabled: data.config.autoReplyEnabled || false,
            autoReplyMessage: data.config.autoReplyMessage || '',
            businessHoursEnabled: data.config.businessHoursEnabled || false,
            businessHoursStart: data.config.businessHoursStart || '09:00',
            businessHoursEnd: data.config.businessHoursEnd || '18:00',
            businessHoursTimezone: data.config.businessHoursTimezone || 'America/New_York',
            awayMessage: data.config.awayMessage || '',
          })
        } else {
          setError('No se encontró configuración')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar configuración')
      }
    } catch (error) {
      console.error('Failed to load config', error)
      setError('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedSessionId || !config) {
      toast.error('Error', 'Selecciona una sesión y configura los valores')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const response = await authenticatedFetch('/api/whatsapp/config', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: selectedSessionId,
          config: {
            routingRule: config.routingRule,
            autoReplyEnabled: config.autoReplyEnabled,
            autoReplyMessage: config.autoReplyMessage || null,
            businessHoursEnabled: config.businessHoursEnabled,
            businessHoursStart: config.businessHoursStart || null,
            businessHoursEnd: config.businessHoursEnd || null,
            businessHoursTimezone: config.businessHoursTimezone || null,
            awayMessage: config.awayMessage || null,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Configuración guardada', 'Los cambios se han guardado exitosamente')
        // Reload config to get updated values
        await loadConfig()
      } else {
        const errorData = await response.json()
        const errorMsg = errorData.details || errorData.error || 'Error al guardar configuración'
        setError(errorMsg)
        toast.error('Error', errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar configuración'
      setError(errorMsg)
      toast.error('Error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleSyncAccounts = async () => {
    if (!selectedSessionId) {
      toast.error('Error', 'Selecciona una sesión primero')
      return
    }

    try {
      toast.info('Sincronizando', 'Sincronizando cuentas...')
      const response = await authenticatedFetch('/api/whatsapp/accounts/sync', {
        method: 'POST',
        body: JSON.stringify({ sessionId: selectedSessionId, syncMode: 'auto' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(
          'Sincronización completada',
          `Sincronizados ${data.stats?.synced || 0} contactos: ${data.stats?.linkedToUsers || 0} usuarios, ${data.stats?.linkedToChatbot || 0} FlowBot`
        )
      } else {
        const errorData = await response.json()
        toast.error('Error', errorData.error || 'Error al sincronizar cuentas')
      }
    } catch (error) {
      toast.error('Error', 'Error al sincronizar cuentas')
    }
  }

  if (loading && !config) {
    return (
      <Alert className="bg-white border-gray-200">
        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        <AlertDescription className="text-black">Cargando configuración...</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-black">Configuración</h2>
        </div>
        <p className="text-gray-600 mt-1">
          Configura reglas de enrutamiento y preferencias para tus sesiones de WhatsApp
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Selector */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-black">Sesión</CardTitle>
          <CardDescription className="text-black">Selecciona la sesión a configurar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          {sessions.length === 0 ? (
            <Alert className="bg-white border-gray-200 border-dashed">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <AlertDescription className="text-black">
                <p className="text-base font-medium text-black mb-2">
                  No hay sesiones disponibles
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Para configurar una sesión, primero debes crear una desde la vista de <strong>Sesiones WhatsApp</strong>.
                </p>
                <p className="text-xs text-gray-500">
                  Usa el menú lateral para navegar a "Sesiones WhatsApp" y haz clic en el botón <strong>"Nueva Sesión"</strong> en la parte superior.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="bg-white text-black border-gray-300">
                  <SelectValue placeholder="Seleccionar sesión" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {sessions.map((s) => (
                    <SelectItem key={s.sessionId} value={s.sessionId} className="text-black">
                      {s.name || s.sessionId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSessionId && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncAccounts}
                    title="Sincronizar contactos de WhatsApp con usuarios y contactos de FlowBot"
                    className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Sincronizar Cuentas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConfig}
                    title="Recargar configuración"
                    className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recargar
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {config && selectedSessionId && (
        <>
          {/* Routing Rules */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-black">Reglas de Enrutamiento</CardTitle>
              <CardDescription className="text-black">
                Define cómo se manejan los mensajes entrantes de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="routingRule" className="text-black">Regla de Enrutamiento</Label>
                <Select
                  value={config.routingRule}
                  onValueChange={(value: WhatsAppConfig['routingRule']) =>
                    setConfig({ ...config, routingRule: value })
                  }
                >
                  <SelectTrigger id="routingRule" className="bg-white text-black border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="FLOWBOT_ONLY" className="text-black">Solo FlowBot</SelectItem>
                    <SelectItem value="USER_ONLY" className="text-black">Solo Usuarios</SelectItem>
                    <SelectItem value="FLOWBOT_FIRST" className="text-black">FlowBot Primero</SelectItem>
                    <SelectItem value="USER_FIRST" className="text-black">Usuarios Primero</SelectItem>
                    <SelectItem value="MANUAL" className="text-black">Manual</SelectItem>
                  </SelectContent>
                </Select>
                <Alert className="bg-gray-50 border-gray-200 mt-2">
                  <AlertDescription className="text-black text-xs">
                    {config.routingRule === 'FLOWBOT_ONLY' && (
                      <p><strong>Solo FlowBot:</strong> Todos los mensajes son manejados automáticamente por FlowBot. Los usuarios no intervienen.</p>
                    )}
                    {config.routingRule === 'USER_ONLY' && (
                      <p><strong>Solo Usuarios:</strong> Todos los mensajes van directamente a usuarios. FlowBot no responde automáticamente.</p>
                    )}
                    {config.routingRule === 'FLOWBOT_FIRST' && (
                      <p><strong>FlowBot Primero:</strong> FlowBot responde primero. Los usuarios pueden tomar el control cuando sea necesario.</p>
                    )}
                    {config.routingRule === 'USER_FIRST' && (
                      <p><strong>Usuarios Primero:</strong> Los usuarios responden primero. Pueden delegar conversaciones a FlowBot cuando lo deseen.</p>
                    )}
                    {config.routingRule === 'MANUAL' && (
                      <p><strong>Manual:</strong> Requiere aprobación manual para cada mensaje antes de responder.</p>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Auto Reply */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-black">Respuesta Automática</CardTitle>
              <CardDescription className="text-black">Configura mensajes automáticos cuando no hay agentes disponibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoReply" className="text-black">Habilitar Respuesta Automática</Label>
                  <p className="text-xs text-gray-600">
                    Envía un mensaje automático cuando no hay agentes disponibles
                  </p>
                </div>
                <Switch
                  id="autoReply"
                  checked={config.autoReplyEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, autoReplyEnabled: checked })
                  }
                />
              </div>
              {config.autoReplyEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="autoReplyMessage" className="text-black">Mensaje de Respuesta Automática</Label>
                  <Textarea
                    id="autoReplyMessage"
                    name="autoReplyMessage"
                    value={config.autoReplyMessage || ''}
                    onChange={(e) =>
                      setConfig({ ...config, autoReplyMessage: e.target.value })
                    }
                    placeholder="Gracias por contactarnos. Te responderemos pronto."
                    rows={3}
                    className="bg-white text-black border-gray-300"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-black">Horario Comercial</CardTitle>
              <CardDescription className="text-black">Define horarios de atención para respuestas automáticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="businessHours" className="text-black">Habilitar Horario Comercial</Label>
                  <p className="text-xs text-gray-600">
                    Solo responde durante horarios específicos
                  </p>
                </div>
                <Switch
                  id="businessHours"
                  checked={config.businessHoursEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, businessHoursEnabled: checked })
                  }
                />
              </div>
              {config.businessHoursEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="text-black">Hora de Inicio</Label>
                      <Input
                        id="startTime"
                        name="businessHoursStart"
                        type="time"
                        value={config.businessHoursStart || '09:00'}
                        onChange={(e) =>
                          setConfig({ ...config, businessHoursStart: e.target.value })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="text-black">Hora de Fin</Label>
                      <Input
                        id="endTime"
                        name="businessHoursEnd"
                        type="time"
                        value={config.businessHoursEnd || '18:00'}
                        onChange={(e) =>
                          setConfig({ ...config, businessHoursEnd: e.target.value })
                        }
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-black">Zona Horaria</Label>
                    <Select
                      value={config.businessHoursTimezone || 'America/New_York'}
                      onValueChange={(value) =>
                        setConfig({ ...config, businessHoursTimezone: value })
                      }
                    >
                      <SelectTrigger id="timezone" className="bg-white text-black border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="America/New_York" className="text-black">America/New_York (EST/EDT)</SelectItem>
                        <SelectItem value="America/Los_Angeles" className="text-black">America/Los_Angeles (PST/PDT)</SelectItem>
                        <SelectItem value="America/Mexico_City" className="text-black">America/Mexico_City (CST)</SelectItem>
                        <SelectItem value="America/Bogota" className="text-black">America/Bogota (COT)</SelectItem>
                        <SelectItem value="America/Santiago" className="text-black">America/Santiago (CLT)</SelectItem>
                        <SelectItem value="America/Buenos_Aires" className="text-black">America/Buenos_Aires (ART)</SelectItem>
                        <SelectItem value="Europe/Madrid" className="text-black">Europe/Madrid (CET/CEST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awayMessage" className="text-black">Mensaje Fuera de Horario</Label>
                    <Textarea
                      id="awayMessage"
                      name="awayMessage"
                      value={config.awayMessage || ''}
                      onChange={(e) =>
                        setConfig({ ...config, awayMessage: e.target.value })
                      }
                      placeholder="Estamos fuera de horario. Te responderemos pronto."
                      rows={3}
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={loadConfig}
              disabled={saving}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !config} className="bg-green-600 text-white hover:bg-green-700">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {!config && selectedSessionId && !loading && (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6 bg-white">
            <div className="text-center text-gray-600">
              <p className="text-black">No se pudo cargar la configuración</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadConfig}
                className="mt-4 bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
