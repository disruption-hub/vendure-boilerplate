"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, Users, Globe, Key, Loader2, AlertCircle } from 'lucide-react';
import { useCalendarStore, CalendarConfig, TenantCalendarSettings, toast } from '@/stores';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardDescription } from '@/components/ui/card';

interface CalendarConfigurationProps {
  tenantId: string;
  userId?: string; // If provided, configure for specific user
}

export function CalendarConfiguration({ tenantId, userId }: CalendarConfigurationProps) {
  const {
    tenantSettings,
    userConfigs,
    loading,
    saving,
    fetchCalendarConfiguration,
    saveTenantSettings: saveTenantSettingsStore,
    saveUserConfig: saveUserConfigStore,
    error,
  } = useCalendarStore();

  useEffect(() => {
    fetchCalendarConfiguration(tenantId, userId);
  }, [tenantId, userId, fetchCalendarConfiguration]);

  useEffect(() => {
    if (error) {
      toast.error('Calendar configuration error', error);
    }
  }, [error]);

  const saveTenantSettings = async (settings: TenantCalendarSettings) => {
    const success = await saveTenantSettingsStore(tenantId, settings);
    if (success) {
      toast.success('Calendar settings saved', 'Tenant calendar settings updated successfully.');
    } else {
      toast.error('Calendar save failed', 'Unable to save tenant calendar settings.');
    }
    return success;
  };

  const saveUserConfig = async (userId: string, config: CalendarConfig) => {
    const success = await saveUserConfigStore(userId, config);
    if (success) {
      toast.success('User calendar saved', 'User calendar configuration updated successfully.');
    } else {
      toast.error('User calendar save failed', 'Unable to save user calendar configuration.');
    }
    return success;
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-black">Loading Calendar Configuration...</h3>
              <p className="text-sm text-gray-600">Fetching calendar settings...</p>
            </div>
      </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold text-black">Calendar Configuration</h1>
      </div>

      <Alert className="bg-white border-gray-200">
        <Calendar className="h-4 w-4" />
        <AlertDescription className="text-black">
          Configure calendar integration settings for your organization. Set up default providers, permissions, and credentials.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="tenant" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border-gray-200">
          <TabsTrigger value="tenant" className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-600">
            <Globe className="h-4 w-4" />
            Tenant Settings
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-black text-gray-600">
            <Users className="h-4 w-4" />
            User Configurations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenant" className="space-y-4">
          <TenantSettingsTab 
            settings={tenantSettings} 
            onSave={saveTenantSettings}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserConfigurationsTab 
            configs={userConfigs}
            onSave={saveUserConfig}
            saving={saving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TenantSettingsTab({ 
  settings, 
  onSave, 
  saving 
}: { 
  settings: TenantCalendarSettings | null;
  onSave: (settings: TenantCalendarSettings) => Promise<boolean>;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<TenantCalendarSettings>({
    globalEnabled: false,
    defaultProvider: 'none',
    allowedProviders: [],
    requireAdminApproval: false,
    defaultPermissions: {
      canSchedule: false,
      canView: false,
      canModify: false,
      canDelete: false,
    },
    defaultSettings: {
      permissions: {
        canSchedule: false,
        canView: false,
        canModify: false,
        canDelete: false,
      },
      defaults: {
        meetingDuration: 60,
        bufferTime: 15,
        workingHours: {
          start: '09:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5], // Monday to Friday
        },
        autoAccept: false,
        requireApproval: true,
      },
      notifications: {
        email: true,
        inApp: true,
        reminderMinutes: [15, 60, 1440], // 15 min, 1 hour, 1 day
      },
      credentials: {
        serviceAccountEmail: '',
        privateKey: '',
        calendarId: 'primary',
        timeZone: 'America/Mexico_City',
      },
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = () => {
    void onSave(formData);
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="bg-white">
        <CardTitle className="flex items-center gap-2 text-black">
          <Settings className="h-5 w-5 text-green-600" />
          Global Calendar Settings
        </CardTitle>
        <CardDescription className="text-black">
          Configure default calendar integration settings for all users in this organization
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Switch
              checked={formData.globalEnabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, globalEnabled: checked }))
              }
              label="Enable Calendar Integration"
              description="Allow users to integrate with external calendar services"
              variant={formData.globalEnabled ? "success" : "default"}
              disabled={saving}
              loading={saving}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-black">Default Provider</Label>
            <Select
              value={formData.defaultProvider}
              onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, defaultProvider: value }))
              }
            >
              <SelectTrigger className="bg-white text-black border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="google">Google Calendar</SelectItem>
                <SelectItem value="outlook">Outlook</SelectItem>
                <SelectItem value="apple">Apple Calendar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-black">Allowed Providers</Label>
          <div className="flex flex-wrap gap-2">
            {['google', 'outlook', 'apple'].map(provider => (
              <Badge
                key={provider}
                variant={formData.allowedProviders.includes(provider) ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  formData.allowedProviders.includes(provider)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const newProviders = formData.allowedProviders.includes(provider)
                    ? formData.allowedProviders.filter(p => p !== provider)
                    : [...formData.allowedProviders, provider];
                  setFormData(prev => ({ ...prev, allowedProviders: newProviders }));
                }}
              >
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium text-black">Default Permissions</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.defaultPermissions).map(([key, value]) => (
              <Switch
                key={key}
                checked={Boolean(value)}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    defaultPermissions: {
                      ...prev.defaultPermissions,
                      [key]: checked,
                    },
                  }))
                }
                label={key.replace(/([A-Z])/g, ' $1').trim()}
                description={`Allow users to ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} calendar events`}
                variant={value ? "success" : "default"}
                size="sm"
                disabled={saving}
              />
            ))}
          </div>
        </div>

        {/* Credential Configuration */}
        {formData.globalEnabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-green-600" />
              <Label className="text-base font-medium text-black">Default Credentials</Label>
            </div>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="serviceAccountEmail" className="text-black">Service Account Email</Label>
                <Input
                  id="serviceAccountEmail"
                  type="email"
                  placeholder="service-account@project.iam.gserviceaccount.com"
                  value={formData.defaultSettings.credentials?.serviceAccountEmail || ''}
                  onChange={(e) => 
                    setFormData(prev => ({
                      ...prev,
                      defaultSettings: {
                        ...prev.defaultSettings,
                        credentials: {
                          ...prev.defaultSettings.credentials,
                          serviceAccountEmail: e.target.value,
                        },
                      },
                    }))
                  }
                    className="bg-white text-black border-gray-300"
                />
              </div>

              <div className="space-y-2">
                  <Label htmlFor="privateKey" className="text-black">Private Key</Label>
                <div className="relative">
                  <Textarea
                    id="privateKey"
                    placeholder="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
                    rows={4}
                    value={formData.defaultSettings.credentials?.privateKey || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        defaultSettings: {
                          ...prev.defaultSettings,
                          credentials: {
                            ...prev.defaultSettings.credentials,
                            privateKey: e.target.value,
                          },
                        },
                      }))
                    }
                      className="font-mono text-sm bg-white text-black border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="calendarId" className="text-black">Calendar ID</Label>
                  <Input
                    id="calendarId"
                    placeholder="primary"
                    value={formData.defaultSettings.credentials?.calendarId || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        defaultSettings: {
                          ...prev.defaultSettings,
                          credentials: {
                            ...prev.defaultSettings.credentials,
                            calendarId: e.target.value,
                          },
                        },
                      }))
                    }
                      className="bg-white text-black border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timeZone" className="text-black">Time Zone</Label>
                  <Select
                    value={formData.defaultSettings.credentials?.timeZone || 'America/Mexico_City'}
                    onValueChange={(value) => 
                      setFormData(prev => ({
                        ...prev,
                        defaultSettings: {
                          ...prev.defaultSettings,
                          credentials: {
                            ...prev.defaultSettings.credentials,
                            timeZone: value,
                          },
                        },
                      }))
                    }
                  >
                      <SelectTrigger className="bg-white text-black border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">Mexico City</SelectItem>
                      <SelectItem value="America/New_York">New York</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-black">
                  <strong>Note:</strong> These credentials will be used as defaults for all users in this tenant. 
                  Individual users can override these settings in their personal configuration.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            variant="outline"
            className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UserConfigurationsTab({ 
  configs, 
  onSave, 
  saving 
}: { 
  configs: CalendarConfig[];
  onSave: (userId: string, config: CalendarConfig) => Promise<boolean>;
  saving: boolean;
}) {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userConfig, setUserConfig] = useState<CalendarConfig | null>(null);

  const handleEditUser = (config: CalendarConfig) => {
    setEditingUser(config.userId || '');
    setUserConfig(config);
  };

  const handleSaveUserConfig = async () => {
    if (editingUser && userConfig) {
      const success = await onSave(editingUser, userConfig);
      if (success) {
        setEditingUser(null);
        setUserConfig(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="flex items-center gap-2 text-black">
            <Users className="h-5 w-5 text-green-600" />
            User Calendar Configurations
          </CardTitle>
          <CardDescription className="text-black">
            Manage individual user calendar integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="space-y-4">
            {configs.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-black">No user calendar configurations found.</p>
              </div>
            ) : (
              configs.map((config, index) => (
                <Card key={index} className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-black">User Configuration</h4>
                        <p className="text-sm text-gray-600 mt-1">
                        Provider: {config.provider} | 
                        Status: {config.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                      {config.credentials?.serviceAccountEmail && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                          Service Account: {config.credentials.serviceAccountEmail}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.enabled ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}>
                        {config.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditUser(config)}
                          className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Configuration Editor */}
      {editingUser && userConfig && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center gap-2 text-black">
              <Key className="h-5 w-5 text-green-600" />
              Edit User Calendar Configuration
            </CardTitle>
            <CardDescription className="text-black">
              Configure calendar integration for this specific user
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Switch
                checked={userConfig.enabled}
                onCheckedChange={(checked) => 
                  setUserConfig(prev => prev ? { ...prev, enabled: checked } : null)
                }
                label="Enable Calendar"
                description="Allow this user to use calendar integration"
                variant={userConfig.enabled ? "success" : "default"}
                disabled={saving}
                loading={saving}
              />

              <div className="space-y-2">
                <Label className="text-black">Provider</Label>
                <Select
                  value={userConfig.provider}
                  onValueChange={(value: any) => 
                    setUserConfig(prev => prev ? { ...prev, provider: value } : null)
                  }
                >
                  <SelectTrigger className="bg-white text-black border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="apple">Apple Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {userConfig.provider !== 'none' && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="userServiceAccountEmail" className="text-black">Service Account Email</Label>
                  <Input
                    id="userServiceAccountEmail"
                    type="email"
                    placeholder="service-account@project.iam.gserviceaccount.com"
                    value={userConfig.credentials?.serviceAccountEmail || ''}
                    onChange={(e) => 
                      setUserConfig(prev => prev ? {
                        ...prev,
                        credentials: {
                          serviceAccountEmail: e.target.value,
                          privateKey: prev.credentials?.privateKey || '',
                          calendarId: prev.credentials?.calendarId || '',
                          timeZone: prev.credentials?.timeZone || '',
                        },
                      } : null)
                    }
                      className="bg-white text-black border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="userPrivateKey" className="text-black">Private Key</Label>
                  <Textarea
                    id="userPrivateKey"
                    placeholder="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
                    rows={4}
                    value={userConfig.credentials?.privateKey || ''}
                    onChange={(e) => 
                      setUserConfig(prev => prev ? {
                        ...prev,
                        credentials: {
                          serviceAccountEmail: prev.credentials?.serviceAccountEmail || '',
                          privateKey: e.target.value,
                          calendarId: prev.credentials?.calendarId || '',
                          timeZone: prev.credentials?.timeZone || '',
                        },
                      } : null)
                    }
                      className="font-mono text-sm bg-white text-black border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="userCalendarId" className="text-black">Calendar ID</Label>
                    <Input
                      id="userCalendarId"
                      placeholder="primary"
                      value={userConfig.credentials?.calendarId || ''}
                      onChange={(e) => 
                        setUserConfig(prev => prev ? {
                          ...prev,
                          credentials: {
                            serviceAccountEmail: prev.credentials?.serviceAccountEmail || '',
                            privateKey: prev.credentials?.privateKey || '',
                            calendarId: e.target.value,
                            timeZone: prev.credentials?.timeZone || '',
                          },
                        } : null)
                      }
                        className="bg-white text-black border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="userTimeZone" className="text-black">Time Zone</Label>
                    <Select
                      value={userConfig.credentials?.timeZone || 'America/Mexico_City'}
                      onValueChange={(value) => 
                        setUserConfig(prev => prev ? {
                          ...prev,
                          credentials: {
                            serviceAccountEmail: prev.credentials?.serviceAccountEmail || '',
                            privateKey: prev.credentials?.privateKey || '',
                            calendarId: prev.credentials?.calendarId || '',
                            timeZone: value,
                          },
                        } : null)
                      }
                    >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Mexico_City">Mexico City</SelectItem>
                        <SelectItem value="America/New_York">New York</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingUser(null);
                  setUserConfig(null);
                }}
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveUserConfig}
                disabled={saving}
                variant="outline"
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
