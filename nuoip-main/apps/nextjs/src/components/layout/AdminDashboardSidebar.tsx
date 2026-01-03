"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Database,
  Calendar,
  CreditCard,
  Settings,
  GitBranch,
  Palette,
  Key,
  UserCheck,
  BarChart3,
  Building2,
  BookOpen,
  Package,
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { getTenants } from '@/features/admin/api/admin-api'

interface AdminDashboardSidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
  isSuperAdmin: boolean
  canManageUsers: boolean
  tenantId?: string | null
  className?: string
}

interface Tenant {
  id: string
  name: string
  logoUrl?: string | null
  logoWidth?: number | null
  logoHeight?: number | null
}

interface SidebarSection {
  title: string
  items: Array<{
    id: string
    label: string
    description?: string
    icon: React.ComponentType<{ className?: string }>
    visible: boolean
    badge?: string
  }>
}

export function AdminDashboardSidebar({
  currentTab,
  onTabChange,
  isSuperAdmin = false,
  canManageUsers = false,
  tenantId,
  className,
}: AdminDashboardSidebarProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loadingTenant, setLoadingTenant] = useState(true)

  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantId) {
        setLoadingTenant(false)
        return
      }

      try {
        const response = await getTenants()
        const tenants = Array.isArray(response) ? response : response.tenants || []
        const foundTenant = tenants.find((t: Tenant) => t.id === tenantId)
        if (foundTenant) {
          setTenant(foundTenant)
        }
      } catch (error) {
        console.error('Failed to fetch tenant:', error)
      } finally {
        setLoadingTenant(false)
      }
    }

    void fetchTenant()
  }, [tenantId])

  const sections: SidebarSection[] = [
    {
      title: 'General',
      items: [
        {
          id: 'overview',
          label: 'System Overview',
          description: 'Dashboard principal',
          icon: LayoutDashboard,
          visible: true,
        },
        {
          id: 'memory',
          label: 'Memory Details',
          description: 'Detalles de memoria',
          icon: Database,
          visible: true,
        },
      ],
    },
    {
      title: 'Gestión de Entidades',
      items: [
        {
          id: 'tenants',
          label: 'Tenant Management',
          description: 'Gestión de tenants',
          icon: Building2,
          visible: isSuperAdmin,
        },
        {
          id: 'users',
          label: 'User Management',
          description: 'Gestión de usuarios',
          icon: Users,
          visible: canManageUsers,
        },
        {
          id: 'registrations',
          label: 'Tenant Registrations',
          description: 'Aprobación de registros',
          icon: UserCheck,
          visible: isSuperAdmin,
        },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        {
          id: 'schedule',
          label: 'Schedule Templates',
          description: 'Plantillas de horarios',
          icon: Calendar,
          visible: isSuperAdmin,
        },
        {
          id: 'departments',
          label: 'Departments',
          description: 'Office areas for scheduling',
          icon: Building2,
          visible: true,
        },
        {
          id: 'calendar',
          label: 'Calendar Configuration',
          description: 'Configuración de calendario',
          icon: Calendar,
          visible: isSuperAdmin,
        },
        {
          id: 'appointments',
          label: 'Appointments & Leads',
          description: 'Citas y prospectos',
          icon: BookOpen,
          visible: isSuperAdmin,
        },
      ],
    },
    {
      title: 'Pagos',
      items: [
        {
          id: 'paymentCatalog',
          label: 'Catalog',
          description: 'Catálogo de productos',
          icon: CreditCard,
          visible: isSuperAdmin,
        },
        {
          id: 'payments',
          label: 'Payment Links',
          description: 'Enlaces de pago',
          icon: CreditCard,
          visible: isSuperAdmin,
        },
        {
          id: 'inventory',
          label: 'Inventory',
          description: 'Gestión de inventario',
          icon: Package,
          visible: isSuperAdmin,
        },
        {
          id: 'delivery',
          label: 'Delivery Methods',
          description: 'Métodos de entrega',
          icon: Truck,
          visible: isSuperAdmin,
        },
        {
          id: 'paymentReports',
          label: 'Payment Reports',
          description: 'Reportes de pagos',
          icon: BarChart3,
          visible: isSuperAdmin,
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          id: 'conversationFlow',
          label: 'Conversation Flow',
          description: 'Flujo de conversaciones',
          icon: GitBranch,
          visible: true,
        },
        {
          id: 'flowCalibration',
          label: 'Flow Calibration',
          description: 'Calibración de flujos',
          icon: Settings,
          visible: isSuperAdmin,
        },
        {
          id: 'system',
          label: 'System Settings',
          description: 'Configuración del sistema',
          icon: Settings,
          visible: isSuperAdmin,
        },
        {
          id: 'vapid',
          label: 'VAPID Keys',
          description: 'Claves de notificaciones',
          icon: Key,
          visible: isSuperAdmin,
        },
        {
          id: 'interfaceTheme',
          label: 'Interface Theme',
          description: 'Tema de interfaz',
          icon: Palette,
          visible: true,
        },
      ],
    },
  ]

  return (
    <div className={cn('w-72 flex flex-col h-full admin-sidebar', className)}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-4 py-5">
        <div className="mb-5">
          <div className="flex h-14 w-14 items-center justify-center mb-4 bg-white/10 rounded-xl backdrop-blur-sm">
            {isSuperAdmin ? (
              // For system admin, show "workdin" text for FlowCast
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-lg font-bold text-black">workdin</span>
              </div>
            ) : tenant?.logoUrl ? (
              // Show tenant logo if available
              <Image
                src={tenant.logoUrl}
                alt={tenant.name || 'Tenant Logo'}
                width={tenant.logoWidth || 48}
                height={tenant.logoHeight || 48}
                className="rounded-lg object-contain"
                priority
              />
            ) : (
              // Fallback: show tenant name initials or default
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-lg font-bold text-black">
                  {tenant?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-black">Admin Dashboard</h2>
          <p className="text-xs text-slate-700">Sistema de Gestión</p>
        </div>

        <Separator className="bg-slate-300" />
      </div>

      {/* Navigation Menu - Scrollable */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-6">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => item.visible === true)

            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-slate-700 uppercase tracking-wider admin-nav-section-title">
                  {section.title}
                </h3>

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentTab === item.id

                    return (
                      <button
                        key={item.id}
                        className={cn(
                          'w-full text-left py-3 px-3 rounded-lg transition-all duration-200',
                          'admin-nav-item',
                          isActive && 'admin-nav-item-active'
                        )}
                        onClick={() => onTabChange(item.id)}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <Icon
                            className={cn(
                              'h-4 w-4 mt-0.5 flex-shrink-0 transition-colors',
                              isActive ? 'text-blue-600' : 'text-slate-700'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span
                                className={cn(
                                  'text-sm font-medium truncate transition-colors',
                                  isActive ? 'text-blue-600' : 'text-black'
                                )}
                              >
                                {item.label}
                              </span>
                              {item.badge && (
                                <Badge className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-700 border-blue-500/30">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p
                                className={cn(
                                  'text-xs mt-0.5 line-clamp-1 transition-colors',
                                  isActive ? 'text-blue-700' : 'text-slate-600'
                                )}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
