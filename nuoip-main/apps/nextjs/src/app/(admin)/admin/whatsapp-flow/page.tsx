'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { WhatsAppFlowSidebar } from '@/components/whatsapp/WhatsAppFlowSidebar'
import { WhatsAppSessionsView } from '@/components/whatsapp/WhatsAppSessionsView'
import { WhatsAppMessagesView } from '@/components/whatsapp/WhatsAppMessagesView'
import { WhatsAppContactsView } from '@/components/whatsapp/WhatsAppContactsView'
import { WhatsAppSettingsView } from '@/components/whatsapp/WhatsAppSettingsView'
import { WhatsAppAnalyticsView } from '@/components/whatsapp/WhatsAppAnalyticsView'
import { WhatsAppUserDelegationView } from '@/components/whatsapp/WhatsAppUserDelegationView'
import { WhatsAppContactLinkingView } from '@/components/whatsapp/WhatsAppContactLinkingView'

type WhatsAppFlowView = 'sessions' | 'messages' | 'contacts' | 'settings' | 'analytics' | 'delegation' | 'linking'

const viewTitles = {
  sessions: 'Sesiones WhatsApp',
  messages: 'Mensajes',
  contacts: 'Contactos',
  settings: 'Configuración',
  analytics: 'Analíticas',
  delegation: 'Delegación',
  linking: 'Vinculación',
}

const viewDescriptions = {
  sessions: 'Gestiona y monitorea tus sesiones de WhatsApp',
  messages: 'Historial completo de mensajes y conversaciones',
  contacts: 'Lista de contactos y grupos de WhatsApp',
  settings: 'Configura reglas de enrutamiento y preferencias',
  analytics: 'Métricas y estadísticas de uso de WhatsApp',
  delegation: 'Gestiona mensajes que requieren atención manual',
  linking: 'Vincula contactos de WhatsApp con usuarios o FlowBot',
}

export default function WhatsAppFlowPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<WhatsAppFlowView>('sessions')

  // Check authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">
            Necesitas permisos de Super Admin para acceder a WhatsApp Flow.
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al Admin
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminShellLayout
      sidebar={
        <WhatsAppFlowSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          tenantId={user.tenantId || ''}
        />
      }
      shellTitle={viewTitles[currentView]}
      shellDescription={viewDescriptions[currentView]}
    >
      <div className="h-full w-full">
        <div className="p-4 md:p-6 h-full">
          {currentView === 'sessions' && <WhatsAppSessionsView />}
          {currentView === 'messages' && <WhatsAppMessagesView />}
          {currentView === 'contacts' && <WhatsAppContactsView />}
          {currentView === 'settings' && <WhatsAppSettingsView />}
          {currentView === 'analytics' && <WhatsAppAnalyticsView />}
          {currentView === 'delegation' && <WhatsAppUserDelegationView />}
          {currentView === 'linking' && <WhatsAppContactLinkingView />}
        </div>
      </div>
    </AdminShellLayout>
  )
}

