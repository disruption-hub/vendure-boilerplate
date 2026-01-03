"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LogOut, UserCog, User, Settings, MessageCircle, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import NotificationToggle from '@/components/NotificationToggle';

interface HeaderProps {
  variant?: 'default' | 'admin';
  forceWhiteText?: boolean; // Force white text for dark backgrounds (e.g., landing page)
}

export function Header({ variant = 'default', forceWhiteText = false }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdminVariant = variant === 'admin';
  const [logoVariant, setLogoVariant] = useState<'default' | 'inverted'>('default');
  
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

  // Admin panel is now integrated into the main app
  const ADMIN_PANEL_URL = '/admin';

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const parseColor = (value: string | null | undefined) => {
      if (!value) return null;
      const cleaned = value.trim();

      if (cleaned.startsWith('#')) {
        const hex = cleaned.length === 4
          ? `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`
          : cleaned;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      }

      const rgbMatch = cleaned.match(/rgba?\(([^)]+)\)/);
      if (rgbMatch) {
        const [r, g, b] = rgbMatch[1].split(',').map(part => parseInt(part.trim(), 10));
        if ([r, g, b].every(component => Number.isFinite(component))) {
          return { r, g, b };
        }
      }

      return null;
    };

    const computeBrightness = (color: { r: number; g: number; b: number } | null) => {
      if (!color) return 255;
      return (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    };

    const evaluateLogoVariant = () => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const adminBackground = styles.getPropertyValue('--admin-body-background');
      const defaultBackground = styles.getPropertyValue('--color-background');
      const targetColor = isAdminVariant ? adminBackground || defaultBackground : defaultBackground;
      const brightness = computeBrightness(parseColor(targetColor));
      setLogoVariant(brightness < 165 ? 'inverted' : 'default');
    };

    evaluateLogoVariant();
    const observer = new MutationObserver(evaluateLogoVariant);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-admin-theme-name', 'style'],
    });

    window.addEventListener('themechange', evaluateLogoVariant as EventListener);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', evaluateLogoVariant as EventListener);
    };
  }, [isAdminVariant]);


  const headerClass = clsx(
    'sticky top-0 left-0 right-0 z-50 w-full border-b backdrop-blur transition-colors',
    'supports-[backdrop-filter]:bg-background/95 supports-[backdrop-filter]:backdrop-blur-sm',
    isAdminVariant
      ? 'bg-[color:var(--admin-header-background)] border-[color:var(--admin-header-border)] text-[color:var(--admin-header-text)] shadow-[0_8px_24px_rgba(8,20,46,0.45)]'
      : forceWhiteText
        ? 'bg-background/95 text-white border-white/10'
        : 'bg-background/95'
  );

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className={clsx(
              "text-lg sm:text-xl font-extrabold tracking-tight",
              forceWhiteText && "text-white"
            )}>
              FlowCast
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-4">
              {/* Public navigation items visible even when authenticated */}
              <Link href="/flowchat" className={clsx(
                "text-sm font-medium hover:opacity-80 transition",
                forceWhiteText ? "text-white" : "text-foreground"
              )}>
                FlowChat
              </Link>
              <Link href="/flowbot" className={clsx(
                "text-sm font-medium hover:opacity-80 transition",
                forceWhiteText ? "text-white" : "text-foreground"
              )}>
                FlowBot
              </Link>
              {/* Chat Dashboard Button */}
              <Link href={chatDashboardUrl}>
                <Button
                  size="sm"
                  className={clsx(
                    "font-semibold",
                    forceWhiteText
                      ? "bg-[#7bff3a] text-[#061101] hover:bg-[#63ff0f]"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat Dashboard
                </Button>
              </Link>
              {/* Admin Dashboard Button - Only for admins */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Link href="/admin">
                  <Button
                    size="sm"
                    variant="outline"
                    className={clsx(
                      "font-semibold",
                      forceWhiteText
                        ? "border-[#7bff3a] text-[#7bff3a] hover:bg-[#7bff3a]/10"
                        : ""
                    )}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              {/* Notifications */}
              <NotificationToggle variant="ghost" size="sm" />
              <div className="relative" ref={menuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={forceWhiteText ? "text-white border-white/30 hover:bg-white/10" : ""}
                >
                  <User className={clsx("h-4 w-4 mr-2", forceWhiteText && "text-white")} />
                  {user?.email || 'Cuenta'}
                </Button>

                {showUserMenu && (
                  <div
                    className={clsx(
                      'absolute right-0 mt-2 w-64 rounded-md shadow-lg border z-50',
                      isAdminVariant
                        ? 'bg-[color:var(--admin-card-background)] border-[color:var(--admin-border)]'
                        : 'bg-white'
                    )}
                  >
                    <div className={clsx('px-4 py-3 border-b', isAdminVariant ? 'border-[color:var(--admin-border)]' : 'border-gray-200')}>
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Role: {user?.role}</p>
                    </div>
                    <div className="py-1">
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <Link
                          href={ADMIN_PANEL_URL}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <UserCog className="h-4 w-4 mr-3" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          logout()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/flowchat" className={clsx(
                "text-sm font-medium hover:opacity-80 transition",
                forceWhiteText ? "text-white" : "text-foreground"
              )}>
                FlowChat
              </Link>
              <Link href="/flowbot" className={clsx(
                "text-sm font-medium hover:opacity-80 transition",
                forceWhiteText ? "text-white" : "text-foreground"
              )}>
                FlowBot
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className={forceWhiteText ? "text-white border-white/30 hover:bg-white/10" : ""}>
                  Sign in
                </Button>
              </Link>
              <Link href="/request-access">
                <Button size="sm" className={forceWhiteText ? "bg-[#7bff3a] text-[#061101] hover:bg-[#63ff0f]" : ""}>
                  Solicitar acceso
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={clsx("p-2", forceWhiteText && "text-white hover:bg-white/10")}
              data-mobile-menu-button
            >
              {mobileMenuOpen ? (
                <X className={clsx("h-5 w-5", forceWhiteText && "text-white")} />
              ) : (
                <Menu className={clsx("h-5 w-5", forceWhiteText && "text-white")} />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Lateral Drawer from Right */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="right"
            className="w-80 bg-gradient-to-b from-[#0a281a] to-[#02070b] border-l border-white/10 p-0"
            data-mobile-menu
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Menú</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {isAuthenticated ? (
                  <>
                    {/* User Info */}
                    <div className="pb-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">
                        {user?.email}
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        Role: {user?.role}
                      </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-2">
                      <Link
                        href="/flowchat"
                        className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4 mr-3 text-white" />
                        FlowChat
                      </Link>
                      <Link
                        href="/flowbot"
                        className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4 mr-3 text-white" />
                        FlowBot
                      </Link>

                      {/* Chat Dashboard Button */}
                      <Link
                        href={chatDashboardUrl}
                        className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors bg-[#7bff3a] text-[#061101] hover:bg-[#63ff0f] font-semibold"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4 mr-3" />
                        Chat Dashboard
                      </Link>

                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <>
                          <Link
                            href={ADMIN_PANEL_URL}
                            className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <UserCog className="h-4 w-4 mr-3 text-white" />
                            Admin Panel
                          </Link>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-white">Notifications:</span>
                            <NotificationToggle variant="ghost" size="sm" className="text-white" />
                          </div>
                        </>
                      )}

                      {user?.role !== 'admin' && user?.role !== 'super_admin' && (
                        <>
                          <Link
                            href="/profile"
                            className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-3 text-white" />
                            Profile Settings
                          </Link>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-white">Notifications:</span>
                            <NotificationToggle variant="ghost" size="sm" className="text-white" />
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                      >
                        <LogOut className="h-4 w-4 mr-3 text-white" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  /* Non-authenticated mobile menu */
                  <div className="space-y-2">
                    <Link
                      href="/flowchat"
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4 mr-3 text-white" />
                      FlowChat
                    </Link>
                    <Link
                      href="/flowbot"
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4 mr-3 text-white" />
                      FlowBot
                    </Link>
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <Link
                        href="/auth/signin"
                        className="flex items-center justify-center w-full px-3 py-2 text-sm rounded-md transition-colors border border-white/30 text-white hover:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/request-access"
                        className="flex items-center justify-center w-full px-3 py-2 text-sm rounded-md transition-colors bg-[#7bff3a] text-[#061101] hover:bg-[#63ff0f] font-semibold"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Solicitar acceso
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
