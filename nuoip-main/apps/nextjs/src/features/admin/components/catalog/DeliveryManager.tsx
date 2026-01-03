import React, { useState, useEffect } from 'react'
import { Plus, Truck, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/stores'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    getDeliveryMethods,
    createDeliveryMethod,
    updateDeliveryMethod,
    deleteDeliveryMethod,
    type DeliveryMethod,
    type CreateDeliveryMethodPayload
} from '../../api/admin-api'

const currencyOptions: Array<{ code: string; label: string }> = [
    { code: 'PEN', label: 'Peruvian Sol' },
    { code: 'USD', label: 'US Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'MXN', label: 'Mexican Peso' },
    { code: 'BRL', label: 'Brazilian Real' },
    { code: 'ARS', label: 'Argentine Peso' },
    { code: 'CLP', label: 'Chilean Peso' },
    { code: 'COP', label: 'Colombian Peso' },
]

const formatCents = (cents: number, currency: string = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    })
    return formatter.format(cents / 100)
}

export const DeliveryManager = () => {
    const [methods, setMethods] = useState<DeliveryMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('0')
    const [currency, setCurrency] = useState('USD')
    const [isActive, setIsActive] = useState(true)
    const [freeShippingThreshold, setFreeShippingThreshold] = useState<string>('')
    const [isFreeShipping, setIsFreeShipping] = useState(false)

    const fetchMethods = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getDeliveryMethods()
            setMethods(data)
        } catch (err) {
            console.error('Failed to load delivery methods', err)
            setError('Failed to load delivery methods.')
            toast.error('Load failed', 'Unable to fetch delivery methods.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchMethods()
    }, [])

    const handleOpenDialog = (method?: DeliveryMethod) => {
        if (method) {
            setEditingId(method.id)
            setName(method.name)
            setDescription(method.description || '')
            const isFree = method.priceCents === 0
            setIsFreeShipping(isFree)
            setPrice(isFree ? '0' : (method.priceCents / 100).toString())
            setCurrency(method.currency || 'USD')
            setIsActive(method.isActive)

            const freeRule = method.rules?.find(r => r.condition === 'MIN_TOTAL' && r.priceCents === 0)
            setFreeShippingThreshold(freeRule ? (freeRule.value / 100).toString() : '')
        } else {
            setEditingId(null)
            setName('')
            setDescription('')
            setPrice('0')
            setCurrency('USD')
            setIsActive(true)
            setFreeShippingThreshold('')
            setIsFreeShipping(false)
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const priceCents = isFreeShipping ? 0 : Math.round(parseFloat(price) * 100)
            const rules = []

            if (freeShippingThreshold) {
                rules.push({
                    condition: 'MIN_TOTAL',
                    value: Math.round(parseFloat(freeShippingThreshold) * 100),
                    priceCents: 0
                })
            }

            const payload: CreateDeliveryMethodPayload = {
                name,
                description: description || undefined,
                priceCents,
                currency: currency.trim().toUpperCase(),
                isActive,
                rules
            }

            if (editingId) {
                await updateDeliveryMethod(editingId, payload)
                toast.success('Method updated', `${name} has been updated successfully.`)
            } else {
                await createDeliveryMethod(payload)
                toast.success('Method created', `${name} has been created successfully.`)
            }

            setIsDialogOpen(false)
            await fetchMethods()
        } catch (err: any) {
            console.error('Failed to save delivery method', err)
            const errorMessage = err.message || 'Failed to save delivery method'
            setError(errorMessage)
            toast.error('Save failed', errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        const method = methods.find(m => m.id === id)
        const methodName = method?.name || 'this method'
        
        if (!window.confirm(`Delete delivery method "${methodName}"?`)) return
        
        try {
            await deleteDeliveryMethod(id)
            await fetchMethods()
            toast.success('Method deleted', `${methodName} has been deleted.`)
        } catch (err: any) {
            console.error('Failed to delete delivery method', err)
            toast.error('Delete failed', err.message || 'Failed to delete delivery method')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start mb-1">
                <div>
                    <h3 className="text-xl font-semibold text-black mb-1">Delivery Methods</h3>
                    <p className="text-sm text-black">Configure shipping options, rates, and free shipping rules for your orders.</p>
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
                    <Button onClick={() => handleOpenDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Plus size={16} />
                        Add Method
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {!loading && methods.length > 0 && (
                <div className="flex items-center gap-4 text-sm text-black mb-4">
                    <span className="font-medium">
                        {methods.length} {methods.length === 1 ? 'method' : 'methods'}
                    </span>
                    <span>•</span>
                    <span>
                        {methods.filter(m => m.isActive).length} active
                    </span>
                    {methods.some(m => m.rules && m.rules.length > 0) && (
                        <>
                            <span>•</span>
                            <span>
                                {methods.filter(m => m.rules && m.rules.some(r => r.priceCents === 0)).length} with free shipping
                            </span>
                        </>
                    )}
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-8 text-black">Loading methods...</div>
            ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-black bg-neutral-50 rounded-lg border border-dashed">
                    <Truck className="mb-2 h-8 w-8 opacity-20" />
                    <p>No delivery methods configured.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {methods.map(method => (
                        <div 
                            key={method.id} 
                            className={`group relative rounded-xl border-2 transition-all duration-200 ${
                                !method.isActive 
                                    ? 'border-slate-200 bg-slate-50/50 opacity-75' 
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
                            }`}
                        >
                            <div className="p-5">
                                {/* Header */}
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                                            method.isActive 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            <Truck size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-black text-base mb-1.5 truncate">
                                                {method.name}
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="mb-4">
                                    {method.isActive ? (
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
                                    {method.description ? (
                                        <p className="text-sm text-black line-clamp-2 leading-relaxed">
                                            {method.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-600 italic">No description provided</p>
                                    )}
                                    
                                    {/* Price */}
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-xs h-6 px-2 font-medium ${
                                            method.priceCents === 0 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                : 'bg-green-50 text-green-700 border-green-200'
                                        }`}>
                                            {method.priceCents === 0 ? 'Free' : formatCents(method.priceCents, method.currency)}
                                        </Badge>
                                        {method.rules && method.rules.length > 0 && (
                                            <Badge variant="outline" className="text-xs h-6 px-2 bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                                Free over {formatCents(method.rules[0].value, method.currency)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 px-3 text-xs text-black hover:bg-blue-50 hover:text-blue-600" 
                                        onClick={() => handleOpenDialog(method)}
                                    >
                                        <Edit size={14} className="mr-1.5 text-black" strokeWidth={2} />
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 px-3 text-xs text-black hover:text-red-600 hover:bg-red-50" 
                                        onClick={() => handleDelete(method.id)}
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
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-black uppercase tracking-wider">
                                    Method
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-black uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-black uppercase tracking-wider">
                                    Price & Rules
                                </th>
                                <th className="px-4 py-3.5 text-left font-semibold text-xs text-black uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3.5 text-right font-semibold text-xs text-black uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {methods.map((method) => (
                                <tr 
                                    key={method.id} 
                                    className={`transition-colors ${
                                        !method.isActive 
                                            ? 'bg-slate-50/50 opacity-75' 
                                            : 'bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    {/* Method Name */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex items-start gap-2.5">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                                                method.isActive 
                                                    ? 'bg-blue-100 text-blue-600' 
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                <Truck size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-black mb-1.5">
                                                    {method.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Description */}
                                    <td className="px-4 py-4 align-top">
                                        <p className="text-sm text-black leading-relaxed">
                                            {method.description || (
                                                <span className="text-gray-600 italic">No description</span>
                                            )}
                                        </p>
                                    </td>
                                    
                                    {/* Price & Rules */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`text-xs h-6 px-2 w-fit font-medium ${
                                                    method.priceCents === 0 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {method.priceCents === 0 ? 'Free' : formatCents(method.priceCents, method.currency)}
                                                </Badge>
                                                {method.priceCents > 0 && (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-gray-100 text-black border-gray-300 font-medium">
                                                        {method.currency}
                                                    </Badge>
                                                )}
                                            </div>
                                            {method.rules && method.rules.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {method.rules.map(rule => (
                                                        <Badge 
                                                            key={rule.id}
                                                            variant="outline" 
                                                            className="text-[10px] h-5 px-2 bg-blue-50 text-blue-700 border-blue-200 font-medium"
                                                        >
                                                            {rule.priceCents === 0 ? 'Free' : formatCents(rule.priceCents, method.currency)} over {formatCents(rule.value, method.currency)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    
                                    {/* Status */}
                                    <td className="px-4 py-4 align-top">
                                        {method.isActive ? (
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
                                    </td>
                                    
                                    {/* Actions */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex justify-end gap-1.5">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-black hover:bg-blue-50 hover:text-blue-600" 
                                                onClick={() => handleOpenDialog(method)}
                                                title="Edit method"
                                            >
                                                <Edit size={14} className="text-black" strokeWidth={2} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-black hover:text-red-600 hover:bg-red-50" 
                                                onClick={() => handleDelete(method.id)}
                                                title="Delete method"
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Delivery Method' : 'Add Delivery Method'}</DialogTitle>
                        <DialogDescription>Configure shipping rates and rules.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="method-name" className="text-black">Method Name</Label>
                            <Input
                                id="method-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Standard Shipping"
                                required
                                className="bg-white text-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method-desc" className="text-black">Description</Label>
                            <Textarea
                                id="method-desc"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="3-5 Business Days"
                                className="bg-white text-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method-currency" className="text-black">Currency</Label>
                            <Select
                                value={currency}
                                onValueChange={setCurrency}
                            >
                                <SelectTrigger id="method-currency" className="bg-white text-black border-slate-300">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencyOptions.map(option => (
                                        <SelectItem key={option.code} value={option.code}>
                                            {option.label} ({option.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-black">Select the currency for this delivery method</p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label className="text-black">Free Shipping</Label>
                                <p className="text-xs text-black">Enable free shipping for this method</p>
                            </div>
                            <Switch
                                checked={isFreeShipping}
                                onCheckedChange={(checked) => {
                                    setIsFreeShipping(checked)
                                    if (checked) {
                                        setPrice('0')
                                    }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="method-price" className="text-black">Base Price</Label>
                                <Input
                                    id="method-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    required
                                    disabled={isFreeShipping}
                                    className="bg-white text-black"
                                />
                                {isFreeShipping && (
                                    <p className="text-xs text-slate-500">Price is set to 0 for free shipping</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="method-free" className="text-black">Free Shipping Over</Label>
                                <Input
                                    id="method-free"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={freeShippingThreshold}
                                    onChange={e => setFreeShippingThreshold(e.target.value)}
                                    placeholder="Optional"
                                    className="bg-white text-black"
                                />
                                <p className="text-xs text-black">Leave empty for no free shipping threshold</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label className="text-black">Active Method</Label>
                                <p className="text-xs text-black">Enable this shipping option for customers</p>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-white text-black border-gray-300 hover:bg-gray-100 hover:text-black">Cancel</Button>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
                                {submitting ? 'Saving...' : 'Save Method'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
