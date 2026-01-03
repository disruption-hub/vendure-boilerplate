'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  Filter,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation'
  score: number
  estimatedValue: string
  nextAction: string
  assignedTo: string
}

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@example.com',
    phone: '+51 987 123 456',
    source: 'Website',
    status: 'qualified',
    score: 85,
    estimatedValue: '$25,000',
    nextAction: 'Enviar propuesta',
    assignedTo: 'Juan Sales',
  },
  {
    id: '2',
    name: 'Ana Torres',
    email: 'ana.torres@example.com',
    phone: '+51 987 123 457',
    source: 'Referral',
    status: 'contacted',
    score: 72,
    estimatedValue: '$18,000',
    nextAction: 'Llamada de seguimiento',
    assignedTo: 'María Sales',
  },
  {
    id: '3',
    name: 'Roberto Silva',
    email: 'roberto.silva@example.com',
    phone: '+51 987 123 458',
    source: 'LinkedIn',
    status: 'new',
    score: 45,
    estimatedValue: '$12,000',
    nextAction: 'Primer contacto',
    assignedTo: 'Juan Sales',
  },
]

export function LeadsManager() {
  const [leads] = useState<Lead[]>(mockLeads)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusInfo = (status: Lead['status']) => {
    switch (status) {
      case 'new':
        return {
          label: 'Nuevo',
          color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        }
      case 'contacted':
        return {
          label: 'Contactado',
          color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        }
      case 'qualified':
        return {
          label: 'Calificado',
          color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        }
      case 'proposal':
        return {
          label: 'Propuesta',
          color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        }
      case 'negotiation':
        return {
          label: 'Negociación',
          color: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Prospectos (Leads)</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gestiona y califica tus leads de ventas
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="leads-search"
            name="leadsSearch"
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
        <Button variant="outline" className="border-slate-200 dark:border-slate-700">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Leads</div>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{leads.length}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Calificados</div>
            <div className="h-8 w-8 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xs font-bold">✓</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {leads.filter((l) => l.status === 'qualified').length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Score Promedio</div>
            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">★</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Valor Estimado</div>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">$55K</div>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLeads.map((lead) => {
          const statusInfo = getStatusInfo(lead.status)
          return (
            <div
              key={lead.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {lead.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getScoreColor(
                        lead.score
                      )}`}
                    >
                      Score: {lead.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {lead.email}
                    </span>
                    <span className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {lead.phone}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {lead.estimatedValue}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                  Ver Detalles
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fuente</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {lead.source}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Siguiente Acción
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {lead.nextAction}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Asignado a</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {lead.assignedTo}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


