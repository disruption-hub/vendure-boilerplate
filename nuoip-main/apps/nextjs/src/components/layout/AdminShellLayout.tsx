"use client"

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AdminShellSelector } from './AdminShellSelector'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Bell, User, LogOut, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores'

interface AdminShellLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  shellTitle?: string
  shellDescription?: string
}

export function AdminShellLayout({
  children,
  sidebar,
  shellTitle,
  shellDescription,
}: AdminShellLayoutProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // Get locale from current path or default to 'es'
  const locale = (() => {
    const localeMatch = pathname?.match(/^\/([a-z]{2})\//);
    return localeMatch ? localeMatch[1] : 'es';
  })();

  // Build OTP login URL with tenant
  const chatDashboardUrl = (() => {
    const tenantId = user?.tenantId;
    if (tenantId) {
      return `/${locale}/otp-login?tenant=${encodeURIComponent(tenantId)}`;
    }
    return `/${locale}/otp-login`;
  })();

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/signin')
    } catch (error) {
      console.error('AdminShellLayout: logout failed', error)
      router.push('/auth/signin')
    }
  }

  const userInitials = user?.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Left Sidebar - Full Height, Sticky */}
      <aside className="hidden lg:flex lg:flex-col lg:w-auto border-r border-slate-800/50 dark:border-slate-700 sticky top-0 h-screen overflow-y-auto">
        {sidebar}
      </aside>

      {/* Right Side - Header + Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header - Sticky */}
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 shadow-sm dark:shadow-slate-900/50">
          <div className="flex h-16 items-center gap-4 px-6">
            {/* Shell Selector */}
            <AdminShellSelector />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Chat Dashboard Button */}
              <Link href={chatDashboardUrl}>
                <Button
                  size="sm"
                  className="bg-[#7bff3a] text-[#061101] hover:bg-[#63ff0f] font-semibold hidden md:flex"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat Dashboard
                </Button>
              </Link>

              {/* Theme Switcher */}
              <ThemeSwitcher />

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Avatar className="h-10 w-10 ring-2 ring-slate-200 dark:ring-slate-700">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 border-slate-200 dark:border-slate-700 dark:bg-slate-800" align="end">
                  <DropdownMenuLabel className="bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                        {user?.name || 'Usuario'}
                      </p>
                      <p className="text-xs leading-none text-slate-600 dark:text-slate-400">
                        {user?.email}
                      </p>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 w-fit">
                        {user?.role === 'super_admin' ? '⭐ Super Admin' : '👤 Admin'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <Link href="/admin/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100">
                    <Link href="/admin/settings">
                      <User className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 focus:bg-red-50 dark:focus:bg-red-950/50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Optional Shell Title/Description Bar */}
          {(shellTitle || shellDescription) && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-6 py-3">
              {shellTitle && (
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{shellTitle}</h1>
              )}
              {shellDescription && (
                <p className="text-sm text-slate-600 dark:text-slate-300">{shellDescription}</p>
              )}
            </div>
          )}
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
