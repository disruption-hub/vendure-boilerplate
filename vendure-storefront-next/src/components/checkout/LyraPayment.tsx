'use client';

import { useEffect, useState } from 'react';
import KRGlue from '@lyracom/embedded-form-glue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from '@/lib/vendure/api';
import { AddLyraPaymentMutation } from '@/lib/vendure/mutations';

interface LyraPaymentProps {
    orderCode: string;
    onSuccess: (orderCode: string) => void;
}

export default function LyraPayment({ orderCode, onSuccess }: LyraPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [formReady, setFormReady] = useState(false);

    const setupLyra = async () => {
        setLoading(true);
        try {
            // 1. Call Vendure to generate the formToken
            const { data } = await mutate(
                AddLyraPaymentMutation,
                { input: { method: 'lyra-payment', metadata: {} } },
                { useAuthToken: true }
            );

            if (data?.addPaymentToOrder?.__typename === 'Order') {
                const payments = data.addPaymentToOrder.payments;
                if (!payments || payments.length === 0) {
                    toast.error('No payment created');
                    return;
                }
                const lastPayment = payments[payments.length - 1];

                // Extract from metadata.public
                const metadata = lastPayment.metadata as any;
                const { formToken, publicKey } = metadata.public;

                if (!formToken || !publicKey) {
                    toast.error('Payment configuration error');
                    return;
                }

                const endpoint = "https://static.lyra.com"; // MiCuentaWeb uses static.lyra.com for scripts

                // 2. Load the Lyra library
                const { KR } = await KRGlue.loadLibrary(endpoint, publicKey);

                // 3. Configure the form
                await KR.setFormConfig({
                    formToken: formToken,
                    'kr-language': 'en-US',
                });

                // 4. Render and Show
                const { result } = await KR.addForm('#lyra-payment-container');
                await KR.showForm(result.formId);
                setFormReady(true);

                // 5. Listen for success
                KR.onSubmit(async (paymentData: any) => {
                    if (paymentData.clientAnswer.orderStatus === 'PAID') {
                        toast.success('Payment successful!');
                        onSuccess(orderCode);
                    } else {
                        toast.error('Payment failed. Please try again.');
                    }
                    return false; // Prevent default redirect
                });
            } else if (data?.addPaymentToOrder?.__typename) {
                // ErrorResult
                const errorResult = data.addPaymentToOrder as any;
                toast.error(errorResult.message || 'Payment initialization failed');
            }
        } catch (error: any) {
            console.error("Lyra Initialization Error:", error);
            toast.error(error.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Pay Securely</CardTitle>
                <CardDescription>
                    Complete your payment using our secure payment form
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* The Lyra library will inject the IFrame inside this div */}
                <div id="lyra-payment-container">
                    <div className="kr-smart-form"></div>
                </div>

                {!formReady && !loading && (
                    <Button
                        onClick={setupLyra}
                        className="w-full"
                        size="lg"
                    >
                        Initialize Payment Form
                    </Button>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading secure payment fields...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
