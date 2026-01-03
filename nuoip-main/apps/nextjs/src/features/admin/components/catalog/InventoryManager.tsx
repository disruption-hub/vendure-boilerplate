import React, { useState, useRef } from 'react'
import { StockLocationManager } from './StockLocationManager'
import { StockAdjustments } from './StockAdjustments'
import { Button } from '@/components/ui/button'
import { Package, MapPin, ArrowRightLeft, Plus } from 'lucide-react'

export const InventoryManager = () => {
    const [activeView, setActiveView] = useState<'locations' | 'adjustments'>('locations')
    const stockLocationManagerRef = useRef<{ openAddDialog: () => void }>(null)

    const handleAddLocation = () => {
        if (stockLocationManagerRef.current) {
            stockLocationManagerRef.current.openAddDialog()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeView === 'locations' ? 'default' : 'ghost'}
                        onClick={() => setActiveView('locations')}
                        className={`gap-2 font-semibold ${activeView === 'locations'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            : 'text-black hover:text-black hover:bg-gray-100'}`}
                    >
                        <MapPin size={16} />
                        Locations
                    </Button>
                    <Button
                        variant={activeView === 'adjustments' ? 'default' : 'ghost'}
                        onClick={() => setActiveView('adjustments')}
                        className={`gap-2 font-semibold ${activeView === 'adjustments'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            : 'text-black hover:text-black hover:bg-gray-100'}`}
                    >
                        <ArrowRightLeft size={16} />
                        Stock Adjustments
                    </Button>
                </div>
                {activeView === 'locations' && (
                    <Button 
                        onClick={handleAddLocation} 
                        className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                    >
                        <Plus size={16} />
                        Add Location
                    </Button>
                )}
            </div>

            {activeView === 'locations' ? (
                <StockLocationManager ref={stockLocationManagerRef} />
            ) : (
                <StockAdjustments />
            )}
        </div>
    )
}
