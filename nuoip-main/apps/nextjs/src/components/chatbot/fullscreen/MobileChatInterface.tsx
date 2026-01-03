"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Users, Settings, X, Loader2, AlertCircle, RefreshCw, Menu, MessageCircle, UserCog, LogOut } from 'lucide-react'
import Link from 'next/link'
import { MessageThread } from './messages/MessageThread'
import { Composer } from './composer/Composer'
import { ChatbotSidebar } from './sidebar/ChatbotSidebar'
import type { Message, SidebarEntry, ChatQuickAction } from '@/components/chatbot/types'
import NotificationToggle from '@/components/NotificationToggle'

interface MobileChatInterfaceProps {
  activeSidebarContact: SidebarEntry
  activeStatusLine: string
  sidebarEntries: SidebarEntry[]
  filteredSidebarEntries: SidebarEntry[] | null | undefined
  contactsLoading: boolean
  contactsError?: string | null
  onRetryContacts?: () => void
  sidebarQuery: string
  setSidebarQuery: (query: string) => void
  handleSelectContact: (contactId: string) => void
  handleOpenSettings: () => void
  handleFormatLastActivity: (date?: Date) => string
  flowbotEntry: SidebarEntry
  messages: Message[]
  isLoadingMessages: boolean
  isStreaming: boolean
  composerRef: React.RefObject<HTMLTextAreaElement | null>
  inputValue: string
  handleComposerChange: (value: string) => void
  handleComposerKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  composerPlaceholder: string
  composerDisabled: boolean
  handleComposerSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  selectedFiles: File[]
  setSelectedFiles: (files: File[]) => void
  isUploadingFiles: boolean
  messageInfoDialog: { open: boolean; message: Message | null }
  setMessageInfoDialog: (dialog: { open: boolean; message: Message | null }) => void
  initialScrollTop?: number
  onScrollTopChange?: (top: number) => void
  onScheduleFollowUp: () => void
  onQuickAction?: (action: ChatQuickAction) => void
  scheduledAt?: Date | null
  onClearSchedule?: () => void
  userEmail?: string | null
  userRole?: string | null
  onLogout?: () => void
  onScheduledMessageClick?: (message: Message) => void
}

