"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Clock, Pencil, Plus, RefreshCcw, Trash2, Calendar, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from '@/stores'
import {
  createScheduleTemplate,
  deleteScheduleTemplate,
  getScheduleTemplates,
  updateScheduleTemplate,
  type ScheduleTemplate,
} from '@/features/admin/api/admin-api'
import { ScheduleTemplateFormModal } from '@/features/admin/components/ScheduleTemplateFormModal'
import { ScheduleCalendar } from '@/features/admin/components/ScheduleCalendar'

interface ScheduleManagementSectionProps {
  tenantId?: string | null
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatOrdinal(value: number) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const rem100 = value % 100
  if (rem100 >= 11 && rem100 <= 13) return `${value}th`
  const rem10 = value % 10
  return `${value}${suffixes[rem10] ?? 'th'}`
}

function formatRecurringPattern(template: ScheduleTemplate) {
  if (template.recurringType === 'daily') {
    return 'Every day'
  }

  if (template.recurringType === 'weekly') {
    if (!template.recurringDays.length) return 'Weekly'
    const days = template.recurringDays
      .sort((a, b) => a - b)
      .map(index => WEEKDAYS[index] ?? `Day ${index}`)
    return `Weekly on ${days.join(', ')}`
  }

  if (!template.recurringDays.length) {
    return 'Monthly'
  }

  const days = template.recurringDays
    .sort((a, b) => a - b)
    .map(formatOrdinal)
  return `Monthly on the ${days.join(', ')}`
}

