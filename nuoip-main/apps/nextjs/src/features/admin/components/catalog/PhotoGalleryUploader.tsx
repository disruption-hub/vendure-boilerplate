import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Star, Image as ImageIcon, ExternalLink, Upload, Link } from 'lucide-react'

export interface ProductImage {
    id?: string
    url: string
    isDefault: boolean
    displayOrder: number
}

interface PhotoGalleryUploaderProps {
    images: ProductImage[]
    onChange: (images: ProductImage[]) => void
    disabled?: boolean
    onError?: (message: string) => void
}

export const PhotoGalleryUploader: React.FC<PhotoGalleryUploaderProps> = ({
    images,
    onChange,
    disabled = false,
    onError
}) => {
    const [newImageUrl, setNewImageUrl] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            if (onError) {
                onError("File size must be less than 5MB")
            } else {
                alert("File size must be less than 5MB")
            }
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            if (dataUrl) {
                const newImage: ProductImage = {
                    url: dataUrl,
                    isDefault: images.length === 0,
                    displayOrder: images.length
                }
                onChange([...images, newImage])
            }
        }
        reader.readAsDataURL(file)

        // Reset input
        e.target.value = ''
    }

    const triggerFileUpload = () => {
        fileInputRef.current?.click()
    }

    const handleAddImage = () => {
        if (!newImageUrl) return

        const newImage: ProductImage = {
            url: newImageUrl,
            isDefault: images.length === 0, // First image is default
            displayOrder: images.length
        }

        onChange([...images, newImage])
        setNewImageUrl('')
        setIsAdding(false)
    }

    const handleRemoveImage = (index: number) => {
        const newImages = [...images]
        const removed = newImages.splice(index, 1)[0]

        // If we removed the default image, set the first one as default
        if (removed.isDefault && newImages.length > 0) {
            newImages[0].isDefault = true
        }

        // Reorder
        newImages.forEach((img, idx) => img.displayOrder = idx)

        onChange(newImages)
    }

    const handleSetDefault = (index: number) => {
        const newImages = images.map((img, idx) => ({
            ...img,
            isDefault: idx === index
        }))
        onChange(newImages)
    }

    return (
        <div className="space-y-4">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={disabled}
            />

            <div className="flex justify-between items-center">
                <Label>Product Gallery</Label>
                {!isAdding && !disabled && (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={triggerFileUpload}
                            className="gap-1 h-8 text-xs bg-white border-2 border-slate-300 text-slate-900 hover:bg-slate-100 hover:text-slate-900 shadow-sm font-medium"
                        >
                            <Upload size={14} /> Upload Image
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAdding(true)}
                            className="gap-1 h-8 text-xs border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        >
                            <Link size={14} /> Add URL
                        </Button>
                    </div>
                )}
            </div>

            {isAdding && (
                <div className="flex gap-2 items-end border p-3 rounded-md bg-neutral-50 animate-in fade-in slide-in-from-top-1">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="img-url" className="text-xs">Image URL</Label>
                        <Input
                            id="img-url"
                            value={newImageUrl}
                            onChange={e => setNewImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                        />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddImage} className="h-8">Add</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8">Cancel</Button>
                </div>
            )}

            {images.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-50">
                    <ImageIcon size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">No images added</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square bg-neutral-100 rounded-lg overflow-hidden border">
                            <img
                                src={img.url}
                                alt={`Product ${idx}`}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error')}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                                        onClick={() => handleRemoveImage(idx)}
                                        disabled={disabled}
                                    >
                                        <X size={12} />
                                    </Button>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={img.isDefault ? "secondary" : "ghost"}
                                        size="sm"
                                        className={`h-6 text-[10px] px-2 gap-1 ${img.isDefault ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'text-white hover:bg-white/20'}`}
                                        onClick={() => handleSetDefault(idx)}
                                        disabled={disabled}
                                    >
                                        <Star size={10} fill={img.isDefault ? "currentColor" : "none"} />
                                        {img.isDefault ? 'Cover' : 'Set Cover'}
                                    </Button>

                                    <a href={img.url} target="_blank" rel="noreferrer" className="text-white hover:text-blue-300">
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>

                            {img.isDefault && (
                                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                                    COVER
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
