"use client"

import { useEffect, useMemo, useState } from 'react'
import type { DepartmentRecord } from '@/features/admin/api/admin-api'
import { getTenantDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/features/admin/api/admin-api'

interface DepartmentManagementSectionProps {
  tenantId: string
}

export function DepartmentManagementSection({ tenantId }: DepartmentManagementSectionProps) {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...departments].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name))
  }, [departments])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getTenantDepartments(tenantId)
      setDepartments(list)
    } catch (e) {
      setError('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (tenantId) { void load() } }, [tenantId])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setIsDefault(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      if (editingId) {
        await updateDepartment({ id: editingId, tenantId, name: name.trim(), description: description.trim() || undefined, isDefault })
      } else {
        await createDepartment({ tenantId, name: name.trim(), description: description.trim() || undefined, isDefault })
      }
      await load()
      resetForm()
    } catch {
      setError('Failed to save department')
    }
  }

  const handleEdit = (dept: DepartmentRecord) => {
    setEditingId(dept.id)
    setName(dept.name)
    setDescription('')
    setIsDefault(dept.isDefault)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return
    try {
      await deleteDepartment({ id, tenantId })
      await load()
    } catch {
      setError('Failed to delete department')
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-black">
      <h3 className="text-lg font-semibold text-black">Departments</h3>
      <p className="mb-3 text-sm text-gray-600">Manage office areas used for scheduling presets.</p>

      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Default
        </label>
        <div className="flex items-center gap-2">
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-md bg-gray-200 px-4 py-2 text-black hover:bg-gray-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="divide-y rounded-md border border-gray-200 bg-white">
          {sorted.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium text-black">
                  {d.name} {d.isDefault ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Default</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(d)} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-black hover:bg-gray-200">Edit</button>
                <button onClick={() => handleDelete(d.id)} className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-600">No departments yet.</div>
          )}
        </div>
      )}
    </div>
  )
}


