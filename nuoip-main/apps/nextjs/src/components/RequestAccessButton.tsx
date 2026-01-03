'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface RequestAccessButtonProps {
  tenantId?: string
  tenantName?: string
}

export default function RequestAccessButton({ tenantId, tenantName }: RequestAccessButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRequestAccess = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tenantId) params.set('tenantId', tenantId)
    if (tenantName) params.set('tenantName', tenantName)
    router.push(`/request-access?${params.toString()}`)
  }

  return (
    <Button
      onClick={handleRequestAccess}
      disabled={loading}
      variant="outline"
      className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
      style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
    >
      {loading ? 'Cargando...' : 'Solicitar Acceso'}
    </Button>
  )
}

