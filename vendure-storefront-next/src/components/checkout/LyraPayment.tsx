'use client';

import { useEffect, useState } from 'react';
import KRGlue from '@lyracom/embedded-form-glue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { initializeLyraPayment } from '@/app/checkout/actions';

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
            // 1. Call server action to initialize payment and get formToken
            const { formToken, publicKey, orderCode: updatedOrderCode } = await initializeLyraPayment();

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
                    onSuccess(updatedOrderCode);
                } else {
                    toast.error('Payment failed. Please try again.');
                }
                return false; // Prevent default redirect
            });
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
