'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { CommunicationHubSidebar } from '@/components/communications/CommunicationHubSidebar'
import { CommunicationComposer } from '@/features/communications/components/CommunicationComposer'
import { CommunicationOverview } from '@/features/communications/components/CommunicationOverview'
import { CommunicationSettingsPanel } from '@/features/communications/components/CommunicationSettingsPanel'
import { CommunicationTemplatesManager } from '@/features/communications/components/CommunicationTemplatesManager'
import { CommunicationTemplateStudio } from '@/features/communications/components/CommunicationTemplateStudio'
import { CommunicationComponentLibrary } from '@/features/communications/components/CommunicationComponentLibrary'

type HubView = 'overview' | 'composer' | 'templates' | 'studio' | 'components' | 'settings'

const viewTitles = {
  overview: 'Resumen Ejecutivo',
  composer: 'Composer Multi-Canal',
  templates: 'Plantillas y Contenidos',
  studio: 'Template Studio',
  components: 'Biblioteca de Componentes',
  settings: 'Conectores & Credenciales',
}

const viewDescriptions = {
  overview: 'Indicadores y métricas en tiempo real de tus comunicaciones',
  composer: 'Crea y envía mensajes a través de múltiples canales',
  templates: 'Gestiona plantillas de mensajes y contenidos reutilizables',
  studio: 'Diseña layouts personalizados con componentes visuales',
  components: 'Gestiona componentes reutilizables para tus plantillas',
  settings: 'Configura canales, proveedores y credenciales',
}

export default function CommunicationHubPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<HubView>('overview')

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
            Necesitas permisos de Super Admin para acceder al Communication Hub.
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
        <CommunicationHubSidebar
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
          {currentView === 'overview' && <CommunicationOverview />}
          {currentView === 'composer' && <CommunicationComposer />}
          {currentView === 'templates' && <CommunicationTemplatesManager />}
          {currentView === 'studio' && <CommunicationTemplateStudio />}
          {currentView === 'components' && <CommunicationComponentLibrary />}
          {currentView === 'settings' && <CommunicationSettingsPanel />}
        </div>
      </div>
    </AdminShellLayout>
  )
}
