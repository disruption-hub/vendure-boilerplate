import CheckoutForm from './CheckoutForm';

export default function CheckoutPage() {
    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-12 text-center">Checkout</h1>
                <div className="bg-white shadow sm:rounded-lg p-8 max-w-xl mx-auto">
                    <CheckoutForm />
                </div>
            </div>
        </div>
    );
}
