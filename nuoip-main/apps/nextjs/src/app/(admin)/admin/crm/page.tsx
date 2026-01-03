'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { CrmHubSidebar } from '@/components/crm/CrmHubSidebar'
import { ContactsManager } from '@/features/crm/components/ContactsManager'
import { LeadsManager } from '@/features/crm/components/LeadsManager'
import { TicketManager } from '@/features/crm/components/TicketManager'

type CrmView =
  | 'overview'
  | 'contacts'
  | 'leads'
  | 'opportunities'
  | 'deals'
  | 'activities'
  | 'tickets'
  | 'reports'
  | 'segments'
  | 'campaigns'
  | 'pipeline'
  | 'settings'

const viewTitles: Record<CrmView, string> = {
  overview: 'Dashboard CRM',
  contacts: 'Gestión de Contactos',
  leads: 'Prospectos',
  opportunities: 'Oportunidades',
  deals: 'Deals & Propuestas',
  activities: 'Actividades',
  tickets: 'Sistema de Tickets',
  reports: 'Reportes y Análisis',
  segments: 'Segmentación de Clientes',
  campaigns: 'Campañas de Marketing',
  pipeline: 'Pipeline de Ventas',
  settings: 'Configuración CRM',
}

const viewDescriptions: Record<CrmView, string> = {
  overview: 'Métricas principales y KPIs de tu CRM',
  contacts: 'Base de datos completa de contactos y clientes',
  leads: 'Gestión y seguimiento de leads',
  opportunities: 'Oportunidades de negocio activas',
  deals: 'Gestión de acuerdos y propuestas comerciales',
  activities: 'Llamadas, reuniones, tareas y seguimientos',
  tickets: 'Sistema de soporte y tickets de clientes con IA',
  reports: 'Informes detallados y análisis de rendimiento',
  segments: 'Segmentos y filtros de clientes',
  campaigns: 'Campañas de marketing y comunicación',
  pipeline: 'Visualización del embudo de ventas',
  settings: 'Configuración de campos, etapas y automatización',
}

function CrmHubPageContent() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<CrmView>('overview')

  // Handle redirects from chatbot ticket creation
  useEffect(() => {
    const ticketsParam = searchParams.get('tickets')
    const contactId = searchParams.get('contactId')
    const email = searchParams.get('email')

    if (ticketsParam === 'true') {
      setCurrentView('tickets')
      // Clear the URL parameters after setting the view
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('tickets')
      newUrl.searchParams.delete('contactId')
      newUrl.searchParams.delete('email')
      window.history.replaceState({}, '', newUrl.toString())

      // Log the redirect information for debugging
      console.log('Redirected to CRM tickets from chatbot:', { contactId, email })
    }
  }, [searchParams])

  // Check authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="mobile-text text-slate-600 dark:text-slate-400">Cargando CRM Hub...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center max-w-md w-full">
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mobile-text text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Acceso Denegado</h1>
          <p className="mobile-text text-slate-600 dark:text-slate-400 mb-6">
            Necesitas iniciar sesión para acceder al CRM Hub.
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="touch-target mobile-auth-button px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  // Check if user has CRM access (admin or super_admin)
  const hasAccess = user?.role === 'super_admin' || user?.role === 'admin'

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center max-w-md w-full">
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mobile-text text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Acceso Restringido</h1>
          <p className="mobile-text text-slate-600 dark:text-slate-400 mb-6">
            Necesitas permisos de administrador para acceder al CRM Hub.
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="touch-target mobile-auth-button px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminShellLayout
      sidebar={
        <CrmHubSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          tenantId={user?.tenantId || ''}
        />
      }
      shellTitle={viewTitles[currentView]}
      shellDescription={viewDescriptions[currentView]}
    >
      <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Contacts View */}
          {currentView === 'contacts' && <ContactsManager />}

          {/* Leads View */}
          {currentView === 'leads' && <LeadsManager />}

          {/* Tickets View */}
          {currentView === 'tickets' && <TicketManager />}

          {/* Overview Dashboard */}
          {currentView === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* CRM Overview Metrics */}
              <div className="mobile-card bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Contactos</h3>
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">1,234</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% este mes</p>
              </div>

              <div className="mobile-card bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Leads Activos</h3>
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">89</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+8 nuevos hoy</p>
              </div>

              <div className="mobile-card bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Oportunidades</h3>
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">45</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">$2.5M en pipeline</p>
              </div>

              <div className="mobile-card bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Tasa de Conversión</h3>
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">32%</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+4% vs mes anterior</p>
              </div>
            </div>
          )}

          {/* Placeholder for other views */}
          {currentView !== 'overview' && currentView !== 'contacts' && currentView !== 'leads' && currentView !== 'tickets' && (
            <div className="mobile-card bg-white dark:bg-slate-800 rounded-lg p-6 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
              <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="mobile-text text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {viewTitles[currentView]}
              </h2>
              <p className="mobile-text text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
                Esta sección está en desarrollo. Aquí podrás gestionar {viewDescriptions[currentView].toLowerCase()}.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium border border-green-200 dark:border-green-800">
                🚧 Próximamente disponible
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShellLayout>
  )
}

export default function CrmHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="mobile-text text-slate-600 dark:text-slate-400">Cargando CRM Hub...</p>
        </div>
      </div>
    }>
      <CrmHubPageContent />
    </Suspense>
  )
}
