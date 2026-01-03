'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  createPaymentProductApi,
  createPaymentTaxApi,
  deletePaymentProductApi,
  deletePaymentTaxApi,
  getPaymentProducts,
  getPaymentTaxes,
  type PaymentProduct,
  type PaymentProductPayload,
  type PaymentTax,
  type PaymentTaxPayload,
  updatePaymentProductApi,
  updatePaymentTaxApi,
  getCatalogCategories,
  type CatalogCategory
} from '@/features/admin/api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, Trash2, Image as ImageIcon, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { roundedCurrency } from '@/lib/utils/currency'
import { generateProductSku, suggestPrefixFromName } from '@/lib/utils/sku-generator'
import { usePaymentCatalogToastStore } from '@/features/admin/stores/payment-catalog-toast-store'
import { toast } from '@/stores'
import { CategoriesManager } from './catalog/CategoriesManager'
import { InventoryManager } from './catalog/InventoryManager'
import { ProductStockManager } from './catalog/ProductStockManager'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeliveryManager } from './catalog/DeliveryManager'
import { PhotoGalleryUploader, type ProductImage } from './catalog/PhotoGalleryUploader'

type ProductFormMode = 'create' | 'edit'
type TaxFormMode = 'create' | 'edit'

interface ProductFormState {
  id: string | null
  productCode: string
  name: string
  description: string
  basePrice: string
  currency: string
  isActive: boolean
  priceIncludesTax: boolean
  keywords: string
  paymentMethods: string
  taxId: string
  categoryId: string
  trackStock: boolean
  images: ProductImage[]
  requiresShipping: boolean
  weightKg: string
  dimensions: string
  variations: Record<string, string[]>
  initialStock: string
  initialStockLocationId: string
  deliveryMethodIds: string[]
}


interface TaxFormState {
  id: string | null
  name: string
  description: string
  countryCode: string
  currency: string
  ratePercent: string
  isDefault: boolean
}

const emptyProductForm: ProductFormState = {
  id: null,
  productCode: '',
  name: '',
  description: '',
  basePrice: '',
  currency: 'PEN',
  isActive: true,
  priceIncludesTax: true,
  keywords: '',
  paymentMethods: '',
  taxId: '',
  categoryId: '',
  trackStock: false,
  images: [],
  requiresShipping: false,
  weightKg: '',
  dimensions: '',
  variations: {},
  initialStock: '',
  initialStockLocationId: '',
  deliveryMethodIds: [],
}

const emptyTaxForm: TaxFormState = {
  id: null,
  name: '',
  description: '',
  countryCode: 'PE',
  currency: 'PEN',
  ratePercent: '',
  isDefault: false,
}

const countryOptions: Array<{ code: string; label: string; defaultCurrency?: string }> = [
  { code: 'GLOBAL', label: 'Global (No specific country)', defaultCurrency: 'USD' },
  { code: 'PE', label: 'Peru', defaultCurrency: 'PEN' },
  { code: 'US', label: 'United States', defaultCurrency: 'USD' },
  { code: 'MX', label: 'Mexico', defaultCurrency: 'MXN' },
  { code: 'BR', label: 'Brazil', defaultCurrency: 'BRL' },
  { code: 'ES', label: 'Spain', defaultCurrency: 'EUR' },
  { code: 'AR', label: 'Argentina', defaultCurrency: 'ARS' },
  { code: 'CL', label: 'Chile', defaultCurrency: 'CLP' },
  { code: 'CO', label: 'Colombia', defaultCurrency: 'COP' },
]

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

const findCountryOption = (code?: string) => countryOptions.find(option => option.code === code?.toUpperCase())

const findCurrencyOption = (code?: string) => currencyOptions.find(option => option.code === code?.toUpperCase())

