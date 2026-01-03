'use client'

import { useState, useEffect } from 'react'
import { Users, Building2, Phone, Mail, Plus, Search, Filter } from 'lucide-react'
import { apiClient, isAuthError } from '../lib/api'

interface CRMContact {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: 'lead' | 'customer' | 'partner'
  createdAt: string
}

export default function CRMManagement() {
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await apiClient.get('/admin/crm/contacts')
      // setContacts(response.data)
      
      // Mock data for now
      setContacts([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          status: 'customer',
          createdAt: new Date().toISOString(),
        },
      ])
      setError('')
    } catch (err: any) {
      if (isAuthError(err)) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to fetch CRM contacts')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      lead: { bg: 'bg-warning-light', border: 'border-warning-dark', text: 'text-text-primary' },
      customer: { bg: 'bg-success-light', border: 'border-success-dark', text: 'text-text-primary' },
      partner: { bg: 'bg-info-light', border: 'border-info-dark', text: 'text-text-primary' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.lead
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.border} border ${config.text}`
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const stats = {
    total: contacts.length,
    customers: contacts.filter(c => c.status === 'customer').length,
    leads: contacts.filter(c => c.status === 'lead').length,
    partners: contacts.filter(c => c.status === 'partner').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">CRM Management</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage customer relationships and contacts
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-bg-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-error-light border border-error-dark rounded-md p-4">
          <div className="text-sm text-text-primary">{error}</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-primary-500">
                <Users className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Total Contacts</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.total}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-success">
                <Users className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Customers</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.customers}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-warning">
                <Users className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Leads</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.leads}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-info">
                <Building2 className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Partners</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.partners}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-bg-primary shadow-md rounded-lg border border-border-light p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-icon-muted" />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary-500 focus:border-border-focus text-text-primary bg-bg-primary"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary bg-bg-primary hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-bg-primary shadow-md overflow-hidden sm:rounded-md border border-border-light">
        <ul className="divide-y divide-border-light">
          {filteredContacts.length === 0 ? (
            <li className="px-4 py-8 text-center">
              <p className="text-text-secondary">No contacts found</p>
            </li>
          ) : (
            filteredContacts.map((contact) => (
              <li key={contact.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary-100">
                        <span className="text-sm font-medium text-text-primary">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                        <span className={getStatusBadge(contact.status)}>
                          {contact.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        {contact.email && (
                          <div className="flex items-center text-sm text-text-secondary">
                            <Mail className="h-4 w-4 mr-1" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-sm text-text-secondary">
                            <Phone className="h-4 w-4 mr-1" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center text-sm text-text-secondary">
                            <Building2 className="h-4 w-4 mr-1" />
                            {contact.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

