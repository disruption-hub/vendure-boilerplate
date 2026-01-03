import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Folder, FolderOpen, Edit, Trash2, ChevronRight, ChevronDown, Package, Tag } from 'lucide-react'
import { suggestPrefixFromName, isValidPrefix, sanitizePrefix } from '@/lib/utils/sku-generator'
import {
    getCatalogCategories,
    createCatalogCategory,
    updateCatalogCategory,
    deleteCatalogCategory,
    type CatalogCategory,
    type CreateCategoryPayload,
    type UpdateCategoryPayload,
    type CatalogItemType
} from '../../api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface CategoryNodeProps {
    category: CatalogCategory
    level: number
    onEdit: (category: CatalogCategory) => void
    onDelete: (category: CatalogCategory) => void
    onAddSubcategory: (parentId: string) => void
}

const CategoryNode: React.FC<CategoryNodeProps> = ({ category, level, onEdit, onDelete, onAddSubcategory }) => {
    const [expanded, setExpanded] = useState(false)
    const hasChildren = category.children && category.children.length > 0

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group",
                    level > 0 && "ml-6 border-l-2 border-slate-200 pl-4"
                )}
            >
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn("p-0.5 rounded-sm hover:bg-neutral-200 dark:hover:bg-neutral-700", !hasChildren && "invisible")}
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex items-center gap-2 flex-1">
                    {category.type === 'PRODUCT' ? (
                        <Package size={16} className="text-blue-600" />
                    ) : (
                        <Folder size={16} className="text-amber-600" />
                    )}
                    <span className="font-medium text-sm text-slate-900">{category.name}</span>
                    <span className="text-xs text-slate-500">
                        {category.type} • {category._count?.paymentProducts || 0} products
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onAddSubcategory(category.id); }}
                        title="Add Subcategory"
                    >
                        <Plus size={12} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-black hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                        title="Edit"
                    >
                        <Edit size={12} className="text-black" strokeWidth={2} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-black hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); onDelete(category); }}
                        title="Delete"
                    >
                        <Trash2 size={12} className="text-black" strokeWidth={2} />
                    </Button>
                </div>
            </div>

            {expanded && hasChildren && (
                <div className="mt-1">
                    {category.children!.map((child) => (
                        <CategoryNode
                            key={child.id}
                            category={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSubcategory={onAddSubcategory}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}


interface VariationDefinition {
    id: string
    name: string
    type: 'text' | 'color' | 'image'
    options: string[]
}

interface CategoryMetadata {
    variations?: VariationDefinition[]
    skuPrefix?: string
}

interface FormState {
    name: string
    description: string
    type: CatalogItemType
    parentId: string | null
    variations: VariationDefinition[]
    skuPrefix: string
}

const initialFormState: FormState = {
    name: '',
    description: '',
    type: 'PRODUCT',
    parentId: null,
    variations: [],
    skuPrefix: ''
}

interface CategoriesManagerProps {
    onCategoriesChange?: () => void
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({ onCategoriesChange }) => {
    const [categories, setCategories] = useState<CatalogCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormState>(initialFormState)
    const [submitting, setSubmitting] = useState(false)

    // Variation state for inline editing
    const [newVariation, setNewVariation] = useState<Partial<VariationDefinition>>({ type: 'text', options: [] })

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const data = await getCatalogCategories()
            setCategories(data)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch categories:', err)
            setError('Failed to load categories. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchCategories()
    }, [])

    const handleAddRoot = () => {
        setFormMode('create')
        setEditingId(null)
        setFormData(initialFormState)
        setIsDialogOpen(true)
    }

    const handleAddSubcategory = (parentId: string) => {
        setFormMode('create')
        setEditingId(null)
        setFormData({
            ...initialFormState,
            parentId,
            skuPrefix: ''
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (category: CatalogCategory) => {
        setFormMode('edit')
        setEditingId(category.id)

        const metadata = category.metadata as CategoryMetadata || {}

        setFormData({
            name: category.name,
            description: category.description || '',
            type: category.type,
            parentId: category.parentId,
            variations: metadata.variations || [],
            skuPrefix: metadata.skuPrefix || ''
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (category: CatalogCategory) => {
        if (!window.confirm(`Are you sure you want to delete category "${category.name}"? This action cannot be undone.`)) {
            return
        }

        try {
            await deleteCatalogCategory(category.id)
            await fetchCategories()
            // Notify parent component to refresh its categories list
            onCategoriesChange?.()
        } catch (err: any) {
            console.error('Failed to delete category:', err)
            alert(err.message || 'Failed to delete category')
        }
    }

    const handleAddVariation = () => {
        if (!newVariation.name) return

        const variation: VariationDefinition = {
            id: crypto.randomUUID(),
            name: newVariation.name,
            type: newVariation.type || 'text',
            options: newVariation.options || []
        }

        setFormData(prev => ({
            ...prev,
            variations: [...prev.variations, variation]
        }))

        setNewVariation({ type: 'text', options: [] })
    }

    const handleRemoveVariation = (id: string) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.filter(v => v.id !== id)
        }))
    }

    const handleUpdateVariationOption = (id: string, optionsStr: string) => {
        const options = optionsStr.split(',').map(s => s.trim()).filter(Boolean)
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.map(v => v.id === id ? { ...v, options } : v)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)

            const metadata: CategoryMetadata = {
                variations: formData.variations,
                skuPrefix: formData.skuPrefix ? sanitizePrefix(formData.skuPrefix) : undefined
            }

            if (formMode === 'create') {
                const payload: CreateCategoryPayload = {
                    name: formData.name,
                    description: formData.description || undefined,
                    type: formData.type,
                    parentId: formData.parentId || undefined,
                    metadata: metadata as any
                }
                await createCatalogCategory(payload)
            } else {
                if (!editingId) return
                const payload: UpdateCategoryPayload = {
                    name: formData.name,
                    description: formData.description || undefined,
                    type: formData.type,
                    parentId: formData.parentId || undefined,
                    metadata: metadata as any
                }
                await updateCatalogCategory(editingId, payload)
            }

            setIsDialogOpen(false)
            await fetchCategories()
            // Notify parent component to refresh its categories list
            onCategoriesChange?.()
        } catch (err: any) {
            console.error('Failed to save category:', err)
            setError(err.message || 'Failed to save category')
        } finally {
            setSubmitting(false)
        }
    }

    // Organize categories into a tree
    const categoryTree = useMemo(() => {
        const map = new Map<string, CatalogCategory>()
        const roots: CatalogCategory[] = []

        // First pass: create map and initialize children array
        categories.forEach(cat => {
            map.set(cat.id, { ...cat, children: [] })
        })

        // Second pass: build tree
        categories.forEach(cat => {
            const node = map.get(cat.id)!
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children!.push(node)
            } else {
                roots.push(node)
            }
        })

        return roots
    }, [categories])

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Categories</h3>
                    <p className="text-sm text-neutral-500">Organize your catalog items into hierarchical categories.</p>
                </div>
                <Button onClick={handleAddRoot} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-sm">
                    <Plus size={16} />
                    Add Category
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="border-2 border-slate-200 rounded-lg p-4 bg-white dark:bg-neutral-900 min-h-[300px] shadow-sm">
                {loading ? (
                    <div className="flex justify-center items-center h-40 text-neutral-500">
                        Loading categories...
                    </div>
                ) : categoryTree.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-40 text-slate-500 gap-2">
                        <FolderOpen size={32} className="opacity-20 text-slate-400" />
                        <p className="font-medium">No categories found. Create one to get started.</p>
                        <Button onClick={handleAddRoot} variant="outline" className="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                            Create First Category
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {categoryTree.map(root => (
                            <CategoryNode
                                key={root.id}
                                category={root}
                                level={0}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAddSubcategory={handleAddSubcategory}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">{formMode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {formMode === 'create'
                                ? 'Add a new category to your catalog.'
                                : 'Update existing category details.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Basic Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="c-name" className="text-slate-700">Name</Label>
                                    <Input
                                        id="c-name"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Electronics"
                                        className="border-slate-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="c-type" className="text-slate-700">Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val: CatalogItemType) => setFormData(prev => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger className="border-slate-300">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRODUCT">Product</SelectItem>
                                            <SelectItem value="SERVICE">Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="c-parent" className="text-slate-700">Parent Category</Label>
                                <Select
                                    value={formData.parentId || "root"}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, parentId: val === "root" ? null : val }))}
                                >
                                    <SelectTrigger className="border-slate-300">
                                        <SelectValue placeholder="Select parent (Optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root" className="text-slate-500 italic">-- No Parent (Root) --</SelectItem>
                                        {categories
                                            .filter(c => c.id !== editingId) // Cannot be parent of self
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="c-desc" className="text-slate-700">Description</Label>
                                <Textarea
                                    id="c-desc"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description..."
                                    className="resize-none h-20 border-slate-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="c-sku-prefix" className="text-slate-700 flex items-center gap-2">
                                    <Tag size={14} className="text-violet-600" />
                                    SKU Prefix
                                </Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="c-sku-prefix"
                                        value={formData.skuPrefix}
                                        onChange={e => {
                                            const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
                                            setFormData(prev => ({ ...prev, skuPrefix: value }))
                                        }}
                                        placeholder="e.g. ELE"
                                        maxLength={4}
                                        className="border-slate-300 uppercase w-32 font-mono"
                                    />
                                    <button
                                        type="button"
                                        className="text-xs text-violet-600 hover:text-violet-800 underline"
                                        onClick={() => {
                                            if (formData.name) {
                                                const suggested = suggestPrefixFromName(formData.name)
                                                setFormData(prev => ({ ...prev, skuPrefix: suggested }))
                                            }
                                        }}
                                    >
                                        Auto-suggest
                                    </button>
                                    {formData.skuPrefix && (
                                        <span className={`text-xs ${isValidPrefix(formData.skuPrefix) ? 'text-green-600' : 'text-amber-600'}`}>
                                            {isValidPrefix(formData.skuPrefix) ? '✓ Valid' : '2-4 letters required'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Used for auto-generating product codes. E.g., &quot;ELE&quot; → ELE25-001
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h4 className="text-sm font-semibold text-slate-900">Product Variations</h4>
                                <span className="text-xs text-slate-500">Add options like Size, Color, etc.</span>
                            </div>

                            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <Label className="text-slate-700">Add New Variation</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Name (e.g. Size)"
                                        value={newVariation.name || ''}
                                        onChange={e => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
                                        className="bg-white border-slate-300"
                                    />
                                    <Select
                                        value={newVariation.type || 'text'}
                                        onValueChange={(val: 'text' | 'color' | 'image') => setNewVariation(prev => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger className="w-[120px] bg-white border-slate-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="color">Color</SelectItem>
                                            <SelectItem value="image">Image</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" onClick={handleAddVariation} disabled={!newVariation.name}>
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {formData.variations.map((variation) => (
                                    <div key={variation.id} className="flex flex-col gap-2 p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{variation.name}</span>
                                                <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600 uppercase">{variation.type}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 text-black hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemoveVariation(variation.id)}
                                            >
                                                <Trash2 size={14} className="text-black" strokeWidth={2} />
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-neutral-500">Default Options (Comma separated)</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                placeholder="e.g. S, M, L, XL"
                                                value={variation.options.join(', ')}
                                                onChange={(e) => handleUpdateVariationOption(variation.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {formData.variations.length === 0 && (
                                    <div className="text-center py-4 text-sm text-neutral-400 italic">
                                        No variations configured for this category.
                                    </div>
                                )}
                            </div>
                        </div>



                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 text-slate-700">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
