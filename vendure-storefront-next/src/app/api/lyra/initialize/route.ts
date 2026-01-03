import { NextRequest, NextResponse } from 'next/server';
import { query, mutate } from '@/lib/vendure/api';
import { GetActiveOrderWithPaymentsQuery } from '@/lib/vendure/queries';
import { AddLyraPaymentMutation, TransitionOrderToStateMutation, ResetActiveLyraPaymentsMutation } from '@/lib/vendure/mutations';
import { setAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function extractLyraPublicConfig(payment: any): { formToken: string; publicKey: string; scriptBaseUrl?: string } | null {
    const metadata = payment?.metadata as any;
    const pub = metadata?.public;
    const formToken = pub?.formToken;
    const publicKey = pub?.publicKey;
    const scriptBaseUrl = pub?.scriptBaseUrl;
    if (!formToken || !publicKey) return null;
    return { formToken, publicKey, scriptBaseUrl };
}

function findLatestLyraPaymentWithConfig(payments: any[]): any | null {
    if (!Array.isArray(payments) || payments.length === 0) return null;
    const now = Date.now();
    const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes (reduced from 15 to prevent serving near-expired tokens)

    for (let i = payments.length - 1; i >= 0; i--) {
        const payment = payments[i];
        // Skip declined, cancelled, or error payments. Only reuse Created (pending) payments.
        if (['Declined', 'Cancelled', 'Error'].includes(payment.state)) continue;

        // Check for expiry (Lyra forms typically expire in ~15 mins)
        if (payment.createdAt) {
            const created = new Date(payment.createdAt).getTime();
            if (now - created > MAX_AGE_MS) continue;
        }

        const cfg = extractLyraPublicConfig(payment);
        if (cfg) return payment;
    }
    return null;
}

async function transitionToArrangingPayment() {
    const result = await mutate(
        TransitionOrderToStateMutation,
        { state: 'ArrangingPayment' },
        { useAuthToken: true },
    );
    if (result.token) await setAuthToken(result.token);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const paymentMethodCode = String(body?.paymentMethodCode || '').trim();
        const forceNew = Boolean(body?.forceNew);

        if (!paymentMethodCode) {
            return NextResponse.json({ ok: false, message: 'Missing paymentMethodCode' }, { status: 200 });
        }

        if (!forceNew) {
            const existing = await query(GetActiveOrderWithPaymentsQuery, {}, { useAuthToken: true });
            if (existing.token) await setAuthToken(existing.token);
            const existingOrder: any = (existing.data as any)?.activeOrder;
            const existingPayment = findLatestLyraPaymentWithConfig(existingOrder?.payments);
            if (existingOrder && existingPayment) {
                const cfg = extractLyraPublicConfig(existingPayment);
                const orderTotal = Number(existingOrder?.totalWithTax);
                const paymentAmount = Number(existingPayment?.amount);
                const amountsMatch = Number.isFinite(orderTotal) && Number.isFinite(paymentAmount) && orderTotal === paymentAmount;

                // Only reuse the token if it matches the CURRENT order total.
                // If the customer changes shipping/promo, totals can change and we must create a new payment session.
                if (cfg && amountsMatch) {
                    await transitionToArrangingPayment();
                    return NextResponse.json({ ok: true, ...cfg, orderCode: existingOrder.code }, { status: 200 });
                }
            }
        }


        // If we are proceeding to create a new payment, it implies any existing ones are invalid or forceNew was requested.
        // We should reset/decline existing Created payments to ensure a clean state.
        await mutate(ResetActiveLyraPaymentsMutation, {}, { useAuthToken: true });

        await transitionToArrangingPayment();

        const created = await mutate(
            AddLyraPaymentMutation,
            { input: { method: paymentMethodCode, metadata: {} } },
            { useAuthToken: true },
        );
        if (created.token) await setAuthToken(created.token);

        const data: any = (created as any)?.data;
        if (data?.addPaymentToOrder?.__typename === 'Order') {
            const payments = data.addPaymentToOrder.payments as any[];
            const payment = findLatestLyraPaymentWithConfig(payments);
            if (!payment) {
                return NextResponse.json({ ok: false, message: 'No payment created' }, { status: 200 });
            }
            const cfg = extractLyraPublicConfig(payment);
            if (!cfg) {
                return NextResponse.json({ ok: false, message: 'Payment configuration error' }, { status: 200 });
            }
            return NextResponse.json({ ok: true, ...cfg, orderCode: data.addPaymentToOrder.code }, { status: 200 });
        }

        if (data?.addPaymentToOrder?.__typename) {
            const err = data.addPaymentToOrder as any;
            return NextResponse.json(
                { ok: false, message: err.paymentErrorMessage || err.message || 'Payment initialization failed' },
                { status: 200 }
            );
        }

        return NextResponse.json({ ok: false, message: 'Unexpected response from payment initialization' }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e?.message || 'Failed to initialize payment' }, { status: 200 });
    }
}
