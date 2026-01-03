"use client"

import { MessageSquare, Send, FileText, Sliders, Settings, ChevronDown } from 'lucide-react'
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

type HubView = 'overview' | 'composer' | 'templates' | 'studio' | 'components' | 'settings'

interface CommunicationHubSidebarProps {
  currentView: HubView
  onViewChange: (view: HubView) => void
  tenantId?: string
  className?: string
}

interface SidebarSection {
  title: string
  items: Array<{
    id: HubView
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

const sections: SidebarSection[] = [
  {
    title: 'Paneles',
    items: [
      {
        id: 'overview',
        label: 'Resumen Ejecutivo',
        description: 'Indicadores en tiempo real',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      {
        id: 'composer',
        label: 'Composer Multi-Canal',
        description: 'Envía mensajes inmediatos',
        icon: Send,
      },
      {
        id: 'templates',
        label: 'Plantillas y Contenidos',
        description: 'Gestiona experiencias',
        icon: FileText,
      },
      {
        id: 'studio',
        label: 'Template Studio',
        description: 'Arma layouts con componentes',
        icon: Sliders,
      },
      {
        id: 'components',
        label: 'Biblioteca de Componentes',
        description: 'Gestiona componentes reutilizables',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        id: 'settings',
        label: 'Conectores & Credenciales',
        description: 'Canales y proveedores',
        icon: Settings,
      },
    ],
  },
]

export function CommunicationHubSidebar({
  currentView,
  onViewChange,
  tenantId,
  className,
}: CommunicationHubSidebarProps) {
  const currentSection = sections.flatMap((s) => s.items).find((item) => item.id === currentView)
  const CurrentIcon = currentSection?.icon || MessageSquare

  return (
    <div className={cn('w-72 flex flex-col h-full admin-sidebar', className)}>
      {/* Header with Dropdown - Fixed */}
      <div className="flex-shrink-0 px-4 py-5">
        <div className="mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm mb-4 shadow-lg">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-black">Communication Hub</h2>
          <p className="text-xs text-slate-700">Gestión Omnicanal</p>
        </div>

        {/* View Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full justify-between h-auto py-3 px-3 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 text-left flex items-center"
            >
              <CurrentIcon className="h-4 w-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-black truncate">{currentSection?.label}</div>
                <div className="text-xs text-slate-700 truncate">{currentSection?.description}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-700 ml-2 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 bg-white border-slate-300" align="start">
            {sections.map((section, idx) => (
              <div key={section.title}>
                {idx > 0 && <DropdownMenuSeparator className="bg-slate-300" />}
                <DropdownMenuLabel className="text-slate-700 text-xs font-semibold">{section.title}</DropdownMenuLabel>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentView === item.id
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        "cursor-pointer",
                        "text-black",
                        "hover:text-black",
                        "hover:bg-slate-100",
                        "focus:bg-slate-100 focus:text-black",
                        isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      )}
                    >
                      <Icon className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "text-blue-600" : "text-slate-700"
                      )} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black">{item.label}</div>
                        <div className={cn(
                          "text-xs",
                          isActive ? "text-blue-700" : "text-slate-600"
                        )}>{item.description}</div>
                      </div>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 ml-2" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator className="my-4 bg-slate-300" />
      </div>

      {/* Navigation Menu - Scrollable */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="px-3 text-xs font-semibold text-slate-700 uppercase tracking-wider admin-nav-section-title">
                {section.title}
              </h3>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentView === item.id

                  return (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full text-left py-3 px-3 rounded-lg transition-all duration-200',
                        'admin-nav-item',
                        isActive && 'admin-nav-item-active'
                      )}
                      onClick={() => onViewChange(item.id)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <Icon
                          className={cn(
                            'h-4 w-4 mt-0.5 flex-shrink-0 transition-colors',
                            isActive ? 'text-blue-600' : 'text-slate-700'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              'text-sm font-medium truncate transition-colors',
                              isActive ? 'text-blue-600' : 'text-black'
                            )}
                          >
                            {item.label}
                          </div>
                          <p
                            className={cn(
                              'text-xs mt-0.5 line-clamp-2 transition-colors',
                              isActive ? 'text-blue-700' : 'text-slate-600'
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Tenant Info - Fixed at Bottom */}
      {tenantId && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-300">
          <div className="text-xs">
            <div className="font-medium mb-1 text-slate-700">Tenant Activo</div>
            <div className="truncate text-black font-mono text-[11px]">{tenantId}</div>
          </div>
        </div>
      )}
    </div>
  )
}

