"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Phone, Settings2, User2, UserPlus, Users2, X } from 'lucide-react'
import { shallow } from 'zustand/shallow'


import { FlowBotIcon } from '@/components/ui/FlowBotIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ChatContact } from '@/stores/chat-contacts-store'
import { useDomainStore } from '@/state/hooks'

interface ChatContactsPanelProps {
  tenantId?: string
  sessionToken?: string | null
  onClose: () => void
  onSelectContact?: (contactId: string) => void
  onOpenSettings: () => void
  onlineUserIds?: Set<string>
}

export function ChatContactsPanel({ tenantId, sessionToken, onClose, onSelectContact, onOpenSettings, onlineUserIds }: ChatContactsPanelProps) {
  const { contacts, isLoading, error, initialized, loadContacts, createContact, createGroup } = useDomainStore(
    'chatContacts',
    state => ({
      contacts: state.contacts,
      isLoading: state.isLoading,
      error: state.error,
      initialized: state.initialized,
      loadContacts: state.loadContacts,
      createContact: state.createContact,
      createGroup: state.createGroup,
    }),
    shallow,
  )

  // Tab state: 'users' or 'whatsapp'
  const [activeTab, setActiveTab] = useState<'users' | 'whatsapp'>('users')
  const [searchTerm, setSearchTerm] = useState('')

  const [showContactForm, setShowContactForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [isCreatingContact, setIsCreatingContact] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  const lastLoadState = useRef<{ token: string | null | undefined; tenantId?: string | null }>({
    token: undefined,
    tenantId: undefined,
  })

  useEffect(() => {
    const lastToken = lastLoadState.current.token
    const lastTenant = lastLoadState.current.tenantId

    if (!initialized || lastToken !== sessionToken || lastTenant !== tenantId) {
      lastLoadState.current = { token: sessionToken, tenantId }
      void loadContacts({ tenantId, sessionToken })
    }
  }, [initialized, loadContacts, sessionToken, tenantId])

  const flowbotContact = useMemo(() => contacts.find(contact => contact.isFlowbot), [contacts])

  // Separate tenant users and WhatsApp contacts (excluding FlowBot)
  const userContacts = useMemo(() => contacts.filter(contact => contact.type === 'TENANT_USER'), [contacts])
  const whatsappContacts = useMemo(() => contacts.filter(contact => !contact.isFlowbot && contact.type !== 'TENANT_USER'), [contacts])

  const filteredUserContacts = useMemo(() =>
    userContacts.filter(c => c.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    , [userContacts, searchTerm])

  const filteredWhatsappContacts = useMemo(() =>
    whatsappContacts.filter(c => c.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    , [whatsappContacts, searchTerm])

  const toggleContactForm = () => {
    setShowContactForm(prev => {
      const next = !prev
      if (next) {
        setShowGroupForm(false)
      }
      return next
    })
  }

  const toggleGroupForm = () => {
    setShowGroupForm(prev => {
      const next = !prev
      if (next) {
        setShowContactForm(false)
      }
      return next
    })
  }

  const closeAllForms = () => {
    setShowContactForm(false)
    setShowGroupForm(false)
  }

  const handleCreateContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const displayName = formData.get('displayName') as string
    const phone = formData.get('phone') as string

    if (!displayName?.trim()) return

    setIsCreatingContact(true)
    const success = await createContact({ tenantId, displayName, phone })
    setIsCreatingContact(false)

    if (success) {
      closeAllForms()
    }
  }

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const displayName = formData.get('displayName') as string
    const description = formData.get('description') as string

    if (!displayName?.trim()) return

    setIsCreatingGroup(true)
    const success = await createGroup({ tenantId, displayName, description })
    setIsCreatingGroup(false)

    if (success) {
      closeAllForms()
    }
  }

  const ContactForm = () => (
    <form onSubmit={handleCreateContact} className="mb-4 space-y-3 rounded-lg border border-[#1f2c34] bg-[#202c33] p-4">
      <h3 className="mb-2 font-medium text-[#e9edef]">Nuevo Contacto</h3>
      <div className="space-y-1">
        <label htmlFor="contact-name" className="text-xs text-[#8696a0]">
          Nombre
        </label>
        <input
          id="contact-name"
          name="displayName"
          required
          className="w-full rounded-md border border-[#2a3942] bg-[#111b21] px-3 py-2 text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
          placeholder="Nombre del contacto"
          disabled={isCreatingContact}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact-phone" className="text-xs text-[#8696a0]">
          Teléfono
        </label>
        <input
          id="contact-phone"
          name="phone"
          className="w-full rounded-md border border-[#2a3942] bg-[#111b21] px-3 py-2 text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
          placeholder="+51 999 999 999"
          disabled={isCreatingContact}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={closeAllForms}
          className="rounded-md px-3 py-1.5 text-sm text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef]"
          disabled={isCreatingContact}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-[#00a884] px-3 py-1.5 text-sm font-medium text-[#111b21] hover:bg-[#008f6f]"
          disabled={isCreatingContact}
        >
          {isCreatingContact ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )

  const GroupForm = () => (
    <form onSubmit={handleCreateGroup} className="mb-4 space-y-3 rounded-lg border border-[#1f2c34] bg-[#202c33] p-4">
      <h3 className="mb-2 font-medium text-[#e9edef]">Nuevo Grupo</h3>
      <div className="space-y-1">
        <label htmlFor="group-name" className="text-xs text-[#8696a0]">
          Nombre del grupo
        </label>
        <input
          id="group-name"
          name="displayName"
          required
          className="w-full rounded-md border border-[#2a3942] bg-[#111b21] px-3 py-2 text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
          placeholder="Nombre del grupo"
          disabled={isCreatingGroup}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="group-desc" className="text-xs text-[#8696a0]">
          Descripción
        </label>
        <input
          id="group-desc"
          name="description"
          className="w-full rounded-md border border-[#2a3942] bg-[#111b21] px-3 py-2 text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
          placeholder="Descripción opcional"
          disabled={isCreatingGroup}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={closeAllForms}
          className="rounded-md px-3 py-1.5 text-sm text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef]"
          disabled={isCreatingGroup}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-[#00a884] px-3 py-1.5 text-sm font-medium text-[#111b21] hover:bg-[#008f6f]"
          disabled={isCreatingGroup}
        >
          {isCreatingGroup ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  )

  return (
    <div className="relative flex h-full w-full flex-col bg-[#0b141a] text-white md:flex-row md:items-stretch">
      <div className="flex h-full flex-1 flex-col px-5 py-6 md:overflow-y-auto md:px-8 md:py-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver al chat</span>
          </button>
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold leading-tight">Contactos del asistente</span>
            <span className="text-xs text-white/70">Gestiona FlowBot y tus contactos</span>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4 bg-red-500/10 text-white">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 flex-1 overflow-y-auto pr-1 pb-28 md:pb-8 md:pr-2">
          <div className="space-y-4">
            {flowbotContact ? <ContactCard contact={flowbotContact} onSelect={onSelectContact} /> : null}

            {/* Tab navigation */}
            <div className="mt-4 flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1 rounded border ${activeTab === 'users' ? 'bg-white text-black border-white' : 'bg-gray-700 text-white border-gray-600'}`}
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-1 rounded border ${activeTab === 'whatsapp' ? 'bg-white text-black border-white' : 'bg-gray-700 text-white border-gray-600'}`}
              >
                WhatsApp
              </button>
            </div>

            {/* Search bar */}
            <div className="mt-2 text-white">
              <Input
                id="search-contacts"
                placeholder="Buscar contactos"
                aria-label="Buscar contactos"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#202c33] border-none text-white placeholder-gray-400"
              />
            </div>

            {isLoading && ((activeTab === 'users' && filteredUserContacts.length === 0) || (activeTab === 'whatsapp' && filteredWhatsappContacts.length === 0)) ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/80 mt-2">
                Cargando lista de contactos...
              </div>
            ) : null}

            {activeTab === 'users' && filteredUserContacts.length ? (
              <div className="space-y-3 mt-2">
                {filteredUserContacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onSelect={onSelectContact}
                    isOnline={onlineUserIds?.has(contact.id)}
                  />
                ))}
              </div>
            ) : null}


            {activeTab === 'whatsapp' && filteredWhatsappContacts.length ? (
              <div className="space-y-3 mt-2">
                {filteredWhatsappContacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onSelect={onSelectContact}
                    isOnline={onlineUserIds?.has(contact.id)}
                  />
                ))}
              </div>
            ) : null}


            {!isLoading && ((activeTab === 'users' && filteredUserContacts.length === 0) || (activeTab === 'whatsapp' && filteredWhatsappContacts.length === 0)) ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70 mt-2">
                {activeTab === 'users' ? 'No hay usuarios de tenant.' : 'No hay contactos de WhatsApp.'}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:h-full md:w-[360px] md:flex-col md:py-8 md:pr-8">
        <div className="flex h-full flex-col overflow-y-auto rounded-4xl bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-900">Nuevo contacto</span>
                </div>
                <Button
                  type="button"
                  onClick={toggleContactForm}
                  variant="outline"
                  className="h-9 rounded-full border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {showContactForm ? 'Ocultar' : 'Añadir'}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Crea accesos directos para clientes o asesores que necesiten interactuar con FlowBot.
              </p>
              {showContactForm ? <ContactForm /> : null}
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-sky-500" />
                  <span className="text-sm font-semibold text-slate-900">Nuevo grupo</span>
                </div>
                <Button
                  type="button"
                  onClick={toggleGroupForm}
                  variant="outline"
                  className="h-9 rounded-full border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {showGroupForm ? 'Ocultar' : 'Crear'}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Organiza equipos o áreas con listas compartidas para un control rápido desde el chatbot.
              </p>
              {showGroupForm ? <GroupForm /> : null}
            </section>

            <section className="border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={onOpenSettings}
                className="w-full justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-100"
              >
                Configuración y perfil
              </Button>
            </section>
          </div>
        </div>
      </div>

      {
        (showContactForm || showGroupForm) && (
          <div className="md:hidden absolute inset-0 z-30 flex flex-col">
            <button
              type="button"
              className="flex-1 bg-slate-950/40 backdrop-blur-sm"
              onClick={closeAllForms}
              aria-label="Cerrar formularios"
            />
            <div className="max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-6 text-slate-900 shadow-[0_-24px_56px_rgba(15,23,42,0.45)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">
                  {showContactForm ? 'Nuevo contacto' : 'Nuevo grupo'}
                </span>
                <button
                  type="button"
                  onClick={closeAllForms}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </button>
              </div>
              {showContactForm ? <ContactForm /> : <GroupForm />}
            </div>
          </div>
        )
      }

      <div
        className={`absolute inset-x-0 bottom-0 md:hidden transition-opacity duration-200 ${showContactForm || showGroupForm ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
          }`}
      >
        <div className="px-5 pb-5">
          <div className="flex items-center justify-around rounded-full border border-white/15 bg-white/10 px-6 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur-lg">
            <button
              type="button"
              onClick={toggleContactForm}
              className={`flex flex-col items-center gap-1 text-xs font-medium ${showContactForm ? 'text-emerald-300' : 'text-white/80'
                }`}
            >
              <UserPlus className="h-5 w-5" />
              <span>Contacto</span>
            </button>
            <button
              type="button"
              onClick={toggleGroupForm}
              className={`flex flex-col items-center gap-1 text-xs font-medium ${showGroupForm ? 'text-sky-300' : 'text-white/80'
                }`}
            >
              <Users2 className="h-5 w-5" />
              <span>Grupo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                closeAllForms()
                onOpenSettings()
              }}
              className="flex flex-col items-center gap-1 text-xs font-medium text-white/80 transition hover:text-white"
            >
              <Settings2 className="h-5 w-5" />
              <span>Config</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ContactCardProps {
  contact: ChatContact
  onSelect?: (contactId: string) => void
  isOnline?: boolean
}

function ContactCard({ contact, onSelect, isOnline }: ContactCardProps) {
  const isGroup = contact.type === 'GROUP'
  const isTenantUser = contact.type === 'TENANT_USER'

  const icon = contact.isFlowbot ? (
    <FlowBotIcon variant="glyph" size={40} className="text-[#25d366]" />
  ) : isGroup ? (
    <Users2 className="h-8 w-8 text-[#53bdeb]" />
  ) : isTenantUser ? (
    <User2 className="h-8 w-8 text-[#aebac1]" />
  ) : (
    <User2 className="h-8 w-8 text-[#25d366]" />
  )

  const handleClick = () => {
    if (onSelect) {
      onSelect(contact.id)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-4 rounded-3xl border border-[#1f2c34] bg-[#202c33] p-4 text-left transition-colors hover:bg-[#2a3942] active:bg-[#233138] focus:outline-none focus:ring-2 focus:ring-[#25d366]/50"
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#1f2c34] text-white">
        {icon}
        {isOnline && (
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#202c33]" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-sm font-semibold text-[#e9edef] sm:text-base">
              {contact.displayName}
            </span>
            {contact.isFlowbot ? (
              <Badge variant="outline" className="border-[#25d366]/30 bg-[#25d366]/10 text-[#e9edef]">
                FlowBot
              </Badge>
            ) : (
              <Badge variant="outline" className="border-[#334045] text-[#cfd4d6]">
                {isGroup ? 'Grupo' : isTenantUser ? 'Usuario' : 'Contacto'}
              </Badge>
            )}
          </div>
          {contact.unreadCount && contact.unreadCount > 0 ? (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#25d366] px-1 text-xs font-bold text-[#111b21]">
              {contact.unreadCount}
            </span>
          ) : null}
        </div>
        {contact.description ? (
          <span className="mt-1 truncate text-xs text-[#8696a0]">{contact.description}</span>
        ) : null}
        {contact.phone ? (
          <div className="mt-1 flex items-center gap-1 text-xs text-[#8696a0]">
            <Phone className="h-3 w-3" />
            <span>{contact.phone}</span>
          </div>
        ) : null}
      </div>
    </button>
  )
}

export default ChatContactsPanel
