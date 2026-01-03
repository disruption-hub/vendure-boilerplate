import type { Metadata } from 'next'

interface LayoutProps {
    children: React.ReactNode
    params: Promise<{ token: string }>
}

// Fetch payment link data for OpenGraph metadata
async function getPaymentLinkData(token: string) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const response = await fetch(`${backendUrl}/api/v1/payments/link/${token}`, {
            next: { revalidate: 60 }, // Cache for 60 seconds
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('[Pay Layout] Failed to fetch payment link:', error)
        return null
    }
}

function formatCurrency(amountCents: number, currency: string): string {
    const amount = amountCents / 100
    try {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `${currency} ${amount.toFixed(2)}`
    }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
    const { token } = await params
    const data = await getPaymentLinkData(token)

    if (!data || data.error) {
        return {
            title: 'Payment Link',
            description: 'Complete your payment',
        }
    }

    const productName = data.product?.name || 'Payment'
    const productDescription = data.product?.description
    const productImage = data.product?.imageUrl
    const tenantName = data.tenant?.name || 'FlowBot'
    const tenantLogo = data.tenant?.logoUrl
    const amount = formatCurrency(data.amountCents, data.currency)

    // Build description with amount
    const description = productDescription
        ? `${amount} - ${productDescription}`
        : `${amount} - ${tenantName}`

    // Use product image, fallback to tenant logo, or use default
    const ogImage = productImage || tenantLogo || '/og-payment.png'

    return {
        title: `${productName} - ${tenantName}`,
        description,
        openGraph: {
            title: productName,
            description,
            siteName: tenantName,
            type: 'website',
            images: ogImage ? [{ url: ogImage, alt: productName }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: productName,
            description,
            images: ogImage ? [ogImage] : [],
        },
    }
}

export default function PaymentLayout({ children }: LayoutProps) {
    return children
}
