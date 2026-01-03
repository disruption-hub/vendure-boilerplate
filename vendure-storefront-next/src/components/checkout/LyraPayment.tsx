'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type InitializeLyraResponse =
    | { ok: true; formToken: string; publicKey: string; orderCode: string; scriptBaseUrl?: string }
    | { ok: false; message: string };

interface LyraPaymentProps {
    paymentMethodCode: string;
    onSuccess: (orderCode: string) => void;
}

export default function LyraPayment({ paymentMethodCode, onSuccess }: LyraPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const initializedRef = useRef(false);

    const mountCounterRef = useRef(0);

    async function init(options?: { forceNew?: boolean }) {
        setLoading(true);
        setErrorMessage(null);

        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        const container = document.getElementById('lyra-payment-container');
        if (container) container.innerHTML = '';

        try {
            const response = await fetch('/api/lyra/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethodCode,
                    forceNew: Boolean(options?.forceNew),
                }),
            });

            const res = (await response.json()) as InitializeLyraResponse;
            if (!res.ok) throw new Error(res.message);

            const { formToken, publicKey, orderCode: updatedOrderCode, scriptBaseUrl } = res;

            const { default: KRGlue } = await import('@lyracom/embedded-form-glue');

            let endpoint = 'https://static.lyra.com';
            if (scriptBaseUrl) {
                try {
                    endpoint = new URL(scriptBaseUrl).origin;
                } catch {
                    endpoint = scriptBaseUrl;
                }
            }

            const { KR } = await KRGlue.loadLibrary(endpoint, publicKey);

            await KR.setFormConfig({
                formToken,
                'kr-language': 'en-US',
            });

            const { result } = await KR.addForm('#lyra-payment-container');
            await KR.showForm(result.formId);

            const mountId = ++mountCounterRef.current;
            KR.onSubmit(async (paymentData: any) => {
                // Guard against multiple handlers if the user retries.
                if (mountId !== mountCounterRef.current) return false;

                if (paymentData.clientAnswer.orderStatus === 'PAID') {
                    toast.success('Payment successful!');
                    onSuccess(updatedOrderCode);
                } else {
                    toast.error('Payment failed. Please try again.');
                }
                return false;
            });
        } catch (error: any) {
            console.error('Lyra Initialization Error:', error);
            const msg = error?.message || 'Failed to initialize payment';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    // Auto-initialize payment form on mount
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        init();
    }, [paymentMethodCode, onSuccess]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Complete Your Payment</CardTitle>
                <CardDescription>
                    Enter your payment details below to complete your order
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading secure payment form...</span>
                    </div>
                ) : null}

                {errorMessage ? (
                    <div className="space-y-3">
                        <p className="text-sm text-destructive">{errorMessage}</p>
                        <button
                            onClick={() => init({ forceNew: true })}
                            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 rounded-md"
                        >
                            Try Again
                        </button>
                    </div>
                ) : null}

                {/* Lyra will inject the payment form into this (must be empty) */}
                <div id="lyra-payment-container" />
            </CardContent>
        </Card>
    );
}
