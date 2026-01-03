import React, { useState, useEffect } from 'react'
import {
    getProductStock,
    adjustStock,
    getStockLocations,
    type StockEntry,
    type StockLocation,
    type AdjustStockPayload
} from '../../api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Minus, RefreshCw } from 'lucide-react'
import { toast } from '@/stores'

interface ProductStockManagerProps {
    productId: string
    productName: string
    onStockChange?: () => void
}

export const ProductStockManager: React.FC<ProductStockManagerProps> = ({ productId, productName, onStockChange }) => {
    const [stockEntries, setStockEntries] = useState<StockEntry[]>([])
    const [locations, setLocations] = useState<StockLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [adjustLocationId, setAdjustLocationId] = useState<string>('')
    const [adjustQuantity, setAdjustQuantity] = useState<string>('0')
    const [adjustReserved, setAdjustReserved] = useState<string>('0')
    const [adjustType, setAdjustType] = useState<'quantity' | 'reserved' | 'transfer'>('quantity')
    const [adjustOperation, setAdjustOperation] = useState<'add' | 'subtract'>('add')
    const [transferFromLocationId, setTransferFromLocationId] = useState<string>('')
    const [transferToLocationId, setTransferToLocationId] = useState<string>('')
    const [transferQuantity, setTransferQuantity] = useState<string>('0')
    const [adjustReason, setAdjustReason] = useState<string>('')
    const [adjustUnlimited, setAdjustUnlimited] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        try {
            setLoading(true)
            const [stockData, locationsData] = await Promise.all([
                getProductStock(productId),
                getStockLocations()
            ])
            setStockEntries(stockData)
            setLocations(locationsData)
            setError(null)
        } catch (err) {
            console.error('Failed to load stock data:', err)
            setError('Failed to load inventory data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchData()
    }, [productId])

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (adjustType === 'transfer') {
            if (!transferFromLocationId || !transferToLocationId) {
                alert('Please select both source and destination locations')
                return
            }
            if (transferFromLocationId === transferToLocationId) {
                alert('Source and destination locations must be different')
                return
            }
            const transferQty = parseInt(transferQuantity, 10)
            if (isNaN(transferQty) || transferQty <= 0) {
                alert('Please enter a valid positive quantity to transfer')
                return
            }
            
            // Check if source has enough stock
            const sourceEntry = stockEntries.find(s => s.locationId === transferFromLocationId)
            const availableAtSource = (sourceEntry?.quantity || 0) - (sourceEntry?.reserved || 0)
            if (transferQty > availableAtSource) {
                alert(`Insufficient stock. Available at source: ${availableAtSource}`)
                return
            }

            try {
                setSubmitting(true)
                setError(null)
                // Subtract from source
                await adjustStock({
                    productId,
                    locationId: transferFromLocationId,
                    quantityChange: -transferQty,
                    reason: adjustReason || `Transfer to ${locations.find(l => l.id === transferToLocationId)?.name || 'location'}`,
                })
                // Add to destination
                await adjustStock({
                    productId,
                    locationId: transferToLocationId,
                    quantityChange: transferQty,
                    reason: adjustReason || `Transfer from ${locations.find(l => l.id === transferFromLocationId)?.name || 'location'}`,
                })

                const fromName = locations.find(l => l.id === transferFromLocationId)?.name || 'source'
                const toName = locations.find(l => l.id === transferToLocationId)?.name || 'destination'
                
                toast.success('Stock transferred', `${transferQty} units transferred from ${fromName} to ${toName}`)
                
                // Clear form
                setTransferFromLocationId('')
                setTransferToLocationId('')
                setTransferQuantity('0')
                setAdjustReason('')
                
                // Force refresh by clearing and reloading data
                setStockEntries([])
                setLocations([])
                // Wait a bit to ensure state is cleared
                await new Promise(resolve => setTimeout(resolve, 100))
                await fetchData()
                onStockChange?.()
            } catch (err: any) {
                console.error('Failed to transfer stock:', err)
                const errorMessage = err.message || 'Failed to transfer stock'
                setError(errorMessage)
                // Don't show toast for authentication errors - they're handled elsewhere
                if (!errorMessage.includes('Authentication required')) {
                    toast.error('Transfer failed', errorMessage)
                }
            } finally {
                setSubmitting(false)
            }
            return
        }

        if (!adjustLocationId) {
            toast.error('Location required', 'Please select a location to perform the adjustment')
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
            setError(null)
            const payload: AdjustStockPayload = {
                productId,
                locationId: adjustLocationId,
                quantityChange: qty,
                reservedChange: reserved,
                reason: adjustReason || undefined,
                isUnlimited: adjustUnlimited
            }

            await adjustStock(payload)

            const locationName = locations.find(l => l.id === adjustLocationId)?.name || 'location'
            const operation = adjustOperation === 'add' ? 'added to' : 'subtracted from'
            const amount = adjustType === 'quantity' 
                ? `${Math.abs(qty!)} units` 
                : `${Math.abs(reserved!)} reserved units`
            
            toast.success(
                'Stock updated', 
                `${amount} ${operation} ${locationName}`
            )

            // Clear form
            setAdjustQuantity('0')
            setAdjustReserved('0')
            setAdjustReason('')
            setAdjustUnlimited(false)
            
            // Force refresh by clearing and reloading data
            setStockEntries([])
            await fetchData()
            
            // Notify parent component to refresh products table
            onStockChange?.()
        } catch (err: any) {
            console.error('Failed to adjust stock:', err)
            const errorMessage = err.message || 'Failed to adjust stock'
            setError(errorMessage)
            // Don't show toast for authentication errors - they're handled elsewhere
            if (!errorMessage.includes('Authentication required')) {
                toast.error('Adjustment failed', errorMessage)
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleRowClick = (locationId: string) => {
        setAdjustLocationId(locationId)
        const entry = stockEntries.find(s => s.locationId === locationId)
        if (entry) {
            setAdjustQuantity(Math.abs(entry.quantity).toString())
        }
    }

    // Combine locations with stock entries to show all possibilities
    // Use useMemo to ensure recalculation when data changes
    const inventoryRows = React.useMemo(() => {
        if (loading || locations.length === 0) return []
        
        return locations.map(loc => {
            const entry = stockEntries.find(s => s.locationId === loc.id)
            const quantity = entry?.quantity || 0
            const reserved = entry?.reserved || 0
            // Calculate available as quantity - reserved to ensure consistency
            const available = Math.max(0, quantity - reserved)
            return {
                location: loc,
                quantity,
                reserved,
                available,
                isUnlimited: entry?.isUnlimited || false
            }
        })
    }, [locations, stockEntries, loading])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-semibold text-black">{productName}</h4>
                    <p className="text-sm text-black">Manage inventory levels across locations.</p>
                </div>
                <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-black">Location</th>
                            <th className="px-4 py-3 text-right font-medium text-black">Available</th>
                            <th className="px-4 py-3 text-right font-medium text-black">Reserved</th>
                            <th className="px-4 py-3 text-right font-medium text-black">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-black">Loading...</td>
                            </tr>
                        ) : inventoryRows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-black">No active locations found.</td>
                            </tr>
                        ) : (
                            inventoryRows.map(row => (
                                <tr 
                                    key={row.location.id}
                                    onClick={() => handleRowClick(row.location.id)}
                                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-black">
                                        {row.location.name}
                                        {!row.location.isActive && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-black">{row.available}</td>
                                    <td className="px-4 py-3 text-right font-mono text-black">{row.reserved}</td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-black">
                                        {row.isUnlimited ? <span className="text-xl leading-3">∞</span> : row.quantity}
                                    </td>
                                </tr>
                            ))
                        )}
                        {!loading && inventoryRows.length > 0 && (
                            <tr className="bg-neutral-50 font-medium">
                                <td className="px-4 py-3 text-black">Total</td>
                                <td className="px-4 py-3 text-right text-black">{inventoryRows.reduce((acc, row) => acc + row.available, 0)}</td>
                                <td className="px-4 py-3 text-right text-black">{inventoryRows.reduce((acc, row) => acc + row.reserved, 0)}</td>
                                <td className="px-4 py-3 text-right text-black">
                                    {inventoryRows.some(r => r.isUnlimited) ? <span className="text-xl leading-3">∞</span> : inventoryRows.reduce((acc, row) => acc + row.quantity, 0)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg border">
                <h5 className="font-medium mb-3 text-sm text-black">Quick Adjustment</h5>
                <form onSubmit={handleAdjust} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                        <Label htmlFor="adj-type" className="text-xs text-black">Adjustment Type</Label>
                        <Select value={adjustType} onValueChange={(value: 'quantity' | 'reserved' | 'transfer') => {
                            setAdjustType(value)
                            if (value === 'transfer') {
                                setAdjustLocationId('')
                            }
                        }}>
                            <SelectTrigger id="adj-type" className="bg-white text-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="quantity">Adjust Quantity</SelectItem>
                                <SelectItem value="reserved">Adjust Reserved</SelectItem>
                                <SelectItem value="transfer">Transfer Between Locations</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {adjustType === 'transfer' ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="transfer-from" className="text-xs text-black">From Location</Label>
                                    <Select value={transferFromLocationId} onValueChange={setTransferFromLocationId}>
                                        <SelectTrigger id="transfer-from" className="bg-white text-black">
                                            <SelectValue placeholder="Select source location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.filter(l => l.isActive).map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="transfer-to" className="text-xs text-black">To Location</Label>
                                    <Select value={transferToLocationId} onValueChange={setTransferToLocationId}>
                                        <SelectTrigger id="transfer-to" className="bg-white text-black">
                                            <SelectValue placeholder="Select destination location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.filter(l => l.isActive && l.id !== transferFromLocationId).map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="transfer-qty" className="text-xs text-black">Quantity to Transfer</Label>
                                <Input
                                    id="transfer-qty"
                                    type="number"
                                    min="1"
                                    value={transferQuantity}
                                    onChange={e => setTransferQuantity(e.target.value)}
                                    className="bg-white text-black"
                                    required
                                />
                                {transferFromLocationId && (
                                    <p className="text-xs text-slate-600 mt-1">
                                        Available: {
                                            (() => {
                                                const entry = stockEntries.find(s => s.locationId === transferFromLocationId)
                                                return (entry?.quantity || 0) - (entry?.reserved || 0)
                                            })()
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                                <div className="space-y-1">
                                    <Label htmlFor="adj-loc" className="text-xs text-black">Location</Label>
                                    <Select value={adjustLocationId} onValueChange={setAdjustLocationId}>
                                        <SelectTrigger id="adj-loc" className="bg-white text-black">
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.filter(l => l.isActive).map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="adj-operation" className="text-xs text-black">Operation</Label>
                                    <Select value={adjustOperation} onValueChange={(value: 'add' | 'subtract') => setAdjustOperation(value)}>
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
                        </>
                    )}

                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-1">
                            <Label htmlFor="adj-reason" className="text-xs text-black">Reason (Optional)</Label>
                            <Input
                                id="adj-reason"
                                value={adjustReason}
                                onChange={e => setAdjustReason(e.target.value)}
                                placeholder={adjustType === 'transfer' ? "e.g. Stock transfer" : "e.g. Restock, Order placed"}
                                className="bg-white text-black"
                            />
                        </div>

                        {adjustType !== 'transfer' && (
                            <div className="flex flex-col space-y-2 justify-end pb-1">
                                <div className="flex items-center space-x-2">
                                    <Switch id="unlimited-mode" checked={adjustUnlimited} onCheckedChange={setAdjustUnlimited} />
                                    <Label htmlFor="unlimited-mode" className="text-xs whitespace-nowrap text-black">Unlimited</Label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-end">
                            <Button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleAdjust(e as any)
                                }}
                                disabled={submitting || (adjustType === 'transfer' ? (!transferFromLocationId || !transferToLocationId) : !adjustLocationId)} 
                                size="sm"
                                className="bg-black hover:bg-gray-900 text-white font-medium"
                            >
                                {submitting ? 'Saving...' : adjustType === 'transfer' ? 'Transfer' : 'Adjust'}
                            </Button>
                        </div>
                        {adjustType !== 'transfer' && !adjustLocationId && (
                            <p className="text-xs text-amber-600 text-center">⚠️ Please select a location to perform adjustment</p>
                        )}
                        {adjustType === 'transfer' && (!transferFromLocationId || !transferToLocationId) && (
                            <p className="text-xs text-amber-600 text-center">⚠️ Please select both source and destination locations</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
