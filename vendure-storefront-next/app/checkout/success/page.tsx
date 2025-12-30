import Link from 'next/link';

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Order Placed!</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Thank you for your purchase. Your order has been successfully placed.
                </p>
                <div className="mt-6">
                    <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
                        Continue Shopping &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
