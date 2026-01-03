import { useState, useEffect } from 'react'
import {
    Package,
    Search,
    ExternalLink,
    Copy,
    Check,
    Send,
    Loader2,
    CreditCard,
    Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/stores'
import type { CrmContactProfile } from './CrmChatPanel'

interface PaymentProduct {
    id: string
    productCode: string
    name: string
    description?: string | null
    amountCents: number
    currency: string
    isActive: boolean
    images?: Array<{
        id: string
        url: string
        displayOrder: number
        isDefault: boolean
    }>
    stock?: number
    category?: string
}

interface CatalogPanelProps {
    contactProfile: CrmContactProfile
    onUpdateContact: (updates: Partial<CrmContactProfile>) => Promise<boolean>
    onInsertMessage: (message: string) => void
    tenantId: string
    sessionToken?: string | null
}

export function CatalogPanel({
    contactProfile,
    onUpdateContact,
    onInsertMessage,
    tenantId,
    sessionToken
}: CatalogPanelProps) {
    const [products, setProducts] = useState<PaymentProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<PaymentProduct | null>(null)

    // Link Generation State
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
    const [emailInput, setEmailInput] = useState(contactProfile.email || '')
    const [nameInput, setNameInput] = useState(contactProfile.name || '')
    const [phoneInput, setPhoneInput] = useState(contactProfile.phone || '')
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
    const [justCopied, setJustCopied] = useState(false)
    const [filterType, setFilterType] = useState<'all' | 'products' | 'services'>('all')

    // Product Creation State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isCreatingProduct, setIsCreatingProduct] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: '',
        amount: '',
        currency: 'PEN',
        description: ''
    })

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                }

                if (sessionToken) {
                    headers['Authorization'] = `Bearer ${sessionToken}`
                }

                const res = await fetch('/api/admin/payments/products', { headers, credentials: 'include' })
                if (!res.ok) throw new Error('Failed to fetch products')
                const data = await res.json()
                if (data.success) {
                    // Filter active products
                    setProducts(data.products.filter((p: PaymentProduct) => p.isActive))
                }
            } catch (error) {
                console.error('Error loading catalog:', error)
                toast.error('Error al cargar el catálogo')
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [sessionToken])

    // Update inputs when contact changes
    useEffect(() => {
        if (contactProfile.email) setEmailInput(contactProfile.email)
        if (contactProfile.name) setNameInput(contactProfile.name)
        if (contactProfile.phone) setPhoneInput(contactProfile.phone)
    }, [contactProfile.email, contactProfile.name, contactProfile.phone])

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.productCode.toLowerCase().includes(search.toLowerCase())

        if (!matchesSearch) return false

        // Filter by type - using category or name to determine if it's a service
        if (filterType === 'products') {
            return !p.category?.toLowerCase().includes('servic') && !p.name.toLowerCase().includes('servic')
        } else if (filterType === 'services') {
            return p.category?.toLowerCase().includes('servic') || p.name.toLowerCase().includes('servic')
        }

        return true
    })

    const handleProductClick = (product: PaymentProduct) => {
        setSelectedProduct(product)
        setGeneratedLink(null)
        setIsEmailDialogOpen(true)
    }

    const handleGenerateLink = async () => {
        if (!selectedProduct) return
        if (!emailInput || !emailInput.includes('@')) {
            toast.error('Por favor ingresa un email válido')
            return
        }

        try {
            setIsGenerating(true)

            // 1. Update Contact if inputs changed
            const updates: Partial<CrmContactProfile> = {}
            if (emailInput !== contactProfile.email) updates.email = emailInput
            if (nameInput !== contactProfile.name) updates.name = nameInput
            if (phoneInput !== contactProfile.phone) updates.phone = phoneInput

            if (Object.keys(updates).length > 0) {
                const updateSuccess = await onUpdateContact(updates)
                if (!updateSuccess) {
                    toast.error('Error al actualizar el contacto')
                    return
                }
            }

            // 2. Generate Link
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`
            }

            const res = await fetch('/api/admin/payments/links', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    amountCents: selectedProduct.amountCents,
                    currency: selectedProduct.currency,
                    customerEmail: emailInput,
                    customerName: nameInput,
                    customerPhone: phoneInput,
                    tenantId
                }),
                credentials: 'include'
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to generate link')
            }

            const data = await res.json()
            if (data.success && data.link) {
                const linkUrl = `${window.location.protocol}//${window.location.host}/pay/${data.link.token}`
                setGeneratedLink(linkUrl)
                toast.success('Link generado exitosamente')
            }

        } catch (error) {
            console.error('Error generating link:', error)
            toast.error('Error al generar el link de pago')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopyLink = () => {
        if (!generatedLink) return
        navigator.clipboard.writeText(generatedLink)
        setJustCopied(true)
        setTimeout(() => setJustCopied(false), 2000)
        toast.success('Link copiado al portapapeles')
    }

    const handleInsertLink = () => {
        if (!generatedLink || !selectedProduct) return
        // Insert only the bare link - OpenGraph will show product details
        onInsertMessage(generatedLink)
        setIsEmailDialogOpen(false)
        toast.success('Link insertado en el chat')
    }

    const onCloseDialog = () => {
        setIsEmailDialogOpen(false)
        setSelectedProduct(null)
        setGeneratedLink(null)
    }

    const formatPrice = (cents: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency
        }).format(cents / 100)
    }

    const handleCreateProduct = async () => {
        if (!newProduct.name || !newProduct.amount) {
            toast.error('Nombre y precio son requeridos')
            return
        }

        try {
            setIsCreatingProduct(true)
            const amountCents = Math.round(parseFloat(newProduct.amount) * 100)
            const productCode = newProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)

            const res = await fetch('/api/admin/payments/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProduct.name,
                    productCode: productCode,
                    baseAmountCents: amountCents,
                    amountCents: amountCents,
                    currency: newProduct.currency,
                    description: newProduct.description,
                    isActive: true,
                    priceIncludesTax: true,
                    tenantId
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to create product')
            }

            const data = await res.json()
            if (data.success && data.product) {
                setProducts(prev => [data.product, ...prev])
                toast.success('Producto creado exitosamente')
                setIsCreateDialogOpen(false)
                setNewProduct({ name: '', amount: '', currency: 'PEN', description: '' })
            }
        } catch (error) {
            console.error('Error creating product:', error)
            toast.error('Error al crear el producto')
        } finally {
            setIsCreatingProduct(false)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto space-y-4 p-1">
            {/* Header with Search and Add Button */}
            <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                        id="catalog-search"
                        name="catalogSearch"
                        type="text"
                        placeholder="Buscar productos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:bg-white/10"
                    />
                </div>
                <Button
                    size="icon"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shrink-0"
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {/* Product/Service Filter Toggle */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setFilterType('all')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === 'all'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                    style={{ color: filterType !== 'all' ? '#ffffff' : undefined }}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFilterType('products')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === 'products'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                    style={{ color: filterType !== 'products' ? '#ffffff' : undefined }}
                >
                    Productos
                </button>
                <button
                    onClick={() => setFilterType('services')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filterType === 'services'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                    style={{ color: filterType !== 'services' ? '#ffffff' : undefined }}
                >
                    Servicios
                </button>
            </div>

            {/* Product List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-white/30" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                    No se encontraron productos
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filteredProducts.map(product => (
                        <button
                            key={product.id}
                            draggable
                            onDragStart={(e) => {
                                const messageData = {
                                    type: 'product',
                                    productId: product.id,
                                    productName: product.name,
                                    amount: product.amountCents,
                                    currency: product.currency,
                                    description: product.description,
                                    message: `💳 *${product.name}*\n${product.description ? product.description + '\n' : ''}Precio: ${formatPrice(product.amountCents, product.currency)}`
                                }
                                e.dataTransfer.setData('application/json', JSON.stringify(messageData))
                                e.dataTransfer.setData('text/plain', messageData.message)
                                e.dataTransfer.effectAllowed = 'copy'
                            }}
                            onClick={() => handleProductClick(product)}
                            className="group flex items-center gap-4 rounded-xl border p-3 text-left transition-all hover:bg-white relative overflow-hidden cursor-grab active:cursor-grabbing"
                            style={{
                                borderColor: 'var(--chatbot-sidebar-border)',
                                background: 'rgba(255, 255, 255, 0.02)'
                            }}
                        >
                            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 overflow-hidden flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images.find(img => img.isDefault)?.url || product.images[0].url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to Package icon if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.removeAttribute('style');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center ${product.images && product.images.length > 0 ? 'hidden' : ''}`}>
                                    <Package className="h-6 w-6 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate transition-colors group-hover:text-black" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                                    {product.name}
                                </h4>
                                <p className="text-xs truncate text-white/50 transition-colors group-hover:text-black/60">
                                    {product.description || product.productCode}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block font-semibold text-sm text-emerald-400 group-hover:text-emerald-600 transition-colors">
                                    {formatPrice(product.amountCents, product.currency)}
                                </span>
                                <span className="text-[10px] text-white/40 transition-colors group-hover:text-black/40">Generar Link</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Product Creation Modal */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Producto</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Agrega un producto rápido al catálogo para reutilizarlo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="prod-name">Nombre del Producto</Label>
                            <Input
                                id="prod-name"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                                placeholder="Ej. Consultoría 1h"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="prod-amount">Precio</Label>
                                <Input
                                    id="prod-amount"
                                    type="number"
                                    value={newProduct.amount}
                                    onChange={(e) => setNewProduct(prev => ({ ...prev, amount: e.target.value }))}
                                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prod-currency">Moneda</Label>
                                <select
                                    id="prod-currency"
                                    value={newProduct.currency}
                                    onChange={(e) => setNewProduct(prev => ({ ...prev, currency: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900"
                                >
                                    <option value="PEN">PEN (S/)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="MXN">MXN ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prod-desc">Descripción (Opcional)</Label>
                            <Input
                                id="prod-desc"
                                value={newProduct.description}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                                placeholder="Breve descripción..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleCreateProduct}
                            disabled={isCreatingProduct || !newProduct.name || !newProduct.amount}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
                        >
                            {isCreatingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Crear Producto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation & Link Generation Modal */}
            <Dialog open={isEmailDialogOpen} onOpenChange={onCloseDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Generar Link de Pago</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {generatedLink
                                ? 'El link ha sido generado exitosamente.'
                                : `Confirma los detalles para ${selectedProduct?.name}`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {!generatedLink ? (
                        <div className="space-y-4 py-4">
                            {/* Product Images or Icon */}
                            {selectedProduct?.images && selectedProduct.images.length > 0 ? (
                                <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                                    {/* Image preview gallery - clickable thumbnails */}
                                    <div className="flex gap-2 p-3 overflow-x-auto">
                                        {selectedProduct.images.map((image, idx) => (
                                            <button
                                                key={image.id}
                                                onClick={() => setSelectedImageUrl(image.url)}
                                                className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/20 hover:border-emerald-400 transition-colors cursor-pointer"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={`${selectedProduct.name} ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {/* Product info below images */}
                                    <div className="p-3 border-t border-white/10">
                                        <p className="text-sm font-medium text-white">{selectedProduct?.name}</p>
                                        <p className="text-xs text-slate-400">{selectedProduct && formatPrice(selectedProduct.amountCents, selectedProduct.currency)}</p>
                                        <p className="text-xs text-slate-500 mt-1">Click imagen para ampliar</p>
                                    </div>
                                </div>
                            ) : (
                                // Fallback: No images - show icon card
                                <div className="flex items-center gap-4 rounded-lg bg-white/5 p-3 border border-white/10">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{selectedProduct?.name}</p>
                                        <p className="text-xs text-slate-400">{selectedProduct && formatPrice(selectedProduct.amountCents, selectedProduct.currency)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="link-customer-name" className="text-xs uppercase text-slate-400 font-semibold">Nombre del Cliente</Label>
                                <Input
                                    id="link-customer-name"
                                    name="customerName"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="bg-white border-slate-200 text-slate-900 focus:border-emerald-500/50 placeholder:text-slate-500"
                                    placeholder="Nombre Cliente"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link-customer-phone" className="text-xs uppercase text-slate-400 font-semibold">Teléfono del Cliente</Label>
                                <Input
                                    id="link-customer-phone"
                                    name="customerPhone"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    className="bg-white border-slate-200 text-slate-900 focus:border-emerald-500/50 placeholder:text-slate-500"
                                    placeholder="+51 999 999 999"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link-customer-email" className="text-xs uppercase text-slate-400 font-semibold">Email del Cliente (Requerido)</Label>
                                <Input
                                    id="link-customer-email"
                                    name="customerEmail"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="bg-white border-slate-200 text-slate-900 focus:border-emerald-500/50 placeholder:text-slate-500"
                                    placeholder="cliente@ejemplo.com"
                                />
                                <p className="text-[11px] text-slate-500">Este email se guardará en la ficha del contacto.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                                <p className="text-sm text-emerald-300 font-medium mb-2">Link Activo</p>
                                <p className="text-xs text-emerald-400/80 break-all select-all font-mono bg-emerald-950/50 p-2 rounded">{generatedLink}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {!generatedLink ? (
                            <Button
                                onClick={handleGenerateLink}
                                disabled={isGenerating || !emailInput}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                                Generar Link
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <Button
                                    onClick={handleCopyLink}
                                    variant="outline"
                                    className="flex-1 bg-white text-black hover:bg-gray-200 border-transparent transition-colors"
                                >
                                    {justCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    Copiar
                                </Button>
                                <Button
                                    onClick={handleInsertLink}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Insertar
                                </Button>
                                <Button
                                    onClick={onCloseDialog}
                                    variant="default"
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Preview Modal */}
            <Dialog open={!!selectedImageUrl} onOpenChange={() => setSelectedImageUrl(null)}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl p-0">
                    <div className="relative">
                        <img
                            src={selectedImageUrl || ''}
                            alt="Product preview"
                            className="w-full h-auto max-h-[80vh] object-contain"
                        />
                        <button
                            onClick={() => setSelectedImageUrl(null)}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
