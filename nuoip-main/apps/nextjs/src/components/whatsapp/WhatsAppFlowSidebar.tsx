"use client"

import { Smartphone, Settings, MessageSquare, Users, Activity, ChevronDown, UserCheck, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type WhatsAppFlowView = 'sessions' | 'messages' | 'contacts' | 'settings' | 'analytics' | 'delegation' | 'linking'

interface WhatsAppFlowSidebarProps {
  currentView: WhatsAppFlowView
  onViewChange: (view: WhatsAppFlowView) => void
  tenantId?: string
  className?: string
}

interface SidebarSection {
  title: string
  items: Array<{
    id: WhatsAppFlowView
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

const sections: SidebarSection[] = [
  {
    title: 'Gestión',
    items: [
      {
        id: 'sessions',
        label: 'Sesiones WhatsApp',
        description: 'Gestiona sesiones activas',
        icon: Smartphone,
      },
      {
        id: 'messages',
        label: 'Mensajes',
        description: 'Historial de conversaciones',
        icon: MessageSquare,
      },
      {
        id: 'contacts',
        label: 'Contactos',
        description: 'Lista de contactos WhatsApp',
        icon: Users,
      },
      {
        id: 'linking',
        label: 'Vinculación',
        description: 'Vincular contactos con usuarios',
        icon: Link2,
      },
    ],
  },
  {
    title: 'Análisis',
    items: [
      {
        id: 'analytics',
        label: 'Analíticas',
        description: 'Métricas y estadísticas',
        icon: Activity,
      },
      {
        id: 'delegation',
        label: 'Delegación',
        description: 'Gestionar mensajes pendientes',
        icon: UserCheck,
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        id: 'settings',
        label: 'Configuración',
        description: 'Ajustes de sesiones',
        icon: Settings,
      },
    ],
  },
]

const viewLabels: Record<WhatsAppFlowView, string> = {
  sessions: 'Sesiones WhatsApp',
  messages: 'Mensajes',
  contacts: 'Contactos',
  settings: 'Configuración',
  analytics: 'Analíticas',
  delegation: 'Delegación',
  linking: 'Vinculación',
}

export function WhatsAppFlowSidebar({
  currentView,
  onViewChange,
  tenantId,
  className,
}: WhatsAppFlowSidebarProps) {
  const currentSection = sections.flatMap((s) => s.items).find((item) => item.id === currentView)
  const CurrentIcon = currentSection?.icon || Smartphone

  return (
    <div className={cn('w-72 flex flex-col h-full admin-sidebar bg-white', className)}>
      {/* Header with Dropdown - Fixed */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors bg-white">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
                  <CurrentIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-black">
                    {viewLabels[currentView]}
                  </div>
                  <div className="text-xs text-gray-600">WhatsApp Flow</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px] bg-white border-gray-200">
            <DropdownMenuLabel className="text-black">Cambiar Vista</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            {sections.flatMap((section) =>
              section.items.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'cursor-pointer',
                      currentView === item.id && 'bg-green-50'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium text-black">{item.label}</div>
                      <div className="text-xs text-gray-600">
                        {item.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Menu - Scrollable */}
      <ScrollArea className="flex-1 bg-white">
        <div className="p-4 space-y-6 bg-white">
          {sections.map((section, sectionIndex) => (
            <div key={section.title}>
              <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                {section.title.toUpperCase()}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentView === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        'w-full flex items-start space-x-3 p-3 rounded-lg transition-colors text-left',
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-gray-50 text-black'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
                          isActive
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm font-semibold',
                            isActive
                              ? 'text-green-700'
                              : 'text-black'
                          )}
                        >
                          {item.label}
                        </div>
                        <div className="text-xs mt-0.5 text-gray-600 line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {sectionIndex < sections.length - 1 && (
                <Separator className="my-4 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

