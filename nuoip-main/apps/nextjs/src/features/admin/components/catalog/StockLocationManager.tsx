import React, { useState, useEffect } from 'react'
import { Plus, MapPin, Edit, Trash2, Home } from 'lucide-react'
import {
    getStockLocations,
    createStockLocation,
    updateStockLocation,
    deleteStockLocation,
    type StockLocation,
    type CreateStockLocationPayload,
    type UpdateStockLocationPayload
} from '../../api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/stores'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface FormState {
    name: string
    description: string
    address: string
    isDefault: boolean
    isActive: boolean
    type: 'PHYSICAL' | 'DIGITAL'
}

const initialFormState: FormState = {
    name: '',
    description: '',
    address: '',
    isDefault: false,
    isActive: true,
    type: 'PHYSICAL'
}

export const StockLocationManager = React.forwardRef<{ openAddDialog: () => void }, {}>((props, ref) => {
    const [locations, setLocations] = useState<StockLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormState>(initialFormState)
    const [submitting, setSubmitting] = useState(false)

    const fetchLocations = async () => {
        try {
            setLoading(true)
            const data = await getStockLocations()
            setLocations(data)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch locations:', err)
            setError('Failed to load stock locations.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchLocations()
    }, [])

    // Expose openAddDialog method via ref
    React.useImperativeHandle(ref, () => ({
        openAddDialog: () => {
            setFormMode('create')
            setEditingId(null)
            setFormData(initialFormState)
            setIsDialogOpen(true)
        }
    }))

    const handleAdd = () => {
        setFormMode('create')
        setEditingId(null)
        setFormData(initialFormState)
        setIsDialogOpen(true)
    }

    const handleEdit = (location: StockLocation) => {
        setFormMode('edit')
        setEditingId(location.id)
        setFormData({
            name: location.name,
            description: location.description || '',
            address: location.address || '',
            isDefault: location.isDefault,
            isActive: location.isActive ?? true,
            type: location.type || 'PHYSICAL'
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (location: StockLocation) => {
        if (!window.confirm(`Delete location "${location.name}"? This requires no stock to be present there.`)) {
            return
        }

        try {
            await deleteStockLocation(location.id)
            await fetchLocations()
        } catch (err: any) {
            console.error('Failed to delete location:', err)
            alert(err.message || 'Failed to delete location')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            setError(null)

            if (formMode === 'create') {
                const payload: CreateStockLocationPayload = {
                    name: formData.name,
                    description: formData.description || undefined,
                    address: formData.address || undefined,
                    isDefault: formData.isDefault,
                    type: formData.type
                }
                await createStockLocation(payload)
                toast.success('Location created', `${formData.name} has been created successfully.`)
            } else {
                if (!editingId) return
                const payload: UpdateStockLocationPayload = {
                    name: formData.name,
                    description: formData.description || undefined,
                    address: formData.address || undefined,
                    isDefault: formData.isDefault,
                    isActive: formData.isActive ?? true,
                    type: formData.type
                }
                console.log('Updating location with payload:', payload)
                await updateStockLocation(editingId, payload)
                toast.success('Location updated', `${formData.name} has been updated successfully.`)
            }

            setIsDialogOpen(false)
            await fetchLocations()
        } catch (err: any) {
            console.error('Failed to save location:', err)
            const errorMessage = err.message || 'Failed to save location'
            setError(errorMessage)
            toast.error('Save failed', errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start mb-1">
                <div>
                    <h3 className="text-xl font-semibold text-black mb-1">Stock Locations</h3>
                    <p className="text-sm text-black">Manage warehouses, stores, and other inventory locations for your products.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`h-8 px-3 text-xs font-medium transition-all ${
                                viewMode === 'list' 
                                    ? 'bg-white shadow-sm text-black' 
                                    : 'text-black hover:text-black'
                            }`}
                        >
                            List
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`h-8 px-3 text-xs font-medium transition-all ${
                                viewMode === 'grid' 
                                    ? 'bg-white shadow-sm text-black' 
                                    : 'text-black hover:text-black'
                            }`}
                        >
                            Grid
                        </Button>
                    </div>
                    <Button onClick={handleAdd} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                        <Plus size={16} />
                        Add Location
                    </Button>
                </div>
            </div>
            
            {/* Stats */}
            {!loading && locations.length > 0 && (
                <div className="flex items-center gap-4 text-sm text-black mb-4">
                    <span className="font-medium">
                        {locations.length} {locations.length === 1 ? 'location' : 'locations'}
                    </span>
                    <span>•</span>
                    <span>
                        {locations.filter(l => l.isActive).length} active
                    </span>
                    <span>•</span>
                    <span>
                        {locations.filter(l => l.isDefault).length} default
                    </span>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-8 text-black">Loading locations...</div>
            ) : locations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-black bg-neutral-50 rounded-lg border border-dashed">
                    <MapPin className="mb-2 h-8 w-8 opacity-20" />
                    <p>No stock locations found.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {locations.map(location => (
                        <div 
                            key={location.id} 
                            className={`group relative rounded-xl border-2 transition-all duration-200 ${
                                !location.isActive 
                                    ? 'border-slate-200 bg-slate-50/50 opacity-75' 
                                    : location.isDefault
                                    ? 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-lg'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
                            }`}
                        >
                            <div className="p-5">
                                {/* Header */}
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                                            location.isActive 
                                                ? location.type === 'DIGITAL'
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {location.type === 'DIGITAL' ? (
                                                <MapPin size={20} />
                                            ) : (
                                                <Home size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-900 text-base mb-1.5 truncate">
                                                {location.name}
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {location.isDefault && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium bg-amber-100 text-amber-700 border-amber-200">
                                                        Default
                                                    </Badge>
                                                )}
                                                {location.type === 'DIGITAL' ? (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-2 bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                                                        Digital
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-2 bg-slate-100 text-slate-700 border-slate-300 font-medium">
                                                        Physical
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="mb-4">
                                    {location.isActive ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                            Active
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                                            Inactive
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="mb-4 space-y-2">
                                    {location.description ? (
                                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                                            {location.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No description provided</p>
                                    )}
                                    {location.address && (
                                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                            <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2 leading-relaxed">{location.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 px-3 text-xs text-black hover:bg-blue-50 hover:text-blue-600" 
                                        onClick={() => handleEdit(location)}
                                    >
                                        <Edit size={14} className="mr-1.5 text-black" strokeWidth={2} />
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 px-3 text-xs text-black hover:text-red-600 hover:bg-red-50" 
                                        onClick={() => handleDelete(location)}
                                    >
                                        <Trash2 size={14} className="mr-1.5 text-black" strokeWidth={2} />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                    Type & Status
                                </th>
                                <th className="px-4 py-3.5 text-right font-semibold text-xs text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {locations.map((location) => (
                                <tr 
                                    key={location.id} 
                                    className={`transition-colors ${
                                        !location.isActive 
                                            ? 'bg-slate-50/50 opacity-75' 
                                            : 'bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    {/* Location Name */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex items-start gap-2.5">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                                                location.isActive 
                                                    ? location.type === 'DIGITAL'
                                                        ? 'bg-indigo-100 text-indigo-600'
                                                        : 'bg-blue-100 text-blue-600'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                {location.type === 'DIGITAL' ? (
                                                    <MapPin size={16} />
                                                ) : (
                                                    <Home size={16} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-slate-900 mb-1.5">
                                                    {location.name}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {location.isDefault && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-amber-100 text-amber-700 border-amber-200">
                                                            Default
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Description */}
                                    <td className="px-4 py-4 align-top">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {location.description || (
                                                <span className="text-slate-400 italic">No description</span>
                                            )}
                                        </p>
                                    </td>
                                    
                                    {/* Address */}
                                    <td className="px-4 py-4 align-top">
                                        {location.address ? (
                                            <div className="flex items-start gap-1.5">
                                                <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-slate-600 leading-relaxed">
                                                    {location.address}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400">—</span>
                                        )}
                                    </td>
                                    
                                    {/* Type & Status */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex flex-col gap-2">
                                            {location.type === 'DIGITAL' ? (
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 w-fit bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                                                    Digital
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 w-fit bg-slate-100 text-slate-700 border-slate-300 font-medium">
                                                    Physical
                                                </Badge>
                                            )}
                                            {location.isActive ? (
                                                <div className="flex items-center gap-1.5 text-xs text-green-700">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                    <span className="font-medium">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs text-red-600">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                                                    <span className="font-medium">Inactive</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    
                                    {/* Actions */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex justify-end gap-1.5">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-black hover:bg-blue-50 hover:text-blue-600" 
                                                onClick={() => handleEdit(location)}
                                                title="Edit location"
                                            >
                                                <Edit size={14} className="text-black" strokeWidth={2} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-black hover:text-red-600 hover:bg-red-50" 
                                                onClick={() => handleDelete(location)}
                                                title="Delete location"
                                            >
                                                <Trash2 size={14} className="text-black" strokeWidth={2} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-black font-bold text-lg">{formMode === 'create' ? 'Add Location' : 'Edit Location'}</DialogTitle>
                        <DialogDescription className="text-black font-medium">Create a new inventory location.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="loc-name" className="text-black font-semibold">Name</Label>
                            <Input
                                id="loc-name"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Main Warehouse"
                                required
                                className="bg-white text-black border-gray-300 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="loc-desc" className="text-black font-semibold">Description</Label>
                            <Textarea
                                id="loc-desc"
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Optional description..."
                                className="bg-white text-black border-gray-300 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="loc-addr" className="text-black font-semibold">Address</Label>
                            <Input
                                id="loc-addr"
                                value={formData.address}
                                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="123 Storage St..."
                                className="bg-white text-black border-gray-300 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="loc-type" className="text-black font-semibold">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: 'PHYSICAL' | 'DIGITAL') => setFormData(prev => ({ ...prev, type: value }))}
                            >
                                <SelectTrigger id="loc-type" className="bg-white text-black border-gray-300 font-medium">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                                    <SelectItem value="DIGITAL">Digital</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-black font-medium">Physical locations have addresses, digital locations are virtual</p>
                        </div>

                            <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-black font-semibold">Default Location</Label>
                                    <p className="text-xs text-black font-medium">Use this location for online orders by default</p>
                                </div>
                            <Switch
                                checked={formData.isDefault}
                                onCheckedChange={checked => setFormData(prev => ({ ...prev, isDefault: checked }))}
                            />
                        </div>

                        {formMode === 'edit' && (
                            <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-black font-semibold">Active Status</Label>
                                    <p className="text-xs text-black font-medium">Inactive locations cannot receive new stock</p>
                                </div>
                                <Switch
                                    checked={formData.isActive ?? true}
                                    onCheckedChange={checked => {
                                        console.log('Active toggle changed to:', checked)
                                        setFormData(prev => ({ ...prev, isActive: checked }))
                                    }}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-white text-black border-gray-300 hover:bg-gray-100 hover:text-black font-semibold">Cancel</Button>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60">
                                {submitting ? 'Saving...' : 'Save Location'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
})
