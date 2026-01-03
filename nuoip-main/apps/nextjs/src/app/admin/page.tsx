'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { AdminDashboardSidebar } from '@/components/layout/AdminDashboardSidebar'
import { useAuthStore } from '@/stores'
import { CalendarConfiguration } from '@/components/admin/CalendarConfiguration'
import { OverviewTab } from '@/features/admin/components/OverviewTab'
import { MemoryTab } from '@/features/admin/components/MemoryTab'
import { TenantManagementSection } from '@/features/admin/components/TenantManagementSection'
import { UserManagementSection } from '@/features/admin/components/UserManagementSection'
import { SystemSettingsSection } from '@/features/admin/components/SystemSettingsSection'
import { ScheduleManagementSection } from '@/features/admin/components/ScheduleManagementSection'
import { AppointmentsDashboard } from '@/features/admin/components/AppointmentsDashboard'
import { PaymentManagementSection } from '@/features/admin/components/PaymentManagementSection'
import { PaymentCatalogSection } from '@/features/admin/components/PaymentCatalogSection'
import { ConversationFlowConfigurator } from '@/features/admin/components/ConversationFlowConfigurator'
import { FlowDesignerPanel } from '@/features/admin/components/FlowDesignerPanel'
import { AdminThemeSwitcher } from '@/features/admin/components/AdminThemeSwitcher'
import { FlowCalibrationPanel } from '@/features/admin/components/FlowCalibrationPanel'
import { PaymentReportsTab } from '@/features/admin/components/PaymentReportsTab'
import { useAdminTheme } from '@/hooks/use-admin-theme'
import VapidKeysManager from './system/vapid/page'
import { TenantRegistrationApprovalsSection } from '@/features/admin/components/TenantRegistrationApprovalsSection'
import { DepartmentManagementSection } from '@/features/admin/components/DepartmentManagementSection'
import { InventoryManager } from '@/features/admin/components/catalog/InventoryManager'
import { DeliveryManager } from '@/features/admin/components/catalog/DeliveryManager'
import {
  getAdminStats,
  getMemoryDetails as getMemoryDetailsApi,
} from '@/features/admin/api/admin-api'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [memoryDetails, setMemoryDetails] = useState<any>(null)
  const [loadingMemory, setLoadingMemory] = useState(false)
  const [memoryError, setMemoryError] = useState<string | null>(null)

  const { theme, availableThemes, selectTheme, loading: themeLoading } = useAdminTheme()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    if (user && !['admin', 'super_admin'].includes(user.role)) {
      router.push('/')
      return
    }

    if (user) {
      getAdminStats()
        .then(setStats)
        .catch(console.error)
    }
  }, [user, isAuthenticated, isLoading, router])

  const fetchMemoryDetails = useCallback(async () => {
    setLoadingMemory(true)
    setMemoryError(null)
    try {
      const data = await getMemoryDetailsApi()
      setMemoryDetails(data)
    } catch (error) {
      if (error instanceof Error) {
        setMemoryError(error.message || 'Failed to load memory details')
      } else {
        setMemoryError('Failed to load memory details')
      }
    } finally {
      setLoadingMemory(false)
    }
  }, [])

  // Auto-load memory details when memory tab is selected
  useEffect(() => {
    if (activeTab === 'memory' && !memoryDetails && !loadingMemory && !memoryError) {
      fetchMemoryDetails()
    }
  }, [activeTab, memoryDetails, loadingMemory, memoryError, fetchMemoryDetails])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  const isSuperAdmin = user.role === 'super_admin'
  const canManageUsers = user.role === 'super_admin' || user.role === 'admin'

  return (
    <AdminShellLayout
      sidebar={
        <AdminDashboardSidebar
          currentTab={activeTab}
          onTabChange={setActiveTab}
          isSuperAdmin={isSuperAdmin}
          canManageUsers={canManageUsers}
          tenantId={user.tenantId}
        />
      }
    >
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}

          {activeTab === 'memory' && (
            <MemoryTab details={memoryDetails} loading={loadingMemory} error={memoryError} onRetry={fetchMemoryDetails} />
          )}

          {activeTab === 'tenants' && isSuperAdmin && <TenantManagementSection />}

          {/* Always mount UserManagementSection if user can manage users, so event listeners work from tenant management */}
          {canManageUsers && (
            <div className={activeTab === 'users' ? '' : 'hidden'}>
              <UserManagementSection
                stats={stats}
                actorRole={(user.role as 'admin' | 'super_admin') || 'admin'}
                actorTenantId={user.tenantId ?? null}
              />
            </div>
          )}

          {activeTab === 'registrations' && isSuperAdmin && <TenantRegistrationApprovalsSection />}

          {activeTab === 'schedule' && isSuperAdmin && <ScheduleManagementSection tenantId={user.tenantId} />}

          {activeTab === 'departments' && <DepartmentManagementSection tenantId={user.tenantId || ''} />}

          {activeTab === 'calendar' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="mb-4 text-lg font-medium">Calendar Configuration</h3>
                  <CalendarConfiguration tenantId={user.tenantId || ''} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && isSuperAdmin && <AppointmentsDashboard />}

          {activeTab === 'crm' && canManageUsers && (
            <div className="rounded-lg admin-card">
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--admin-card-header-text)] mb-2">
                      CRM Hub
                    </h3>
                    <p className="text-[color:var(--admin-card-text)] max-w-md">
                      El CRM Hub ahora tiene su propia interfaz dedicada con menú lateral completo y herramientas avanzadas de gestión.
                    </p>
                  </div>
                  <Link
                    href="/admin/crm"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Ir al CRM Hub
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && isSuperAdmin && <SystemSettingsSection />}

          {activeTab === 'vapid' && isSuperAdmin && <VapidKeysManager />}

          {activeTab === 'paymentCatalog' && isSuperAdmin && <PaymentCatalogSection />}

          {activeTab === 'payments' && isSuperAdmin && <PaymentManagementSection tenantId={user.tenantId || undefined} />}

          {activeTab === 'paymentReports' && isSuperAdmin && <PaymentReportsTab tenantId={user.tenantId || undefined} />}

          {activeTab === 'inventory' && isSuperAdmin && <InventoryManager />}

          {activeTab === 'delivery' && isSuperAdmin && <DeliveryManager />}

          {activeTab === 'conversationFlow' && <ConversationFlowConfigurator />}

          {activeTab === 'flowDesigner' && isSuperAdmin && <FlowDesignerPanel />}

          {activeTab === 'flowCalibration' && isSuperAdmin && <FlowCalibrationPanel />}

          {activeTab === 'interfaceTheme' && (
            <AdminThemeSwitcher
              currentTheme={theme}
              availableThemes={availableThemes}
              onSelect={selectTheme}
              loading={themeLoading}
            />
          )}
        </div>
      </div>
    </AdminShellLayout>
  )
}