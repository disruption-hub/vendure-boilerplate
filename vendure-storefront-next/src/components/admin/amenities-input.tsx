import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AmenitiesInputProps {
    value?: string[]
    onChange: (value: string[]) => void
    placeholder?: string
}

export function AmenitiesInput({ value = [], onChange, placeholder = "Add amenity..." }: AmenitiesInputProps) {
    const [newItem, setNewItem] = useState("")

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addAmenity()
        }
    }

    const addAmenity = () => {
        if (newItem.trim()) {
            if (!value.includes(newItem.trim())) {
                onChange([...value, newItem.trim()])
            }
            setNewItem("")
        }
    }

    const removeAmenity = (itemToRemove: string) => {
        onChange(value.filter(item => item !== itemToRemove))
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1"
                />
                <Button type="button" onClick={addAmenity} size="sm" variant="secondary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {value.map((item) => (
                    <Badge key={item} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                        {item}
                        <button
                            type="button"
                            onClick={() => removeAmenity(item)}
                            className="text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