export function MobileChatInterface({
  activeSidebarContact,
  activeStatusLine,
  sidebarEntries,
  filteredSidebarEntries,
  contactsLoading,
  contactsError,
  onRetryContacts,
  sidebarQuery,
  setSidebarQuery,
  handleSelectContact,
  handleOpenSettings,
  handleFormatLastActivity,
  flowbotEntry,
  messages,
  isLoadingMessages,
  isStreaming,
  composerRef,
  inputValue,
  handleComposerChange,
  handleComposerKeyDown,
  composerPlaceholder,
  composerDisabled,
  handleComposerSubmit,
  selectedFiles,
  setSelectedFiles,
  isUploadingFiles,
  messageInfoDialog,
  setMessageInfoDialog,
  initialScrollTop,
  onScrollTopChange,
  onScheduleFollowUp,
  onQuickAction,
  scheduledAt,
  onClearSchedule,
  userEmail,
  userRole,
  onLogout,
  onScheduledMessageClick,
}: MobileChatInterfaceProps) {
  const [contactsOpen, setContactsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const composerContainerRef = useRef<HTMLDivElement | null>(null)
  const [composerHeight, setComposerHeight] = useState(0)
  // Measure composer container height to pad the message list so last message stays above composer
  useEffect(() => {
    if (!composerContainerRef.current || typeof ResizeObserver === 'undefined') return
    const updateHeight = () => {
      const h = composerContainerRef.current?.offsetHeight ?? 0
      setComposerHeight(h)
    }
    updateHeight()
    const ro = new ResizeObserver(() => updateHeight())
    ro.observe(composerContainerRef.current)
    return () => ro.disconnect()
  }, [])
  // Dynamic bottom padding:
  // - With file preview, give nearly full composer height so preview sits above and never overlaps
  // - Otherwise keep a very tight gap
  const hasPreview = selectedFiles && selectedFiles.length > 0
  const effectiveBottomPadding = hasPreview
    ? Math.max(12, composerHeight - 6)
    : Math.max(0, composerHeight - 60)

  const avatarInitial = activeSidebarContact?.name?.charAt(0)?.toUpperCase() ?? 'C'
  const subtitle = activeStatusLine || activeSidebarContact.subtitle || 'Disponible'
  const hasContacts = sidebarEntries && sidebarEntries.length > 0
  const showLoadingSkeleton = contactsLoading && !hasContacts

  // Reset avatar error when contact changes
  useEffect(() => {
    setAvatarError(false)
  }, [activeSidebarContact?.id, activeSidebarContact?.avatarUrl, activeSidebarContact?.avatar])

  return (
    <div className="flex h-full w-full flex-1 flex-col bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
        {/* Left Section: Contacts Button + Contact Info */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
          {/* Contacts Button - Always visible */}
          <Sheet open={contactsOpen} onOpenChange={setContactsOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              onClick={() => setContactsOpen(true)}
              aria-label="Ver contactos"
            >
              <Users className="h-5 w-5" />
            </Button>

            <SheetContent
              side="left"
              title="Contactos"
              aria-label="Lista de contactos"
              className="w-full max-w-md border-r border-gray-200 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-[#0f172a] sm:w-80"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Contactos</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  onClick={() => setContactsOpen(false)}
                  aria-label="Cerrar lista de contactos"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a]">
                {contactsLoading && !hasContacts ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando contactos...</p>
                  </div>
                ) : contactsError ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">Error al cargar contactos</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{contactsError}</p>
                    {onRetryContacts && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetryContacts}
                        className="mt-4"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reintentar
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <ChatbotSidebar
                      entries={sidebarEntries}
                      filteredEntries={filteredSidebarEntries}
                      activeEntry={activeSidebarContact}
                      flowbotEntry={flowbotEntry}
                      loading={contactsLoading}
                      query={sidebarQuery}
                      onQueryChange={setSidebarQuery}
                      onSelectContact={(contactId) => {
                        handleSelectContact(contactId)
                        setContactsOpen(false)
                      }}
                      onOpenSettings={() => {
                        setContactsOpen(false)
                        handleOpenSettings()
                      }}
                      formatLastActivity={handleFormatLastActivity}
                      className="flex" // Override hidden class for mobile Sheet
                    />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Contact Info Section */}
          {showLoadingSkeleton ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setContactsOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              aria-label={`Ver información de ${activeSidebarContact.name}`}
            >
              {/* Avatar */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-gray-200 dark:ring-gray-700">
                {(activeSidebarContact?.avatarUrl || activeSidebarContact?.avatar) && !avatarError ? (
                  <img
                    src={activeSidebarContact.avatarUrl ?? activeSidebarContact.avatar ?? ''}
                    alt={activeSidebarContact.name}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                    {avatarInitial}
                  </span>
                )}
              </div>

              {/* Name and Status */}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                  {activeSidebarContact?.name || 'Sin nombre'}
                </p>
                <p className="truncate text-xs leading-tight text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Right Section: Mobile Menu + Settings */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <SheetContent
              side="right"
              title="Menú"
              aria-label="Menú de navegación"
              className="w-full max-w-sm border-l border-gray-200 bg-[#0f172a] p-0 shadow-xl dark:border-gray-800"
            >
              <div className="flex flex-col h-screen">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
                  <h2 className="text-base font-semibold text-white">Menú</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Cerrar menú"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* User Info */}
                {(userEmail || userRole) && (
                  <div className="border-b border-gray-700 px-4 py-3">
                    {userEmail && (
                      <p className="text-sm font-semibold text-white">{userEmail}</p>
                    )}
                    {userRole && (
                      <p className="text-xs text-gray-300 mt-0.5">Role: {userRole}</p>
                    )}
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                  <Link
                    href="/flowchat"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="h-5 w-5" />
                    FlowChat
                  </Link>
                  <Link
                    href="/flowbot"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="h-5 w-5" />
                    FlowBot
                  </Link>

                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-white hover:bg-gray-800 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserCog className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}

                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between px-3 py-2.5 mt-2">
                    <span className="text-sm font-medium text-white">Notificaciones</span>
                    <NotificationToggle variant="ghost" size="sm" />
                  </div>

                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenSettings()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-white hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    Configuración
                  </button>

                  {/* Logout */}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-red-400 hover:bg-red-950/50 transition-colors mt-2"
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar sesión
                    </button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
            aria-label="Abrir ajustes"
            onClick={handleOpenSettings}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
        <MessageThread
          messages={messages}
          isLoading={isLoadingMessages}
          isStreaming={isStreaming}
          onMessageInfo={(message) => setMessageInfoDialog({ open: true, message })}
          activeContact={activeSidebarContact}
          initialScrollTop={initialScrollTop}
          onScrollChange={onScrollTopChange}
          onQuickAction={onQuickAction}
          bottomPadding={effectiveBottomPadding}
          onScheduledMessageClick={onScheduledMessageClick}
        />
      </main>

      <footer
        ref={composerContainerRef}
        className="border-t border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900"
      >
        <Composer
          ref={composerRef}
          value={inputValue}
          onChange={handleComposerChange}
          onKeyDown={handleComposerKeyDown}
          placeholder={composerPlaceholder}
          disabled={composerDisabled}
          onSubmit={handleComposerSubmit}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          isUploadingFiles={isUploadingFiles}
          className="bg-white dark:bg-gray-900"
          onSchedule={onScheduleFollowUp}
          scheduleLabel="Programar seguimiento"
          scheduledAt={scheduledAt}
          onClearSchedule={onClearSchedule}
        />
      </footer>
    </div>
  )
}

export default MobileChatInterface

