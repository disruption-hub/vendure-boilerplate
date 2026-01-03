'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Copy, RefreshCw, CheckCircle, XCircle, AlertCircle, Key, Shield, Mail, Loader2 } from 'lucide-react'
import { useVapidKeysStore, vapidKeysActions } from '@/stores/vapid-keys-store'

export default function VapidKeysManager() {
  const { vapidKeys, loading, error, fetchVapidKeys, generateNewKeys, updateKeys, testKeys } = useVapidKeysStore()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    publicKey: '',
    privateKey: '',
    subject: 'mailto:admin@ipnuo.com'
  })
  
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchVapidKeys()
  }, [fetchVapidKeys])

  const handleGenerateKeys = async () => {
    await generateNewKeys(formData.email || undefined)
  }

  const handleUpdateKeys = async () => {
    if (!formData.publicKey || !formData.privateKey) {
      vapidKeysActions.copyToClipboard('', '') // This will show error toast
      return
    }

    // Validate keys
    if (!vapidKeysActions.validatePublicKey(formData.publicKey)) {
      vapidKeysActions.copyToClipboard('', '') // This will show error toast
      return
    }

    if (!vapidKeysActions.validatePrivateKey(formData.privateKey)) {
      vapidKeysActions.copyToClipboard('', '') // This will show error toast
      return
    }

    await updateKeys({
      publicKey: formData.publicKey,
      privateKey: formData.privateKey,
      subject: formData.subject
    })
    
    // Clear form after successful update
    setFormData({ email: '', publicKey: '', privateKey: '', subject: 'mailto:admin@ipnuo.com' })
  }

  const handleTestKeys = async () => {
    await testKeys()
  }

  const handleCopyToClipboard = async (text: string, type: string) => {
    await vapidKeysActions.copyToClipboard(text, type)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email })
    if (email && vapidKeysActions.validateEmail(email)) {
      setFormData({ ...formData, email, subject: `mailto:${email}` })
    } else {
      setFormData({ ...formData, email, subject: 'mailto:admin@ipnuo.com' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Key className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold text-black">VAPID Keys Management</h1>
      </div>

      <Alert className="bg-white border-gray-200">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-black">
          VAPID keys are required for web push notifications. The public key is safe to expose, 
          but the private key must be kept secret and only used on your server.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert className="border-red-500 bg-white">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-black">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current VAPID Keys Status */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="flex items-center gap-2 text-black">
            <Key className="h-5 w-5 text-green-600" />
            Current Configuration
          </CardTitle>
          <CardDescription className="text-black">
            View and manage your current VAPID keys configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          {vapidKeys ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
                <span className="text-sm text-black">
                  Last updated: {new Date(vapidKeys.updatedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-black">Public Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={vapidKeys.publicKey} 
                    readOnly 
                    className="font-mono text-sm bg-white text-black border-gray-300"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyToClipboard(vapidKeys.publicKey, 'public')}
                    disabled={loading}
                    className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  >
                    {copied === 'public' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black">Subject</Label>
                <Input 
                  value={vapidKeys.subject} 
                  readOnly 
                  className="bg-white text-black border-gray-300"
                  style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestKeys} 
                  disabled={loading} 
                  variant="outline"
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                  style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                  Test Keys
                </Button>
                <Button 
                  onClick={handleGenerateKeys} 
                  disabled={loading} 
                  variant="outline"
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                  style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Generate New Keys
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-black mb-4">No VAPID keys configured</p>
              <Button 
                onClick={handleGenerateKeys} 
                disabled={loading}
                variant="outline"
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                Generate VAPID Keys
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate with Custom Email */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="flex items-center gap-2 text-black">
            <Mail className="h-5 w-5 text-green-600" />
            Generate with Custom Email
          </CardTitle>
          <CardDescription className="text-black">
            Generate new VAPID keys with your custom email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-black">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="admin@yourdomain.com"
              className={`bg-white text-black border-gray-300 ${formData.email && !vapidKeysActions.validateEmail(formData.email) ? 'border-red-500' : ''}`}
              style={{ backgroundColor: 'white', color: 'black', borderColor: formData.email && !vapidKeysActions.validateEmail(formData.email) ? '#ef4444' : '#d1d5db' }}
            />
            {formData.email && !vapidKeysActions.validateEmail(formData.email) && (
              <p className="text-sm text-red-500">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-black">Subject (Auto-generated)</Label>
            <Input
              value={formData.subject}
              readOnly
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
          </div>

          <Button 
            onClick={handleGenerateKeys} 
            disabled={loading || Boolean(formData.email?.trim() && !vapidKeysActions.validateEmail(formData.email))}
            variant="outline"
            className="w-full bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
            style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Generate Keys with Custom Email
          </Button>
        </CardContent>
      </Card>

      {/* Manual Key Entry */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-black">Manual Key Entry</CardTitle>
          <CardDescription className="text-black">
            Enter your own VAPID keys if you have them from another source
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-black">Subject (Email or URL)</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="mailto:admin@yourdomain.com"
              className="bg-white text-black border-gray-300"
              style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicKey" className="text-black">Public Key</Label>
            <Input
              id="publicKey"
              value={formData.publicKey}
              onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
              placeholder="BFxR5T0C3FMeB2WJaobv6NiX394ppFBSapfGMFv7b32s8JCt1jxQ7AlkYFXrSofyUO3cGN0Lj30-16zyBEaLWOM"
              className={`font-mono text-sm bg-white text-black border-gray-300 ${formData.publicKey && !vapidKeysActions.validatePublicKey(formData.publicKey) ? 'border-red-500' : ''}`}
              style={{ backgroundColor: 'white', color: 'black', borderColor: formData.publicKey && !vapidKeysActions.validatePublicKey(formData.publicKey) ? '#ef4444' : '#d1d5db' }}
            />
            {formData.publicKey && !vapidKeysActions.validatePublicKey(formData.publicKey) && (
              <p className="text-sm text-red-500">Invalid public key format</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="privateKey" className="text-black">Private Key</Label>
            <div className="flex gap-2">
              <Input
                id="privateKey"
                type={showPrivateKey ? 'text' : 'password'}
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                placeholder="O6-g_hWqA92kvfPS9oFGxY_beDatEKZuA91-eoI3fJE"
                className={`font-mono text-sm bg-white text-black border-gray-300 ${formData.privateKey && !vapidKeysActions.validatePrivateKey(formData.privateKey) ? 'border-red-500' : ''}`}
                style={{ backgroundColor: 'white', color: 'black', borderColor: formData.privateKey && !vapidKeysActions.validatePrivateKey(formData.privateKey) ? '#ef4444' : '#d1d5db' }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
              >
                {showPrivateKey ? 'Hide' : 'Show'}
              </Button>
            </div>
            {formData.privateKey && !vapidKeysActions.validatePrivateKey(formData.privateKey) && (
              <p className="text-sm text-red-500">Invalid private key format</p>
            )}
          </div>

          <Button 
            onClick={handleUpdateKeys} 
            disabled={loading || !formData.publicKey || !formData.privateKey || 
              !vapidKeysActions.validatePublicKey(formData.publicKey) || 
              !vapidKeysActions.validatePrivateKey(formData.privateKey)}
            variant="outline"
            className="w-full bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
            style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
            Update VAPID Keys
          </Button>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-black">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          <div className="space-y-2">
            <h4 className="font-semibold text-black">1. Generate or Configure Keys</h4>
            <p className="text-sm text-black">
              Use the &quot;Generate New Keys&quot; button to create new VAPID keys, or manually enter your own keys.
              You can specify a custom email address for the subject field.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-black">2. Update Your PWA</h4>
            <p className="text-sm text-black">
              Copy the public key and update your PWA&apos;s push notification subscription code.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-black">3. Test Configuration</h4>
            <p className="text-sm text-black">
              Use the &quot;Test Keys&quot; button to verify your VAPID keys are working correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
