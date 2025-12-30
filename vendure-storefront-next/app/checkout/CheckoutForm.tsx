'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    setShippingAddress,
    getEligibleShippingMethods,
    setShippingMethod,
    transitionToArrangingPayment,
    addPayment
} from '@/app/providers/checkout-data';

export default function CheckoutForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [shippingMethods, setShippingMethods] = useState<any[]>([]);

    // Step 1: Shipping Address
    async function handleAddressSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const input = {
            fullName: formData.get('fullName'),
            streetLine1: formData.get('streetLine1'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            countryCode: 'US', // Hardcoded for simplicity
        };

        try {
            await setShippingAddress(input);
            const methods = await getEligibleShippingMethods();
            setShippingMethods(methods);
            setStep(2);
        } catch (error) {
            console.error(error);
            alert('Failed to set address');
        } finally {
            setLoading(false);
        }
    }

    // Step 2: Shipping Method
    async function handleShippingMethod(methodId: string) {
        setLoading(true);
        try {
            await setShippingMethod(methodId);
            await transitionToArrangingPayment();
            setStep(3);
        } catch (error) {
            console.error(error);
            alert('Failed to set shipping method');
        } finally {
            setLoading(false);
        }
    }

    // Step 3: Payment
    async function handlePayment() {
        setLoading(true);
        try {
            await addPayment('standard-payment', {});
            // Redirect to success page
            router.push('/checkout/success');
        } catch (error) {
            console.error(error);
            alert('Payment failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {/* Step 1: Address Form */}
            {step === 1 && (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                    <h2 className="text-xl font-medium">Shipping Address</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input name="fullName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Street Address</label>
                        <input name="streetLine1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input name="city" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                            <input name="postalCode" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border p-2" />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Continue to Shipping'}
                    </button>
                </form>
            )}

            {/* Step 2: Shipping Method Selection */}
            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-medium">Select Shipping Method</h2>
                    <div className="space-y-4">
                        {shippingMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between border p-4 rounded-md">
                                <div>
                                    <h3 className="font-medium">{method.name}</h3>
                                    <p className="text-sm text-gray-500">{method.description}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="font-medium">${method.price / 100}</span>
                                    <button
                                        onClick={() => handleShippingMethod(method.id)}
                                        disabled={loading}
                                        className="rounded-md bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
                <div className="space-y-6 text-center">
                    <h2 className="text-xl font-medium">Payment</h2>
                    <p className="text-gray-500">Click below to complete your order with our secure demo payment provider.</p>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full rounded-md bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing Payment...' : 'Pay Now'}
                    </button>
                </div>
            )}
        </div>
    );
}
