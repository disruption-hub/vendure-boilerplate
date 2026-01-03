'use client'

import { useEffect, useState } from 'react'
import { Users, Building2, Database, Activity, LogOut, Menu, X, MessageSquare, Phone } from 'lucide-react'
import SystemStats from './SystemStats'
import TenantManagement from './TenantManagement'
import SystemHealth from './SystemHealth'
import CRMManagement from './CRMManagement'
import WhatsAppManagement from './WhatsAppManagement'
import CommunicationHub from './CommunicationHub'
import ThemeSwitcher from './ThemeSwitcher'
import { addSessionExpiredListener } from '../lib/api'

interface DashboardProps {
  onLogout: () => void
}

type TabId = 'overview' | 'tenants' | 'health' | 'crm' | 'whatsapp' | 'communications'

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const cleanup = addSessionExpiredListener(() => {
      onLogout()
    })

    return cleanup
  }, [onLogout])

  const tabs: Array<{ id: TabId; name: string; icon: typeof Activity }> = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'tenants', name: 'Tenants', icon: Building2 },
    { id: 'crm', name: 'CRM', icon: Users },
    { id: 'communications', name: 'Communications', icon: MessageSquare },
    { id: 'whatsapp', name: 'WhatsApp', icon: Phone },
    { id: 'health', name: 'System Health', icon: Database },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SystemStats />
      case 'tenants':
        return <TenantManagement />
      case 'crm':
        return <CRMManagement />
      case 'communications':
        return <CommunicationHub />
      case 'whatsapp':
        return <WhatsAppManagement />
      case 'health':
        return <SystemHealth />
      default:
        return <SystemStats />
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-text-primary bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-bg-primary">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-bg-primary"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-bg-primary" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-between px-4">
              <h1 className="text-xl font-bold text-text-primary">IPNUO Admin</h1>
              <ThemeSwitcher />
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSidebarOpen(false)
                    }}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-text-primary'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full transition-colors`}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-border-light p-4">
            <button
              onClick={onLogout}
              className="flex-shrink-0 w-full group block"
            >
              <div className="flex items-center">
                <LogOut className="inline-block h-6 w-6 text-icon-muted group-hover:text-icon-primary transition-colors" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-tertiary group-hover:text-text-primary transition-colors">
                    Sign out
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-border-light bg-bg-primary">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-text-primary">IPNUO Admin</h1>
                <ThemeSwitcher />
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-text-primary'
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors`}
                    >
                      <Icon className="mr-3 h-6 w-6" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-border-light p-4">
              <button
                onClick={onLogout}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <LogOut className="inline-block h-6 w-6 text-icon-muted group-hover:text-icon-primary transition-colors" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-tertiary group-hover:text-text-primary transition-colors">
                      Sign out
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-bg-secondary">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-icon-secondary hover:text-icon-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