export function PaymentCatalogSection() {
  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productMessage, setProductMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState>({ ...emptyProductForm })
  const [productFormMode, setProductFormMode] = useState<ProductFormMode>('create')
  const [savingProduct, setSavingProduct] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [managingStockProduct, setManagingStockProduct] = useState<PaymentProduct | null>(null)

  const [taxes, setTaxes] = useState<PaymentTax[]>([])
  const [loadingTaxes, setLoadingTaxes] = useState(true)
  const [taxMessage, setTaxMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [taxForm, setTaxForm] = useState<TaxFormState>({ ...emptyTaxForm })
  const [taxFormMode, setTaxFormMode] = useState<TaxFormMode>('create')
  const [savingTax, setSavingTax] = useState(false)
  const [deletingTax, setDeletingTax] = useState(false)

  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [activeFormTab, setActiveFormTab] = useState('general')

  const [activeTab, setActiveTab] = useState<'products' | 'taxes' | 'categories' | 'inventory' | 'delivery'>('products')
  const { notifySuccess, notifyError, notifyInfo } = usePaymentCatalogToastStore()

  const [productStockLevels, setProductStockLevels] = useState<Record<string, number>>({})
  const [stockLocations, setStockLocations] = useState<Array<{ id: string; name: string; isActive: boolean; isDefault: boolean }>>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [deliveryMethods, setDeliveryMethods] = useState<Array<{ id: string; name: string; isActive: boolean; currency: string; priceCents: number }>>([])
  const [loadingDeliveryMethods, setLoadingDeliveryMethods] = useState(false)
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'PRODUCT' | 'SERVICE'>('all')

  async function loadCategories() {
    try {
      setLoadingCategories(true)
      const data = await getCatalogCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories', error)
      notifyError('Unable to load categories.')
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadStockLocations = useCallback(async () => {
    try {
      setLoadingLocations(true)
      const { getStockLocations } = await import('@/features/admin/api/admin-api')
      const locations = await getStockLocations()
      setStockLocations(locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        isActive: loc.isActive ?? true,
        isDefault: loc.isDefault
      })))
    } catch (error) {
      console.error('Failed to load stock locations', error)
    } finally {
      setLoadingLocations(false)
    }
  }, [])

  const loadDeliveryMethods = useCallback(async () => {
    try {
      setLoadingDeliveryMethods(true)
      const { getDeliveryMethods } = await import('@/features/admin/api/admin-api')
      const methods = await getDeliveryMethods()
      setDeliveryMethods(methods.map(method => ({
        id: method.id,
        name: method.name,
        isActive: method.isActive,
        currency: method.currency,
        priceCents: method.priceCents
      })))
    } catch (error) {
      console.error('Failed to load delivery methods', error)
    } finally {
      setLoadingDeliveryMethods(false)
    }
  }, [])

  const refreshStockLevels = useCallback(async (productIds?: string[]) => {
    try {
      const { getProductStock } = await import('@/features/admin/api/admin-api')

      // If productIds are provided, refresh those directly
      // Otherwise, refresh all products that track stock from current products state
      const productsToUpdate = productIds
        ? productIds // Use provided IDs directly
        : products.filter(p => p.trackStock).map(p => p.id)

      if (productsToUpdate.length === 0) return

      const stockPromises = productsToUpdate.map(async (productId) => {
        try {
          const stockEntries = await getProductStock(productId)
          const totalStock = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
          return { productId, stock: totalStock }
        } catch (err) {
          console.error(`Failed to load stock for product ${productId}:`, err)
          return { productId, stock: 0 }
        }
      })

      const stockResults = await Promise.all(stockPromises)
      setProductStockLevels(prev => {
        const updated = { ...prev }
        stockResults.forEach(({ productId, stock }) => {
          updated[productId] = stock
        })
        return updated
      })
    } catch (error) {
      console.error('Failed to refresh stock levels', error)
    }
  }, [products])

  // Shared callback for stock changes - used by both modal and inventory tab
  const handleStockChange = useCallback((productId: string) => {
    // Refresh stock levels for this specific product (same as modal behavior)
    refreshStockLevels([productId])
  }, [refreshStockLevels])

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      setProductMessage(null)
      const response = await getPaymentProducts()
      setProducts(response.products)

      // Refresh categories to ensure category names are up to date
      await loadCategories()

      // Load stock levels for products that track stock
      const { getProductStock } = await import('@/features/admin/api/admin-api')
      const stockPromises = response.products
        .filter(p => p.trackStock)
        .map(async (product) => {
          try {
            const stockEntries = await getProductStock(product.id)
            const totalStock = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
            return { productId: product.id, stock: totalStock }
          } catch (err) {
            console.error(`Failed to load stock for product ${product.id}:`, err)
            return { productId: product.id, stock: 0 }
          }
        })

      const stockResults = await Promise.all(stockPromises)
      const stockMap: Record<string, number> = {}
      stockResults.forEach(({ productId, stock }) => {
        stockMap[productId] = stock
      })
      setProductStockLevels(stockMap)
    } catch (error) {
      console.error('Failed to load payment products', error)
      notifyError('Unable to load payment products.', 'Please try again later.')
      setProductMessage({ type: 'error', text: 'Unable to load payment products.' })
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [notifyError])



  async function loadTaxes() {
    try {
      setLoadingTaxes(true)
      setTaxMessage(null)
      const response = await getPaymentTaxes()
      setTaxes(response.taxes)
    } catch (error) {
      console.error('Failed to load taxes', error)
      notifyError('Unable to load tax configurations.')
      setTaxMessage({ type: 'error', text: 'Unable to load tax configurations.' })
    } finally {
      setLoadingTaxes(false)
    }
  }

  useEffect(() => {
    void loadProducts()
    void loadTaxes()
    void loadCategories()
    void loadStockLocations()
    void loadDeliveryMethods()
  }, [loadProducts, loadStockLocations, loadDeliveryMethods])

  // Effect to apply default IGV tax once taxes are loaded (if not already set)
  useEffect(() => {
    if (productFormMode === 'create' && !productForm.taxId && taxes.length > 0 && productForm.currency === 'PEN') {
      const defaultIgvTax = taxes.find(t =>
        t.countryCode === 'PE' &&
        t.currency === 'PEN' &&
        (t.name.toLowerCase().includes('igv') || t.isDefault)
      )
      if (defaultIgvTax) {
        setProductForm(prev => ({ ...prev, taxId: defaultIgvTax.id }))
      }
    }
  }, [taxes, productFormMode, productForm.taxId, productForm.currency])

  const resetProductForm = useCallback(() => {
    // Find IGV tax for PEN/Peru to auto-select (since defaults are PEN and priceIncludesTax: true)
    const defaultIgvTax = taxes.find(t =>
      t.countryCode === 'PE' &&
      t.currency === 'PEN' &&
      (t.name.toLowerCase().includes('igv') || t.isDefault)
    )

    setProductForm({
      ...emptyProductForm,
      taxId: defaultIgvTax?.id || ''
    })
    setProductFormMode('create')
    setActiveFormTab('general')
    setProductMessage(null)
  }, [taxes])

  const handleProductFieldChange = (field: keyof ProductFormState, value: string | boolean | string[]) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle priceIncludesTax toggle - auto-select IGV tax for PEN currency
  const handlePriceIncludesTaxChange = useCallback((value: boolean) => {
    setProductForm(prev => {
      const newState = { ...prev, priceIncludesTax: value }

      // If turning ON priceIncludesTax and currency is PEN, auto-select IGV tax
      if (value && prev.currency === 'PEN' && !prev.taxId) {
        // Find IGV tax for Peru (PE country code and PEN currency)
        const igvTax = taxes.find(t =>
          t.countryCode === 'PE' &&
          t.currency === 'PEN' &&
          (t.name.toLowerCase().includes('igv') || t.isDefault)
        )
        if (igvTax) {
          newState.taxId = igvTax.id
        }
      }

      return newState
    })
  }, [taxes])

  // Generate a new SKU code based on selected category
  const generateNewProductCode = useCallback(() => {
    const selectedCategory = categories.find(c => c.id === productForm.categoryId)
    if (!selectedCategory) return

    // Get category metadata for SKU prefix
    const metadata = (selectedCategory.metadata as Record<string, unknown>) || {}
    const skuPrefix = typeof metadata.skuPrefix === 'string' ? metadata.skuPrefix : undefined

    // Get all existing product codes
    const existingCodes = products.map(p => p.productCode)

    // Generate new SKU
    const newSku = generateProductSku(
      skuPrefix,
      selectedCategory.name,
      existingCodes
    )

    setProductForm(prev => ({
      ...prev,
      productCode: newSku
    }))
  }, [categories, productForm.categoryId, products])

  // Handle category change - auto-generate SKU in create mode
  const handleCategoryChange = useCallback((categoryId: string) => {
    setProductForm(prev => ({
      ...prev,
      categoryId
    }))

    // Auto-generate product code in create mode when category is selected
    if (productFormMode === 'create' && categoryId && categoryId !== 'none') {
      const selectedCategory = categories.find(c => c.id === categoryId)
      if (!selectedCategory) return

      const metadata = (selectedCategory.metadata as Record<string, unknown>) || {}
      const skuPrefix = typeof metadata.skuPrefix === 'string' ? metadata.skuPrefix : undefined

      const existingCodes = products.map(p => p.productCode)
      const newSku = generateProductSku(
        skuPrefix,
        selectedCategory.name,
        existingCodes
      )

      setProductForm(prev => ({
        ...prev,
        categoryId,
        productCode: newSku
      }))
    }
  }, [categories, productFormMode, products])

  const parseMetadata = (): Record<string, unknown> | undefined => {
    const metadata: Record<string, unknown> = {}
    if (productForm.keywords.trim()) {
      metadata.keywords = productForm.keywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(Boolean)
    }
    if (productForm.paymentMethods.trim()) {
      metadata.paymentMethods = productForm.paymentMethods
        .split(',')
        .map(method => method.trim().toUpperCase())
        .filter(Boolean)
    }
    if (productForm.requiresShipping) {
      metadata.shipping = {
        required: true,
        weightKg: Number.parseFloat(productForm.weightKg) || undefined,
        dimensions: productForm.dimensions.trim() || undefined,
        deliveryMethodIds: productForm.deliveryMethodIds.length > 0 ? productForm.deliveryMethodIds : undefined,
      }
    }
    if (Object.keys(productForm.variations).length > 0) {
      metadata.variations = productForm.variations
    }
    return Object.keys(metadata).length > 0 ? metadata : undefined
  }

  const handleProductSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const enteredPrice = Number.parseFloat(productForm.basePrice)
    if (!Number.isFinite(enteredPrice) || enteredPrice <= 0) {
      setProductMessage({ type: 'error', text: 'Enter a valid price greater than zero.' })
      notifyError('Invalid price', 'Enter a valid price greater than zero.')
      setActiveFormTab('general')
      return
    }
    if (priceEstimates.baseCents <= 0) {
      setProductMessage({ type: 'error', text: 'Enter a valid price greater than zero.' })
      notifyError('Invalid price', 'Enter a valid price greater than zero.')
      return
    }

    const metadata = parseMetadata()

    const payload: PaymentProductPayload = {
      productCode: productForm.productCode.trim(),
      name: productForm.name.trim(),
      description: productForm.description.trim() || undefined,
      baseAmountCents: productForm.priceIncludesTax ? priceEstimates.totalCents : priceEstimates.baseCents,
      currency: productForm.currency.trim().toUpperCase(),
      isActive: productForm.isActive,
      metadata: metadata ?? (productFormMode === 'edit' ? {} : undefined),
      taxId: productForm.taxId,
      priceIncludesTax: productForm.priceIncludesTax,
      categoryId: productForm.categoryId === 'none' ? undefined : productForm.categoryId,
      trackStock: productForm.trackStock,
      initialStock: productForm.trackStock && productForm.initialStock ? Number.parseInt(productForm.initialStock) : undefined,
      initialStockLocationId: productForm.trackStock && productForm.initialStockLocationId ? productForm.initialStockLocationId : undefined,
      images: productForm.images,
    }

    if (!payload.productCode || !payload.name) {
      setProductMessage({ type: 'error', text: 'Product code and name are required.' })
      notifyError('Missing required fields', 'Product code and name are required.')
      setActiveFormTab('general')
      return
    }

    // Validate inventory location if stock tracking is enabled and initial stock is set
    if (productForm.trackStock && productForm.initialStock && Number.parseInt(productForm.initialStock) > 0) {
      if (!productForm.initialStockLocationId) {
        setProductMessage({ type: 'error', text: 'Inventory location is required when setting initial stock.' })
        notifyError('Inventory location required', 'Product update cannot be performed. Please select an inventory location to assign the initial stock.')
        setActiveFormTab('inventory')
        return
      }
    }

    try {
      setSavingProduct(true)
      setProductMessage(null)
      if (productFormMode === 'create') {
        const created = await createPaymentProductApi(payload)
        await loadProducts()
        notifySuccess('Payment product created', `${created.name} has been saved to the catalog.`)
        resetProductForm()
      } else if (productForm.id) {
        const updated = await updatePaymentProductApi(productForm.id, {
          ...payload,
          productCode: payload.productCode,
          taxId: productForm.taxId ? productForm.taxId : null,
        })
        // Explicitly refresh categories first, then products
        await loadCategories()
        // Refresh products to get latest data including stock levels, category names, etc.
        await loadProducts()
        // Force refresh stock levels for the updated product to ensure inventory labels update in table
        // This mimics the behavior of the inventory modal which calls onStockChange after updates
        if (updated.trackStock) {
          // Refresh stock levels directly using the product ID (works independently of products state)
          const { getProductStock } = await import('@/features/admin/api/admin-api')
          try {
            const stockEntries = await getProductStock(updated.id)
            const totalStock = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0)
            setProductStockLevels(prev => {
              const updated = { ...prev }
              updated[updated.id] = totalStock
              return updated
            })
          } catch (err) {
            console.error(`Failed to refresh stock for product ${updated.id}:`, err)
          }
        } else {
          // If trackStock is disabled, remove from stock levels
          setProductStockLevels(prev => {
            const updated = { ...prev }
            delete updated[productForm.id!]
            return updated
          })
        }
        // Use same toast system as inventory modal for consistency
        toast.success('Product updated', `${updated.name} changes have been saved.`)
      }
    } catch (error: any) {
      console.error('Failed to save payment product', error)
      const message = error?.status === 409 ? 'A product with this code already exists.' : 'Unable to save payment product.'
      setProductMessage({ type: 'error', text: message })
      notifyError('Unable to save payment product.', message)
    } finally {
      setSavingProduct(false)
    }
  }

  const startEditProduct = (product: PaymentProduct) => {
    const metadata = (product.metadata as Record<string, unknown> | null) ?? {}
    const keywords = Array.isArray(metadata.keywords)
      ? (metadata.keywords as string[]).join(', ')
      : ''
    const paymentMethods = Array.isArray(metadata.paymentMethods)
      ? (metadata.paymentMethods as string[]).join(', ')
      : ''

    const priceInputCents = product.priceIncludesTax ? product.amountCents : product.baseAmountCents

    setProductForm({
      id: product.id,
      productCode: product.productCode,
      name: product.name,
      description: product.description ?? '',
      basePrice: roundedCurrency(priceInputCents),
      currency: product.currency,
      isActive: product.isActive,
      priceIncludesTax: product.priceIncludesTax,
      keywords,
      paymentMethods,
      taxId: product.taxId || '',
      categoryId: product.categoryId || '',
      trackStock: product.trackStock || false,
      images: (product.images as any[] || []).map((img, index) => {
        if (typeof img === 'string') {
          return { url: img, isDefault: index === 0, displayOrder: index }
        }
        return {
          id: img.id,
          url: img.url,
          isDefault: img.isDefault,
          displayOrder: img.displayOrder
        }
      }),
      requiresShipping: (metadata.shipping as any)?.required || false,
      weightKg: (metadata.shipping as any)?.weightKg?.toString() || '',
      dimensions: (metadata.shipping as any)?.dimensions || '',
      variations: (metadata.variations as Record<string, string[]>) || {},
      initialStock: '',
      initialStockLocationId: '',
      deliveryMethodIds: (metadata.shipping as any)?.deliveryMethodIds || [],
    })

    setProductFormMode('edit')
    setActiveFormTab('general')
    // Reset the main section tab to products view (not the form tab)
    setActiveTab('products')
    setProductMessage(null)
  }

  const deleteProduct = async (productId: string) => {
    try {
      setDeletingProduct(true)
      setProductMessage(null)
      await deletePaymentProductApi(productId)
      setProducts(prev => prev.filter(product => product.id !== productId))
      if (productForm.id === productId) {
        resetProductForm()
      }
      notifySuccess('Payment product deleted', 'The product has been removed from the catalog.')
    } catch (error) {
      console.error('Failed to delete payment product', error)
      setProductMessage({ type: 'error', text: 'Unable to delete payment product.' })
      notifyError('Unable to delete payment product.', 'Please try again later.')
    } finally {
      setDeletingProduct(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productForm.id) return
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this payment product?')
    if (!confirmed) {
      return
    }
    await deleteProduct(productForm.id)
  }

  const handleDeleteProductFromTable = async (productId: string) => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this payment product?')
    if (!confirmed) {
      return
    }
    await deleteProduct(productId)
  }

  const resetTaxForm = () => {
    setTaxForm({ ...emptyTaxForm })
    setTaxFormMode('create')
    setTaxMessage(null)
  }

  const handleTaxFieldChange = (field: keyof TaxFormState, value: string | boolean) => {
    setTaxForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTaxCountryChange = (value: string) => {
    const upperValue = value.toUpperCase()
    const option = findCountryOption(upperValue)
    setTaxForm(prev => ({
      ...prev,
      countryCode: upperValue,
      currency: option?.defaultCurrency ?? prev.currency,
    }))
  }

  const handleTaxCurrencyChange = (value: string) => {
    setTaxForm(prev => ({
      ...prev,
      currency: value.toUpperCase(),
    }))
  }

  const handleTaxSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = taxForm.name.trim()
    const countryCode = taxForm.countryCode.trim().toUpperCase()
    const currency = taxForm.currency.trim().toUpperCase()
    const rateNumber = Number.parseFloat(taxForm.ratePercent)

    if (!name) {
      setTaxMessage({ type: 'error', text: 'Tax name is required.' })
      return
    }

    if (!countryCode) {
      setTaxMessage({ type: 'error', text: 'Country code is required.' })
      return
    }

    if (!currency) {
      setTaxMessage({ type: 'error', text: 'Currency is required.' })
      return
    }

    if (!Number.isFinite(rateNumber) || rateNumber < 0) {
      setTaxMessage({ type: 'error', text: 'Enter a valid tax rate (e.g., 18 for 18%).' })
      return
    }

    const rateBps = Math.round(rateNumber * 100)

    const payload: PaymentTaxPayload = {
      name,
      description: taxForm.description.trim() || undefined,
      countryCode,
      currency,
      rateBps,
      isDefault: taxForm.isDefault,
    }

    try {
      setSavingTax(true)
      setTaxMessage(null)
      if (taxFormMode === 'create') {
        const created = await createPaymentTaxApi(payload)
        setTaxes(prev => [created, ...prev])
        setTaxMessage({ type: 'success', text: 'Tax configuration created successfully.' })
        resetTaxForm()
      } else if (taxForm.id) {
        const updated = await updatePaymentTaxApi(taxForm.id, payload)
        setTaxes(prev => prev.map(tax => (tax.id === updated.id ? updated : tax)))
        setTaxMessage({ type: 'success', text: 'Tax configuration updated successfully.' })
        setTaxForm(prev => ({ ...prev, id: updated.id }))
      }
      void loadProducts()
    } catch (error) {
      console.error('Failed to save tax configuration', error)
      setTaxMessage({ type: 'error', text: 'Unable to save tax configuration.' })
    } finally {
      setSavingTax(false)
    }
  }

  const startEditTax = (tax: PaymentTax) => {
    setTaxForm({
      id: tax.id,
      name: tax.name,
      description: tax.description ?? '',
      countryCode: tax.countryCode,
      currency: tax.currency,
      ratePercent: (tax.rateBps / 100).toFixed(2),
      isDefault: tax.isDefault,
    })
    setTaxFormMode('edit')
    setTaxMessage(null)
  }

  const deleteTax = async (taxId: string) => {
    try {
      setDeletingTax(true)
      setTaxMessage(null)
      await deletePaymentTaxApi(taxId)
      setTaxes(prev => prev.filter(tax => tax.id !== taxId))
      if (taxForm.id === taxId) {
        resetTaxForm()
      }
      setTaxMessage({ type: 'success', text: 'Tax configuration deleted successfully.' })
      void loadProducts()
    } catch (error) {
      console.error('Failed to delete tax configuration', error)
      setTaxMessage({ type: 'error', text: 'Unable to delete tax configuration.' })
    } finally {
      setDeletingTax(false)
    }
  }

  const handleDeleteTax = async () => {
    if (!taxForm.id) return
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this tax configuration?')
    if (!confirmed) {
      return
    }
    await deleteTax(taxForm.id)
  }

  const handleDeleteTaxFromTable = async (taxId: string) => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Delete this tax configuration?')
    if (!confirmed) {
      return
    }
    await deleteTax(taxId)
  }

  const productDisabled = savingProduct || deletingProduct
  const taxDisabled = savingTax || deletingTax

  const selectedTax = useMemo(() => taxes.find(tax => tax.id === productForm.taxId) ?? null, [taxes, productForm.taxId])

  const priceEstimates = useMemo(() => {
    const priceValue = Number.parseFloat(productForm.basePrice)
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return {
        baseCents: 0,
        taxCents: 0,
        totalCents: 0,
      }
    }

    const inputCents = Math.round(priceValue * 100)
    const rateBps = selectedTax?.rateBps ?? 0
    if (productForm.priceIncludesTax && rateBps > 0) {
      const baseCents = Math.round((inputCents * 10_000) / (10_000 + rateBps))
      const taxCents = Math.max(inputCents - baseCents, 0)
      return {
        baseCents,
        taxCents,
        totalCents: inputCents,
      }
    }

    const baseCents = inputCents
    const taxCents = rateBps > 0 ? Math.round((baseCents * rateBps) / 10_000) : 0
    return {
      baseCents,
      taxCents,
      totalCents: baseCents + taxCents,
    }
  }, [productForm.basePrice, productForm.priceIncludesTax, selectedTax])

  const sortedProducts = useMemo(() => {
    let filtered = [...products]

    // Filter by product type (based on category type)
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (!product.categoryId) return false
        const category = categories.find(c => c.id === product.categoryId)
        return category?.type === productTypeFilter
      })
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [products, productTypeFilter, categories])

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catalog</h1>
            <p className="text-muted-foreground">Manage your products, services, and taxes.</p>
          </div>
        </div>
        <div className="inline-flex rounded-lg border-2 border-gray-300 bg-gray-100 p-1 text-sm font-medium shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`rounded-md px-4 py-2 font-semibold transition-all duration-200 ${activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-black hover:bg-gray-200 hover:text-black'
              }`}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('taxes')}
            className={`rounded-md px-4 py-2 font-semibold transition-all duration-200 ${activeTab === 'taxes'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-black hover:bg-gray-200 hover:text-black'
              }`}
          >
            Taxes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`rounded-md px-4 py-2 font-semibold transition-all duration-200 ${activeTab === 'categories'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-black hover:bg-gray-200 hover:text-black'
              }`}
          >
            Categories
          </button>
        </div>


        {
          activeTab === 'products' && (
            <>
              {productMessage && (
                <Alert variant={productMessage.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{productMessage.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleProductSubmit} className="rounded-lg border-2 border-slate-200 bg-white p-6 shadow-sm">
                <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-gray-100 border-b border-gray-300 rounded-t-lg">
                    <TabsTrigger value="general" className="data-[state=inactive]:text-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md h-9 px-4 ml-1">General</TabsTrigger>
                    <TabsTrigger value="media" className="data-[state=inactive]:text-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md h-9 px-4">Media</TabsTrigger>
                    <TabsTrigger value="inventory" className="data-[state=inactive]:text-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md h-9 px-4">Inventory</TabsTrigger>
                    <TabsTrigger value="shipping" className="data-[state=inactive]:text-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md h-9 px-4">Shipping</TabsTrigger>
                    <TabsTrigger value="variations" className="data-[state=inactive]:text-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md h-9 px-4">Variations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-code" className="text-black">Product Code <span className="text-red-500">*</span></Label>
                        <div className="flex gap-2">
                          <Input
                            id="product-code"
                            value={productForm.productCode}
                            onChange={event => handleProductFieldChange('productCode', event.target.value)}
                            disabled={productDisabled && productFormMode === 'edit'}
                            className="bg-white text-slate-900 border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono"
                            placeholder="Auto-generated when category is selected"
                          />
                          {productFormMode === 'create' && productForm.categoryId && productForm.categoryId !== 'none' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={generateNewProductCode}
                              disabled={productDisabled}
                              className="shrink-0 border-slate-300 hover:bg-slate-100"
                              title="Regenerate product code"
                            >
                              <RefreshCw size={16} />
                            </Button>
                          )}
                        </div>
                        {productFormMode === 'create' && (!productForm.categoryId || productForm.categoryId === 'none') && (
                          <p className="text-xs text-slate-500">Select a category to auto-generate a product code</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 mt-auto h-10">
                        <div>
                          <Label className="text-sm font-medium text-black">Active</Label>
                          {/* <p className="text-xs text-black">Available for chatbot</p> */}
                        </div>
                        <Switch
                          checked={productForm.isActive}
                          onCheckedChange={value => handleProductFieldChange('isActive', value)}
                          disabled={productDisabled}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-name" className="text-slate-900 font-medium">Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="product-name"
                        value={productForm.name}
                        onChange={event => handleProductFieldChange('name', event.target.value)}
                        disabled={productDisabled}
                        className="bg-white text-slate-900 border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-description" className="text-slate-900 font-medium">Description</Label>
                      <div className="flex gap-2">
                        <Input
                          id="product-description"
                          value={productForm.description}
                          onChange={event => handleProductFieldChange('description', event.target.value)}
                          disabled={productDisabled}
                          placeholder="Product description for OpenGraph previews"
                          className="flex-1 bg-white text-slate-900 border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={productDisabled || !productForm.name || generatingDescription}
                          onClick={async () => {
                            setGeneratingDescription(true)
                            try {
                              const response = await fetch('/api/admin/payments/products/generate-description', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ productName: productForm.name }),
                              })
                              const data = await response.json()
                              if (data.success && data.description) {
                                handleProductFieldChange('description', data.description)
                              }
                            } catch (error) {
                              console.error('Failed to generate description:', error)
                            } finally {
                              setGeneratingDescription(false)
                            }
                          }}
                          className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                        >
                          {generatingDescription ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...</>
                          ) : (
                            <><Sparkles className="h-4 w-4 mr-1" /> Generate with AI</>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">Used for OpenGraph previews when sharing payment links.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-category" className="text-slate-900 font-medium">Category</Label>
                      <Select
                        value={productForm.categoryId}
                        onValueChange={handleCategoryChange}
                        disabled={productDisabled}
                      >
                        <SelectTrigger className="bg-white text-slate-900 border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {categories.map((category) => {
                            const metadata = category.metadata as Record<string, unknown> | null
                            const skuPrefix = metadata?.skuPrefix as string | undefined
                            // Find parent category if it exists
                            const parent = category.parentId ? categories.find(c => c.id === category.parentId) : null
                            const displayName = parent ? `${parent.name} > ${category.name}` : category.name

                            return (
                              <SelectItem key={category.id} value={category.id}>
                                {displayName}
                                {skuPrefix && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    ({skuPrefix})
                                  </span>
                                )}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-base-price" className="text-black">
                          {productForm.priceIncludesTax ? 'Price (includes IGV)' : 'Price (excludes tax)'} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="product-base-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={productForm.basePrice}
                          onChange={event => handleProductFieldChange('basePrice', event.target.value)}
                          disabled={productDisabled}
                          className="bg-white text-black border-gray-300"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        />
                        <div className="flex items-center justify-between gap-3 rounded-md border border-gray-300 bg-white px-3 py-2">
                          <div>
                            <p className="text-xs font-semibold text-black">Price includes IGV?</p>
                          </div>
                          <Switch
                            checked={productForm.priceIncludesTax}
                            onCheckedChange={handlePriceIncludesTaxChange}
                            disabled={productDisabled}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-black">Estimated Pricing Preview</Label>
                        <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-4 text-sm">
                          <div className="flex items-center justify-between text-black">
                            <span>Subtotal</span>
                            <span>{productForm.currency} {roundedCurrency(priceEstimates.baseCents)}</span>
                          </div>
                          <div className="flex items-center justify-between text-black">
                            <span>Tax {selectedTax ? `${(selectedTax.rateBps / 100).toFixed(2)}%` : '0%'}</span>
                            <span>{productForm.currency} {roundedCurrency(priceEstimates.taxCents)}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-sm font-semibold text-black">
                            <span>Estimated total</span>
                            <span>{productForm.currency} {roundedCurrency(priceEstimates.totalCents)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-tax" className="text-black">Tax Rule</Label>
                        <select
                          id="product-tax"
                          value={productForm.taxId}
                          onChange={event => handleProductFieldChange('taxId', event.target.value)}
                          disabled={productDisabled || taxes.length === 0}
                          className="h-10 w-full rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        >
                          <option value="">No tax (0%)</option>
                          {taxes.map(tax => (
                            <option key={tax.id} value={tax.id}>
                              {tax.name} • {tax.countryCode}/{tax.currency} • {(tax.rateBps / 100).toFixed(2)}%
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-currency" className="text-black">Currency</Label>
                        <select
                          id="product-currency"
                          value={productForm.currency}
                          onChange={event => handleProductFieldChange('currency', event.target.value.toUpperCase())}
                          disabled={productDisabled}
                          className="h-10 w-full rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
                          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                        >
                          {currencyOptions.map(option => (
                            <option key={option.code} value={option.code}>
                              {option.label}
                            </option>
                          ))}
                          {productForm.currency && !findCurrencyOption(productForm.currency) && (
                            <option value={productForm.currency}>{productForm.currency}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-keywords" className="text-black">Keywords</Label>
                        <Input
                          id="product-keywords"
                          placeholder="visa services, renewal"
                          value={productForm.keywords}
                          onChange={event => handleProductFieldChange('keywords', event.target.value)}
                          disabled={productDisabled}
                          className="bg-white text-black border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-methods" className="text-black">Payment Methods</Label>
                        <Input
                          id="product-methods"
                          placeholder="CARDS, PAYPAL"
                          value={productForm.paymentMethods}
                          onChange={event => handleProductFieldChange('paymentMethods', event.target.value)}
                          disabled={productDisabled}
                          className="bg-white text-black border-gray-300"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-4">
                        <Label className="text-base font-semibold text-slate-900">Product Images</Label>
                        <p className="text-sm text-slate-500">Upload images for your product. The first image will be the default.</p>
                      </div>
                      <PhotoGalleryUploader
                        images={productForm.images || []}
                        onChange={(images) => setProductForm(prev => ({ ...prev, images }))}
                        onError={(msg) => notifyError('Upload Error', msg)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory" className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border-2 border-slate-200 p-4 bg-slate-50">
                      <div className="space-y-0.5">
                        <Label className="text-slate-900 font-medium">Track Stock</Label>
                        <p className="text-sm text-slate-500">Enable inventory tracking for this product</p>
                      </div>
                      <Switch
                        checked={productForm.trackStock}
                        onCheckedChange={checked => handleProductFieldChange('trackStock', checked)}
                        disabled={productDisabled}
                      />
                    </div>

                    {productForm.trackStock && (
                      <div className="rounded-lg border border-slate-200 p-4">
                        {productFormMode === 'create' ? (
                          <div className="space-y-4 max-w-md">
                            <div className="space-y-2">
                              <Label htmlFor="product-initial-stock" className="text-black">Initial Stock</Label>
                              <Input
                                id="product-initial-stock"
                                type="number"
                                min="0"
                                value={productForm.initialStock}
                                onChange={event => handleProductFieldChange('initialStock', event.target.value)}
                                disabled={productDisabled}
                                className="bg-white text-black border-gray-300"
                                placeholder="0"
                              />
                              <p className="text-xs text-neutral-500">Starting inventory quantity.</p>
                            </div>
                            {productForm.initialStock && Number.parseInt(productForm.initialStock) > 0 && (
                              <div className="space-y-2">
                                <Label htmlFor="product-initial-stock-location" className="text-black">Stock Location</Label>
                                <Select
                                  value={productForm.initialStockLocationId}
                                  onValueChange={(value) => handleProductFieldChange('initialStockLocationId', value)}
                                  disabled={productDisabled || loadingLocations}
                                >
                                  <SelectTrigger id="product-initial-stock-location" className="bg-white text-black border-gray-300">
                                    <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select location"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stockLocations.filter(loc => loc.isActive).map(location => (
                                      <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                        {location.isDefault && ' (Default)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-neutral-500">Select where to assign the initial stock.</p>
                                {stockLocations.filter(loc => loc.isActive).length === 0 && (
                                  <p className="text-xs text-amber-600">No active locations found. Create a location in the Inventory tab first.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          productForm.id && (
                            <ProductStockManager
                              onStockChange={() => handleStockChange(productForm.id)}
                              productId={productForm.id}
                              productName={productForm.name}
                            />
                          )
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="shipping" className="space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Label className="text-base font-semibold text-black">Shipping Configuration</Label>
                          <p className="text-sm text-muted-foreground">Does this product require shipping?</p>
                        </div>
                        <Switch
                          checked={productForm.requiresShipping}
                          onCheckedChange={checked => handleProductFieldChange('requiresShipping', checked)}
                          disabled={productDisabled}
                        />
                      </div>

                      {productForm.requiresShipping && (
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="weight" className="text-black">Weight (kg)</Label>
                              <Input
                                id="weight"
                                type="number"
                                step="0.01"
                                value={productForm.weightKg}
                                onChange={e => handleProductFieldChange('weightKg', e.target.value)}
                                placeholder="0.00"
                                disabled={productDisabled}
                                className="bg-white text-black border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dimensions" className="text-black">Dimensions (LxWxH cm)</Label>
                              <Input
                                id="dimensions"
                                value={productForm.dimensions}
                                onChange={e => handleProductFieldChange('dimensions', e.target.value)}
                                placeholder="e.g. 10x10x10"
                                disabled={productDisabled}
                                className="bg-white text-black border-gray-300"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-black">Available Delivery Methods</Label>
                            <p className="text-xs text-slate-500">Select which delivery methods can be used for this product.</p>
                            {loadingDeliveryMethods ? (
                              <p className="text-sm text-slate-400">Loading delivery methods...</p>
                            ) : deliveryMethods.filter(m => m.isActive).length === 0 ? (
                              <p className="text-sm text-amber-600">No active delivery methods found. Create delivery methods in the Delivery tab first.</p>
                            ) : (
                              <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                                {deliveryMethods.filter(m => m.isActive).map(method => (
                                  <div key={method.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`delivery-${method.id}`}
                                      checked={productForm.deliveryMethodIds.includes(method.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleProductFieldChange('deliveryMethodIds', [...productForm.deliveryMethodIds, method.id])
                                        } else {
                                          handleProductFieldChange('deliveryMethodIds', productForm.deliveryMethodIds.filter(id => id !== method.id))
                                        }
                                      }}
                                      disabled={productDisabled}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <Label
                                      htmlFor={`delivery-${method.id}`}
                                      className="text-sm font-medium text-black cursor-pointer flex-1"
                                    >
                                      {method.name}
                                      <span className={`ml-2 text-xs font-semibold ${method.priceCents === 0 ? 'text-blue-600' : 'text-blue-600'
                                        }`}>
                                        {method.priceCents === 0
                                          ? 'Free'
                                          : `${method.currency} ${roundedCurrency(method.priceCents)}`
                                        }
                                      </span>
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                            {productForm.deliveryMethodIds.length === 0 && productForm.requiresShipping && (
                              <p className="text-xs text-amber-600">No delivery methods selected. This product will not be available for shipping.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="variations" className="space-y-4">
                    {(() => {
                      const selectedCategory = categories.find(c => c.id === productForm.categoryId)
                      if (!selectedCategory) {
                        return (
                          <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
                            Select a category in the <strong>General</strong> tab to see available variations.
                          </div>
                        )
                      }

                      const variations = (selectedCategory?.metadata as any)?.variations || []
                      if (variations.length === 0) {
                        return (
                          <div className="space-y-4 rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                            <Label className="text-base font-semibold text-slate-900">No Variations</Label>
                            <p className="text-sm text-slate-500">
                              This category ("{selectedCategory.name}") has no variations configured.
                            </p>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                          <div>
                            <Label className="text-base font-semibold text-slate-900">Product Variations</Label>
                            <p className="text-sm text-slate-500">Configure available options for this product based on its category.</p>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            {variations.map((v: any) => (
                              <div key={v.id} className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex justify-between">
                                  <Label className="text-slate-900 font-medium">{v.name}</Label>
                                  <span className="text-xs text-slate-500 uppercase">{v.type}</span>
                                </div>

                                {v.options && v.options.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {v.options.map((opt: string) => {
                                      const isSelected = (productForm.variations[v.name] || []).includes(opt)
                                      return (
                                        <div
                                          key={opt}
                                          onClick={() => {
                                            const current = productForm.variations[v.name] || []
                                            const newOptions = isSelected
                                              ? current.filter(o => o !== opt)
                                              : [...current, opt]

                                            setProductForm(prev => ({
                                              ...prev,
                                              variations: {
                                                ...prev.variations,
                                                [v.name]: newOptions
                                              }
                                            }))
                                          }}
                                          className={`cursor-pointer px-3 py-1 rounded-full text-sm border transition-colors ${isSelected
                                            ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                          {opt}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div>
                                    <Input
                                      placeholder="Values (comma separated)"
                                      value={(productForm.variations[v.name] || []).join(', ')}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setProductForm(prev => ({
                                          ...prev,
                                          variations: {
                                            ...prev.variations,
                                            [v.name]: val.split(',')
                                          }
                                        }))
                                      }}
                                      className="bg-white border-slate-200"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Enter available options separated by comma.</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </TabsContent>
                </Tabs>

                <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={productDisabled}
                    className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 font-semibold shadow-sm"
                  >
                    {savingProduct ? 'Updating...' : productFormMode === 'create' ? 'Add Product' : 'Update Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetProductForm}
                    disabled={productDisabled}
                    className="bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-100 hover:text-slate-900 font-medium"
                  >
                    Clear
                  </Button>
                  {productFormMode === 'edit' && productForm.id && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleDeleteProduct()}
                      disabled={productDisabled}
                    >
                      {deletingProduct ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="product-type-filter" className="text-black font-medium">Filter by type:</Label>
                  <Select
                    value={productTypeFilter}
                    onValueChange={(value: 'all' | 'PRODUCT' | 'SERVICE') => setProductTypeFilter(value)}
                  >
                    <SelectTrigger id="product-type-filter" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PRODUCT">Products</SelectItem>
                      <SelectItem value="SERVICE">Services</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-black">
                    Showing {sortedProducts.length} of {products.length} items
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Category</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Pricing</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Stock</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Updated</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-black">
                          Loading products...
                        </td>
                      </tr>
                    ) : sortedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-black">
                          No payment products configured yet.
                        </td>
                      </tr>
                    ) : (
                      sortedProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images.find(img => img.isDefault)?.url || product.images[0].url}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-md object-cover bg-gray-100"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-black">{product.name}</div>
                                <div className="text-xs text-black">{product.productCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product.categoryId ? (
                              (() => {
                                const category = categories.find(c => c.id === product.categoryId)
                                if (!category) {
                                  return (
                                    <div className="text-sm text-black">
                                      <span className="text-slate-400 italic">Loading...</span>
                                    </div>
                                  )
                                }
                                return (
                                  <div className="text-sm text-black">
                                    <div className="font-medium">{category.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      {category.type === 'PRODUCT' ? 'Product' : 'Service'}
                                    </div>
                                  </div>
                                )
                              })()
                            ) : (
                              <div className="text-sm text-black">-</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-black">
                              {product.currency} {roundedCurrency(product.amountCents)}
                            </div>
                            <div className="text-xs text-black">
                              Base {roundedCurrency(product.baseAmountCents)} • Tax {roundedCurrency(product.taxAmountCents)}
                              {product.tax ? ` (${(product.tax.rateBps / 100).toFixed(2)}%)` : ''}
                            </div>
                            <div className="text-xs text-black">
                              {product.priceIncludesTax ? 'Price includes tax' : 'Price excludes tax'}
                            </div>
                            <div className="text-xs text-black">
                              {product.tax
                                ? `${product.tax.name} • ${product.tax.countryCode}/${product.tax.currency}`
                                : 'No tax applied'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product.trackStock ? (
                              <div className="text-sm font-medium text-black">
                                {productStockLevels[product.id] !== undefined ? (
                                  <span className={productStockLevels[product.id] === 0 ? 'text-red-600' : productStockLevels[product.id] < 10 ? 'text-orange-600' : 'text-green-600'}>
                                    {productStockLevels[product.id]}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Loading...</span>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400">Not tracked</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-200 text-black'
                                }`}
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-black">
                            {new Date(product.updatedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              {product.trackStock && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setManagingStockProduct(product)}
                                  className="h-8 px-3 text-xs bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                                  style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                                >
                                  Stock
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startEditProduct(product)}
                                disabled={deletingProduct}
                                className="h-8 px-3 text-xs bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                              >
                                <Edit className="h-3 w-3 mr-1 text-black" strokeWidth={2} />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => void handleDeleteProductFromTable(product.id)}
                                disabled={deletingProduct}
                                className="h-8 px-3 text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1 text-white" strokeWidth={2} />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        }

        {
          activeTab === 'taxes' && (
            <>
              {taxMessage && (
                <Alert variant={taxMessage.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{taxMessage.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleTaxSubmit} className="grid gap-4 rounded-lg border-2 border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax-name" className="text-black">Tax Name</Label>
                    <Input
                      id="tax-name"
                      value={taxForm.name}
                      onChange={event => handleTaxFieldChange('name', event.target.value)}
                      required
                      disabled={taxDisabled}
                      className="bg-white text-black border-gray-300"
                      style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-country" className="text-black">Country</Label>
                    <select
                      id="tax-country"
                      value={taxForm.countryCode}
                      onChange={event => handleTaxCountryChange(event.target.value)}
                      disabled={taxDisabled}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
                      style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                      required
                    >
                      {countryOptions.map(option => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                      {taxForm.countryCode && !findCountryOption(taxForm.countryCode) && (
                        <option value={taxForm.countryCode}>{taxForm.countryCode}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax-currency" className="text-black">Currency</Label>
                    <select
                      id="tax-currency"
                      value={taxForm.currency}
                      onChange={event => handleTaxCurrencyChange(event.target.value)}
                      disabled={taxDisabled}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white text-black px-3 text-sm"
                      style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                      required
                    >
                      {currencyOptions.map(option => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                      {taxForm.currency && !findCurrencyOption(taxForm.currency) && (
                        <option value={taxForm.currency}>{taxForm.currency}</option>
                      )}
                    </select>
                    <p className="text-xs text-black">
                      Country selection will prefill the common currency (e.g., Peru defaults to Peruvian Sol).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate" className="text-black">Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxForm.ratePercent}
                      onChange={event => handleTaxFieldChange('ratePercent', event.target.value)}
                      required
                      disabled={taxDisabled}
                      className="bg-white text-black border-gray-300"
                      style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                  <div>
                    <Label className="text-sm font-medium text-black">Default Tax</Label>
                    <p className="text-xs text-black">Automatically applied to products in this country/currency.</p>
                  </div>
                  <Switch
                    checked={taxForm.isDefault}
                    onCheckedChange={value => handleTaxFieldChange('isDefault', value)}
                    disabled={taxDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-description" className="text-black">Description</Label>
                  <Input
                    id="tax-description"
                    value={taxForm.description}
                    onChange={event => handleTaxFieldChange('description', event.target.value)}
                    disabled={taxDisabled}
                    className="bg-white text-black border-gray-300"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={taxDisabled}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 font-semibold shadow-sm"
                  >
                    {savingTax ? 'Saving...' : taxFormMode === 'create' ? 'Add Tax' : 'Update Tax'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetTaxForm}
                    disabled={taxDisabled}
                    className="bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-100 hover:text-slate-900 font-medium"
                  >
                    Clear
                  </Button>
                  {taxFormMode === 'edit' && taxForm.id && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleDeleteTax()}
                      disabled={taxDisabled}
                    >
                      {deletingTax ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto rounded-lg border-2 border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Tax</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Rate</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Scope</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Default</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Updated</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingTaxes ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-black">
                          Loading tax configurations...
                        </td>
                      </tr>
                    ) : taxes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-black">
                          No tax configurations defined yet.
                        </td>
                      </tr>
                    ) : (
                      taxes.map(tax => (
                        <tr key={tax.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-black">{tax.name}</div>
                            {tax.description && <div className="text-xs text-black">{tax.description}</div>}
                          </td>
                          <td className="px-4 py-3 text-black">
                            {(tax.rateBps / 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-xs text-black">
                            {tax.countryCode} / {tax.currency}
                          </td>
                          <td className="px-4 py-3">
                            {tax.isDefault ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                Default
                              </span>
                            ) : (
                              <span className="text-xs text-black">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-black">
                            {new Date(tax.updatedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              {/* The instruction provided a snippet for product management, which is not applicable here. */}
                              {/* Keeping the original tax-related buttons as they are. */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startEditTax(tax)}
                                disabled={deletingTax}
                                className="h-8 px-3 text-xs bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black"
                                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                              >
                                <Edit className="h-3 w-3 mr-1 text-black" strokeWidth={2} />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => void handleDeleteTaxFromTable(tax.id)}
                                disabled={deletingTax}
                                className="h-8 px-3 text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1 text-white" strokeWidth={2} />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        }
      </section >
      {
        activeTab === 'categories' && (
          <CategoriesManager onCategoriesChange={loadCategories} />
        )
      }

      {
        activeTab === 'delivery' && (
          <DeliveryManager />
        )
      }

      {
        activeTab === 'inventory' && (
          <InventoryManager />
        )
      }

      {/* Stock Management Dialog */}
      <Dialog open={!!managingStockProduct} onOpenChange={(open) => !open && setManagingStockProduct(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Inventory</DialogTitle>
          </DialogHeader>
          {managingStockProduct && (
            <ProductStockManager
              productId={managingStockProduct.id}
              productName={managingStockProduct.name}
              onStockChange={() => handleStockChange(managingStockProduct.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}
