"use client"

import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, ChevronDown, Smartphone } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ShellType = 'dashboard' | 'communications' | 'crm' | 'whatsapp-flow'

interface Shell {
  id: ShellType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: string
}

const shells: Shell[] = [
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Gestión general del sistema',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    id: 'communications',
    name: 'Communication Hub',
    description: 'Centro omnicanal de mensajería',
    icon: MessageSquare,
    path: '/admin/communications',
  },
  {
    id: 'crm',
    name: 'CRM Hub',
    description: 'Gestión de relaciones con clientes',
    icon: Users,
    path: '/admin/crm',
  },
  {
    id: 'whatsapp-flow',
    name: 'WhatsApp Flow',
    description: 'Gestión de sesiones WhatsApp con FlowBot',
    icon: Smartphone,
    path: '/admin/whatsapp-flow',
  },
]

export function AdminShellSelector() {
  const router = useRouter()
  const pathname = usePathname()

  // Determine current shell based on pathname
  const currentShell = pathname?.includes('/admin/whatsapp-flow')
    ? shells[3]
    : pathname?.includes('/admin/communications')
    ? shells[1]
    : pathname?.includes('/admin/crm')
    ? shells[2]
    : shells[0]

  const CurrentIcon = currentShell.icon

  const handleShellChange = (shell: Shell) => {
    router.push(shell.path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 px-4 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800",
            "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all"
          )}
        >
          <CurrentIcon className="mr-2 h-4 w-4 text-slate-700 dark:text-slate-300" />
          <span className="font-semibold">{currentShell.name}</span>
          {currentShell.badge && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500 dark:bg-blue-600 text-white rounded">
              {currentShell.badge}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="p-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
            CAMBIAR VISTA
          </div>
          {shells.map((shell) => {
            const Icon = shell.icon
            const isActive = shell.id === currentShell.id

            return (
              <DropdownMenuItem
                key={shell.id}
                onClick={() => handleShellChange(shell)}
                className={cn(
                  "cursor-pointer rounded-lg p-3 mb-1",
                  "hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700",
                  isActive && "bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 focus:bg-blue-100 dark:focus:bg-blue-950"
                )}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isActive 
                      ? "bg-blue-500 dark:bg-blue-600 text-white" 
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-slate-100"
                      )}>
                        {shell.name}
                      </div>
                      {shell.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500 dark:bg-blue-600 text-white rounded">
                          {shell.badge}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-blue-600 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"
                    )}>
                      {shell.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
