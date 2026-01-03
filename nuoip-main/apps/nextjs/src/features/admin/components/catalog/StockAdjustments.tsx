import React, { useState, useEffect } from 'react'
import {
    getAllProductsWithStock,
    getStockMovements,
    adjustStock,
    getStockLocations,
    type ProductWithStock,
    type StockMovement,
    type StockLocation,
    type AdjustStockPayload
} from '../../api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from '@/stores'
import { Package, History, Plus, Minus, RefreshCw, Search, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

export const StockAdjustments = () => {
    const [products, setProducts] = useState<ProductWithStock[]>([])
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [locations, setLocations] = useState<StockLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMovements, setLoadingMovements] = useState(false)
    const [activeTab, setActiveTab] = useState<'products' | 'audit'>('products')
    
    // Adjustment form state
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [selectedLocationId, setSelectedLocationId] = useState<string>('')
    const [adjustQuantity, setAdjustQuantity] = useState<string>('0')
    const [adjustReserved, setAdjustReserved] = useState<string>('0')
    const [adjustType, setAdjustType] = useState<'quantity' | 'reserved'>('quantity')
    const [adjustOperation, setAdjustOperation] = useState<'add' | 'subtract'>('add')
    const [adjustReason, setAdjustReason] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)
    
    // Filters
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [filterProductId, setFilterProductId] = useState<string>('')
    const [filterLocationId, setFilterLocationId] = useState<string>('')
    
    // Bulk edit state
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [bulkOperation, setBulkOperation] = useState<'add' | 'subtract' | 'set'>('add')
    const [bulkQuantity, setBulkQuantity] = useState<string>('0')
    const [bulkReserved, setBulkReserved] = useState<string>('0')
    const [bulkType, setBulkType] = useState<'quantity' | 'reserved'>('quantity')
    const [bulkReason, setBulkReason] = useState<string>('')
    const [editingCell, setEditingCell] = useState<{ productId: string; locationId: string; field: 'quantity' | 'reserved' } | null>(null)
    const [editValue, setEditValue] = useState<string>('')
    const [showQuickAction, setShowQuickAction] = useState(false)

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const [productsData, locationsData] = await Promise.all([
                getAllProductsWithStock(),
                getStockLocations()
            ])
            setProducts(productsData)
            setLocations(locationsData.filter(l => l.isActive))
        } catch (err) {
            console.error('Failed to load products:', err)
            toast.error('Error', 'Failed to load products with stock')
        } finally {
            setLoading(false)
        }
    }

    const fetchMovements = async () => {
        try {
            setLoadingMovements(true)
            const movementsData = await getStockMovements({
                productId: filterProductId && filterProductId !== 'all' ? filterProductId : undefined,
                locationId: filterLocationId && filterLocationId !== 'all' ? filterLocationId : undefined,
                limit: 100,
            })
            setMovements(movementsData)
        } catch (err) {
            console.error('Failed to load movements:', err)
            toast.error('Error', 'Failed to load stock movements')
        } finally {
            setLoadingMovements(false)
        }
    }

    useEffect(() => {
        void fetchProducts()
    }, [])

    useEffect(() => {
        if (activeTab === 'audit') {
            void fetchMovements()
        }
    }, [activeTab, filterProductId, filterLocationId])

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!selectedProductId || !selectedLocationId) {
            toast.error('Required fields', 'Please select a product and location')
            return
        }

        let qty: number | undefined
        let reserved: number | undefined

        if (adjustType === 'quantity') {
            const rawQty = parseInt(adjustQuantity, 10)
            if (isNaN(rawQty) || rawQty === 0) {
                toast.error('Invalid quantity', 'Please enter a valid non-zero quantity')
                return
            }
            qty = adjustOperation === 'add' ? rawQty : -rawQty
        } else if (adjustType === 'reserved') {
            const rawReserved = parseInt(adjustReserved, 10)
            if (isNaN(rawReserved) || rawReserved === 0) {
                toast.error('Invalid reserved amount', 'Please enter a valid non-zero reserved amount')
                return
            }
            reserved = adjustOperation === 'add' ? rawReserved : -rawReserved
        }

        try {
            setSubmitting(true)
            const payload: AdjustStockPayload = {
                productId: selectedProductId,
                locationId: selectedLocationId,
                quantityChange: qty,
                reservedChange: reserved,
                reason: adjustReason || undefined,
            }

            await adjustStock(payload)

            const product = products.find(p => p.id === selectedProductId)
            const location = locations.find(l => l.id === selectedLocationId)
            const operation = adjustOperation === 'add' ? 'added to' : 'subtracted from'
            const amount = adjustType === 'quantity' 
                ? `${Math.abs(qty!)} units` 
                : `${Math.abs(reserved!)} reserved units`
            
            toast.success('Stock updated', `${amount} ${operation} ${location?.name || 'location'}`)

            // Clear form
            setAdjustQuantity('0')
            setAdjustReserved('0')
            setAdjustReason('')
            
            // Refresh data
            await fetchProducts()
            if (activeTab === 'audit') {
                await fetchMovements()
            }
        } catch (err: any) {
            console.error('Failed to adjust stock:', err)
            const errorMessage = err.message || 'Failed to adjust stock'
            if (!errorMessage.includes('Authentication required')) {
                toast.error('Adjustment failed', errorMessage)
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleBulkAdjust = async () => {
        if (selectedRows.size === 0) {
            toast.error('No selection', 'Please select at least one product/location combination')
            return
        }

        const rawValue = bulkType === 'quantity' 
            ? parseInt(bulkQuantity, 10)
            : parseInt(bulkReserved, 10)

        if (isNaN(rawValue) || rawValue < 0) {
            toast.error('Invalid value', 'Please enter a valid non-negative number')
            return
        }

        try {
            setSubmitting(true)
            const adjustments = Array.from(selectedRows).map(rowKey => {
                const [productId, locationId] = rowKey.split('|')
                const product = products.find(p => p.id === productId)
                const stock = product?.stocks.find(s => s.locationId === locationId)
                
                let quantityChange: number | undefined
                let reservedChange: number | undefined

                if (bulkType === 'quantity') {
                    if (bulkOperation === 'set') {
                        const currentQty = stock?.quantity || 0
                        quantityChange = rawValue - currentQty
                    } else {
                        quantityChange = bulkOperation === 'add' ? rawValue : -rawValue
                    }
                } else {
                    if (bulkOperation === 'set') {
                        const currentReserved = stock?.reserved || 0
                        reservedChange = rawValue - currentReserved
                    } else {
                        reservedChange = bulkOperation === 'add' ? rawValue : -rawValue
                    }
                }

                return {
                    productId,
                    locationId,
                    quantityChange,
                    reservedChange,
                }
            })

            // Perform all adjustments
            const results = await Promise.allSettled(
                adjustments.map(adj => adjustStock({
                    ...adj,
                    reason: bulkReason || `Bulk ${bulkOperation} ${bulkType}`,
                }))
            )

            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length

            if (successful > 0) {
                toast.success('Bulk update', `${successful} item(s) updated successfully`)
            }
            if (failed > 0) {
                toast.error('Some failed', `${failed} item(s) failed to update`)
            }

            // Clear bulk form and selection
            setBulkQuantity('0')
            setBulkReserved('0')
            setBulkReason('')
            setSelectedRows(new Set())
            
            // Refresh data
            await fetchProducts()
        } catch (err: any) {
            console.error('Failed to bulk adjust:', err)
            toast.error('Bulk adjustment failed', err.message || 'Failed to update selected items')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCellEdit = (productId: string, locationId: string, field: 'quantity' | 'reserved', currentValue: number) => {
        setEditingCell({ productId, locationId, field })
        setEditValue(currentValue.toString())
    }

    const handleCellSave = async () => {
        if (!editingCell) return

        const rawValue = parseInt(editValue, 10)
        if (isNaN(rawValue) || rawValue < 0) {
            toast.error('Invalid value', 'Please enter a valid non-negative number')
            setEditingCell(null)
            return
        }

        try {
            setSubmitting(true)
            const product = products.find(p => p.id === editingCell.productId)
            const stock = product?.stocks.find(s => s.locationId === editingCell.locationId)
            
            let quantityChange: number | undefined
            let reservedChange: number | undefined

            if (editingCell.field === 'quantity') {
                const currentQty = stock?.quantity || 0
                quantityChange = rawValue - currentQty
            } else {
                const currentReserved = stock?.reserved || 0
                reservedChange = rawValue - currentReserved
            }

            await adjustStock({
                productId: editingCell.productId,
                locationId: editingCell.locationId,
                quantityChange,
                reservedChange,
                reason: `Direct edit from table`,
            })

            toast.success('Updated', `${editingCell.field === 'quantity' ? 'Quantity' : 'Reserved'} updated`)
            
            setEditingCell(null)
            await fetchProducts()
        } catch (err: any) {
            console.error('Failed to update cell:', err)
            if (!err.message?.includes('Authentication required')) {
                toast.error('Update failed', err.message || 'Failed to update')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const toggleRowSelection = (rowKey: string) => {
        const newSelection = new Set(selectedRows)
        if (newSelection.has(rowKey)) {
            newSelection.delete(rowKey)
        } else {
            newSelection.add(rowKey)
        }
        setSelectedRows(newSelection)
    }

    const toggleAllRows = () => {
        const totalRows = filteredProducts.reduce((sum, p) => sum + ((p.stocks?.length || 0) || 1), 0)
        if (selectedRows.size === totalRows) {
            setSelectedRows(new Set())
        } else {
            const allKeys = new Set<string>()
            filteredProducts.forEach(product => {
                if (!product.stocks || product.stocks.length === 0) {
                    allKeys.add(`${product.id}|`)
                } else {
                    product.stocks.forEach(stock => {
                        allKeys.add(`${product.id}|${stock.locationId}`)
                    })
                }
            })
            setSelectedRows(allKeys)
        }
    }

    const filteredProducts = products.filter(product => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                product.name.toLowerCase().includes(query) ||
                product.productCode.toLowerCase().includes(query) ||
                product.category?.name.toLowerCase().includes(query)
            )
        }
        return true
    })

    const getMovementTypeLabel = (type: StockMovement['type']) => {
        const labels: Record<StockMovement['type'], string> = {
            ADJUSTMENT: 'Adjustment',
            TRANSFER_OUT: 'Transfer Out',
            TRANSFER_IN: 'Transfer In',
            RESERVATION: 'Reservation',
            RELEASE: 'Release',
            SALE: 'Sale',
            RETURN: 'Return',
        }
        return labels[type] || type
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'audit')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="products">Products & Stock</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-6">
                    <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setShowQuickAction(!showQuickAction)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                        >
                            <h3 className="text-lg font-semibold text-black">Quick Adjustment</h3>
                            {showQuickAction ? (
                                <ChevronUp className="h-5 w-5 text-slate-600" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-slate-600" />
                            )}
                        </button>
                        {showQuickAction && (
                            <div className="p-6 pt-0 border-t border-slate-200">
                                <form onSubmit={handleAdjust} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="adj-product" className="text-xs text-black">Product/Service</Label>
                                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                        <SelectTrigger id="adj-product" className="bg-white text-black">
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(product => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.name} ({product.productCode})
                                                    {product.category && ` - ${product.category.type === 'PRODUCT' ? 'Product' : 'Service'}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="adj-location" className="text-xs text-black">Location</Label>
                                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                        <SelectTrigger id="adj-location" className="bg-white text-black">
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="adj-type" className="text-xs text-black">Adjustment Type</Label>
                                    <Select value={adjustType} onValueChange={(v: 'quantity' | 'reserved') => setAdjustType(v)}>
                                        <SelectTrigger id="adj-type" className="bg-white text-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quantity">Adjust Quantity</SelectItem>
                                            <SelectItem value="reserved">Adjust Reserved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="adj-operation" className="text-xs text-black">Operation</Label>
                                    <Select value={adjustOperation} onValueChange={(v: 'add' | 'subtract') => setAdjustOperation(v)}>
                                        <SelectTrigger id="adj-operation" className="bg-white text-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">Add</SelectItem>
                                            <SelectItem value="subtract">Subtract</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor={adjustType === 'quantity' ? 'adj-qty' : 'adj-reserved'} className="text-xs text-black">
                                    {adjustType === 'quantity' ? 'Quantity' : 'Reserved'} Amount
                                </Label>
                                {adjustType === 'quantity' ? (
                                    <Input
                                        id="adj-qty"
                                        type="number"
                                        min="1"
                                        value={adjustQuantity}
                                        onChange={e => setAdjustQuantity(e.target.value)}
                                        className="bg-white text-black"
                                        required
                                    />
                                ) : (
                                    <Input
                                        id="adj-reserved"
                                        type="number"
                                        min="1"
                                        value={adjustReserved}
                                        onChange={e => setAdjustReserved(e.target.value)}
                                        className="bg-white text-black"
                                        required
                                    />
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="adj-reason" className="text-xs text-black">Reason (Optional)</Label>
                                <Input
                                    id="adj-reason"
                                    value={adjustReason}
                                    onChange={e => setAdjustReason(e.target.value)}
                                    placeholder="e.g. Restock, Order placed"
                                    className="bg-white text-black"
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleAdjust(e as any)
                                    }}
                                    disabled={submitting || !selectedProductId || !selectedLocationId} 
                                    size="sm"
                                    className="bg-black hover:bg-gray-900 text-white font-medium"
                                >
                                    {submitting ? 'Saving...' : 'Adjust'}
                                </Button>
                            </div>
                        </form>
                            </div>
                        )}
                    </div>

                    {selectedRows.size > 0 && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-black mb-3">Bulk Edit ({selectedRows.size} selected)</h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="space-y-1">
                                    <Label className="text-xs text-black">Operation</Label>
                                    <Select value={bulkOperation} onValueChange={(v: 'add' | 'subtract' | 'set') => setBulkOperation(v)}>
                                        <SelectTrigger className="bg-white text-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">Add</SelectItem>
                                            <SelectItem value="subtract">Subtract</SelectItem>
                                            <SelectItem value="set">Set to</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-black">Type</Label>
                                    <Select value={bulkType} onValueChange={(v: 'quantity' | 'reserved') => setBulkType(v)}>
                                        <SelectTrigger className="bg-white text-black">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quantity">Quantity</SelectItem>
                                            <SelectItem value="reserved">Reserved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-black">Value</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={bulkType === 'quantity' ? bulkQuantity : bulkReserved}
                                        onChange={e => bulkType === 'quantity' ? setBulkQuantity(e.target.value) : setBulkReserved(e.target.value)}
                                        className="bg-white text-black"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-black">Reason (Optional)</Label>
                                    <Input
                                        value={bulkReason}
                                        onChange={e => setBulkReason(e.target.value)}
                                        placeholder="Bulk adjustment"
                                        className="bg-white text-black"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleBulkAdjust}
                                        disabled={submitting}
                                        className="w-full bg-black hover:bg-gray-900 text-white font-medium"
                                        size="sm"
                                    >
                                        {submitting ? 'Applying...' : 'Apply to Selected'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search products..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-10 bg-white text-black"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchProducts}
                                    disabled={loading}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <Checkbox
                                                checked={selectedRows.size > 0 && selectedRows.size === filteredProducts.reduce((sum, p) => sum + ((p.stocks?.length || 0) || 1), 0)}
                                                onCheckedChange={toggleAllRows}
                                                className="border-slate-300"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Product/Service</th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Category</th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Location</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">Available</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">Reserved</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-black">Loading...</td>
                                        </tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-black">No products with stock tracking found.</td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map(product => {
                                            const rowKey = `${product.id}|`
                                            
                                            if (!product.stocks || product.stocks.length === 0) {
                                                return (
                                                    <tr key={product.id}>
                                                        <td className="px-4 py-3">
                                                            <Checkbox
                                                                checked={selectedRows.has(rowKey)}
                                                                onCheckedChange={() => toggleRowSelection(rowKey)}
                                                                className="border-slate-300"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-black">{product.name}</td>
                                                        <td className="px-4 py-3 text-black">
                                                            {product.category ? (
                                                                <>
                                                                    {product.category.name}
                                                                    <span className="text-xs text-slate-500 ml-2">
                                                                        ({product.category.type === 'PRODUCT' ? 'Product' : 'Service'})
                                                                    </span>
                                                                </>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-black">-</td>
                                                        <td className="px-4 py-3 text-right text-black">0</td>
                                                        <td className="px-4 py-3 text-right text-black">0</td>
                                                        <td className="px-4 py-3 text-right text-black">0</td>
                                                    </tr>
                                                )
                                            }
                                            
                                            return (product.stocks || []).map((stock, index) => {
                                                const stockRowKey = `${product.id}|${stock.locationId}`
                                                const isEditing = editingCell?.productId === product.id && editingCell?.locationId === stock.locationId
                                                const stocks = product.stocks || []
                                                
                                                return (
                                                    <tr key={`${product.id}-${stock.locationId}`} className="hover:bg-gray-50">
                                                        {index === 0 && (
                                                            <>
                                                                <td rowSpan={stocks.length} className="px-4 py-3">
                                                                    <Checkbox
                                                                        checked={stocks.every(s => selectedRows.has(`${product.id}|${s.locationId}`))}
                                                                        onCheckedChange={() => {
                                                                            const allSelected = stocks.every(s => selectedRows.has(`${product.id}|${s.locationId}`))
                                                                            const newSelection = new Set(selectedRows)
                                                                            stocks.forEach(s => {
                                                                                const key = `${product.id}|${s.locationId}`
                                                                                if (allSelected) {
                                                                                    newSelection.delete(key)
                                                                                } else {
                                                                                    newSelection.add(key)
                                                                                }
                                                                            })
                                                                            setSelectedRows(newSelection)
                                                                        }}
                                                                        className="border-slate-300"
                                                                    />
                                                                </td>
                                                                <td rowSpan={stocks.length} className="px-4 py-3 font-medium text-black">
                                                                    {product.name}
                                                                    <div className="text-xs text-slate-500">{product.productCode}</div>
                                                                </td>
                                                                <td rowSpan={stocks.length} className="px-4 py-3 text-black">
                                                                    {product.category ? (
                                                                        <>
                                                                            {product.category.name}
                                                                            <div className="text-xs text-slate-500">
                                                                                {product.category.type === 'PRODUCT' ? 'Product' : 'Service'}
                                                                            </div>
                                                                        </>
                                                                    ) : '-'}
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-4 py-3 text-black">{stock.location?.name || '-'}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-black">
                                                            {stock.isUnlimited ? '∞' : Math.max(0, stock.quantity - stock.reserved)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isEditing && editingCell?.field === 'reserved' ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') handleCellSave()
                                                                            if (e.key === 'Escape') setEditingCell(null)
                                                                        }}
                                                                        className="w-20 h-8 text-right font-mono bg-white text-black"
                                                                        autoFocus
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={handleCellSave}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => setEditingCell(null)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <X className="h-4 w-4 text-red-600" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    className="font-mono text-black cursor-pointer hover:bg-blue-50 px-2 py-1 rounded flex items-center justify-end gap-1 group"
                                                                    onClick={() => handleCellEdit(product.id, stock.locationId, 'reserved', stock.reserved)}
                                                                    title="Click to edit"
                                                                >
                                                                    {stock.reserved}
                                                                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isEditing && editingCell?.field === 'quantity' ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') handleCellSave()
                                                                            if (e.key === 'Escape') setEditingCell(null)
                                                                        }}
                                                                        className="w-20 h-8 text-right font-mono font-semibold bg-white text-black"
                                                                        autoFocus
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={handleCellSave}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => setEditingCell(null)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <X className="h-4 w-4 text-red-600" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    className="font-mono font-semibold text-black cursor-pointer hover:bg-blue-50 px-2 py-1 rounded flex items-center justify-end gap-1 group"
                                                                    onClick={() => handleCellEdit(product.id, stock.locationId, 'quantity', stock.quantity)}
                                                                    title="Click to edit"
                                                                >
                                                                    {stock.isUnlimited ? '∞' : stock.quantity}
                                                                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <div className="bg-white rounded-lg border-2 border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1">
                                <Label htmlFor="filter-product" className="text-xs text-black mb-1 block">Filter by Product</Label>
                                <Select value={filterProductId} onValueChange={setFilterProductId}>
                                    <SelectTrigger id="filter-product" className="bg-white text-black">
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All products</SelectItem>
                                        {products.map(product => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="filter-location" className="text-xs text-black mb-1 block">Filter by Location</Label>
                                <Select value={filterLocationId} onValueChange={setFilterLocationId}>
                                    <SelectTrigger id="filter-location" className="bg-white text-black">
                                        <SelectValue placeholder="All locations" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All locations</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchMovements}
                                disabled={loadingMovements}
                                className="gap-2 mt-6"
                            >
                                <RefreshCw className={`h-4 w-4 ${loadingMovements ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-black">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Product</th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Type</th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Location</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">Quantity Change</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">Reserved Change</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">Before</th>
                                        <th className="px-4 py-3 text-right font-medium text-black">After</th>
                                        <th className="px-4 py-3 text-left font-medium text-black">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loadingMovements ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-black">Loading...</td>
                                        </tr>
                                    ) : movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-black">No stock movements found.</td>
                                        </tr>
                                    ) : (
                                        movements.map(movement => (
                                            <tr key={movement.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-black text-xs">{formatDate(movement.createdAt)}</td>
                                                <td className="px-4 py-3 text-black">
                                                    <div className="font-medium">{movement.product.name}</div>
                                                    <div className="text-xs text-slate-500">{movement.product.productCode}</div>
                                                </td>
                                                <td className="px-4 py-3 text-black">{getMovementTypeLabel(movement.type)}</td>
                                                <td className="px-4 py-3 text-black">
                                                    {movement.type === 'TRANSFER_OUT' || movement.type === 'TRANSFER_IN' ? (
                                                        <>
                                                            {movement.fromLocation?.name || '-'} → {movement.toLocation?.name || '-'}
                                                        </>
                                                    ) : (
                                                        movement.location?.name || '-'
                                                    )}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono text-black ${movement.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {movement.quantityChange >= 0 ? '+' : ''}{movement.quantityChange}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono text-black ${movement.reservedChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {movement.reservedChange >= 0 ? '+' : ''}{movement.reservedChange}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-black text-xs">
                                                    Qty: {movement.quantityBefore} | Res: {movement.reservedBefore}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-black text-xs">
                                                    Qty: {movement.quantityAfter} | Res: {movement.reservedAfter}
                                                </td>
                                                <td className="px-4 py-3 text-black text-xs">{movement.reason || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