export function ScheduleManagementSection({ tenantId }: ScheduleManagementSectionProps) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<ScheduleTemplate | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const effectiveTenantId = useMemo(() => tenantId?.trim() || 'default_tenant', [tenantId])

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getScheduleTemplates(effectiveTenantId || undefined)
      setTemplates(data)
    } catch (fetchError) {
      console.error('Failed to load schedule templates:', fetchError)
      const message =
        fetchError instanceof Error
          ? fetchError.message || 'Failed to load schedule templates'
          : 'Failed to load schedule templates'
      setError(message)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [effectiveTenantId])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const openCreateModal = () => {
    setSelectedTemplate(null)
    setModalError(null)
    setShowModal(true)
  }

  const openEditModal = (template: ScheduleTemplate) => {
    setSelectedTemplate(template)
    setModalError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setSelectedTemplate(null)
    setModalError(null)
  }

  const openDeleteConfirm = (template: ScheduleTemplate) => {
    setDeletingTemplate(template)
    setShowDeleteConfirm(true)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setDeletingTemplate(null)
  }

  const handleSubmit = async (payload: Parameters<typeof createScheduleTemplate>[0]) => {
    try {
      setSaving(true)
      setModalError(null)

      if (selectedTemplate) {
        await updateScheduleTemplate(selectedTemplate.id, payload)
        toast.success(
          'Template updated',
          `Schedule template "${payload.name}" has been updated successfully.`
        )
      } else {
        await createScheduleTemplate(payload)
        toast.success(
          'Template created',
          `Schedule template "${payload.name}" has been created successfully.`
        )
      }

      await loadTemplates()
      setShowModal(false)
      setSelectedTemplate(null)
    } catch (submissionError) {
      console.error('Failed to save schedule template:', submissionError)
      const message =
        submissionError instanceof Error
          ? submissionError.message || 'Failed to save schedule template'
          : 'Failed to save schedule template'
      setModalError(message)
      toast.error('Failed to save template', message)
      throw submissionError
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (template: ScheduleTemplate) => {
    try {
      setSaving(true)
      await deleteScheduleTemplate(template.id)
      toast.success(
        'Template deleted',
        `Schedule template "${template.name}" has been deleted successfully.`
      )
      await loadTemplates()
      closeDeleteConfirm()
    } catch (deleteError) {
      console.error('Failed to delete schedule template:', deleteError)
      const message =
        deleteError instanceof Error
          ? deleteError.message || 'Failed to delete schedule template'
          : 'Failed to delete schedule template'
      setError(message)
      toast.error('Failed to delete template', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold text-black">Schedule Templates</h1>
        </div>

      <Alert className="bg-white border-gray-200">
        <Calendar className="h-4 w-4" />
        <AlertDescription className="text-black">
          Manage recurring availability blocks used for booking flows. Create templates to define when your services are available.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openCreateModal}
          className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
        >
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadTemplates()}
          disabled={loading}
          className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
        >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
      </div>

      {loading && (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <div>
                <h3 className="text-sm font-medium text-black">Loading Schedule Templates...</h3>
                <p className="text-sm text-gray-600">Fetching availability definitions for the selected tenant.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-500 bg-white">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-black">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadTemplates()}
              className="mt-2 bg-white text-black border-gray-300 hover:bg-gray-50"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && templates.length === 0 && (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-black mb-4">No schedule templates found for this tenant.</p>
            <Button
              variant="outline"
              onClick={openCreateModal}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="flex items-center gap-2 text-black">
            <Calendar className="h-5 w-5 text-green-600" />
            All Schedule Templates
          </CardTitle>
          <CardDescription className="text-black">
            Manage and configure your schedule templates
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(template => (
              <Card key={template.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="bg-white pb-3">
              <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-black">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-gray-600 mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className={template.isActive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}>
                      {template.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                </Badge>
              </div>
                </CardHeader>
                <CardContent className="bg-white space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-24">Pattern:</span>
                      <span className="text-black">{formatRecurringPattern(template)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-24">Time Zone:</span>
                      <span className="text-black font-mono text-xs">{template.timeZone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-600">Slots:</span>
                      <span className="text-black font-semibold">{template.slots.length}</span>
              </div>
                    {template.exceptions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-600 text-xs">
                          {template.exceptions.length} exception{template.exceptions.length === 1 ? '' : 's'}
                        </span>
              </div>
                    )}
                    <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                      Updated {new Date(template.updatedAt).toLocaleString()}
                </div>
              </div>

                  {template.slots.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600">Time Slots</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                    {template.slots.map(slot => (
                          <div key={slot.id} className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs">
                        <div className="flex items-center justify-between">
                              <span className="font-medium text-black">
                            {slot.startTime} – {slot.endTime}
                          </span>
                              {!slot.isActive && (
                                <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                                  Inactive
                                </Badge>
                              )}
                        </div>
                            <div className="mt-1 text-gray-600">
                              {slot.duration} min · {slot.bufferTime} min buffer
                          {typeof slot.maxBookings === 'number' && slot.maxBookings > 0
                                ? ` · max ${slot.maxBookings}`
                            : ''}
                            </div>
                        </div>
                    ))}
              </div>
                </div>
              )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <Button
                      onClick={() => openEditModal(template)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1 text-black" strokeWidth={2} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => openDeleteConfirm(template)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1 text-red-600" strokeWidth={2} />
                      Delete
                    </Button>
                  </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </CardContent>
      </Card>

      <ScheduleCalendar
        templates={templates}
        loading={loading}
        error={error}
        onRefresh={loadTemplates}
      />

      <ScheduleTemplateFormModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSaving={saving}
        error={modalError}
        template={selectedTemplate}
        tenantId={effectiveTenantId || undefined}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md bg-white border-gray-200">
            <CardHeader className="bg-white">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-lg text-black">Delete Schedule Template</CardTitle>
                  <CardDescription className="text-black mt-1">
                    Are you sure you want to delete the template <strong>&quot;{deletingTemplate.name}&quot;</strong>?
                    This action cannot be undone and will permanently remove the template and all its associated exceptions.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeDeleteConfirm}
                  disabled={saving}
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(deletingTemplate)}
                  disabled={saving}
                  className="bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  {saving ? 'Deleting...' : 'Delete Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
