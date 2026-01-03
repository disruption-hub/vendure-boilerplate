'use server';

import { mutate, query } from '@/lib/vendure/api';
import {
    SetOrderShippingAddressMutation,
    SetOrderBillingAddressMutation,
    SetOrderShippingMethodMutation,
    AddPaymentToOrderMutation,
    AddLyraPaymentMutation,
    CreateCustomerAddressMutation,
    TransitionOrderToStateMutation,
} from '@/lib/vendure/mutations';
import { GetActiveOrderWithPaymentsQuery } from '@/lib/vendure/queries';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from "next/navigation";
import { setAuthToken } from '@/lib/auth';

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
    for (let i = payments.length - 1; i >= 0; i--) {
        const cfg = extractLyraPublicConfig(payments[i]);
        if (cfg) return payments[i];
    }
    return null;
}

function isPaymentRecentEnough(payment: any, maxAgeMs: number) {
    const createdAt = payment?.createdAt;
    if (!createdAt) return false;
    const ts = new Date(createdAt).getTime();
    return Number.isFinite(ts) && Date.now() - ts <= maxAgeMs;
}

export async function initializeLyraPayment(
    paymentMethodCode: string,
    options?: { forceNew?: boolean }
) {
    try {
        const forceNew = Boolean(options?.forceNew);

        // If a Lyra payment has already been created for this active order (e.g. after a refresh), reuse it.
        if (!forceNew) {
            const existing = await query(GetActiveOrderWithPaymentsQuery, {}, { useAuthToken: true });
            if (existing.token) await setAuthToken(existing.token);
            const existingOrder: any = (existing.data as any)?.activeOrder;
            const existingPayment = findLatestLyraPaymentWithConfig(existingOrder?.payments);
            if (existingOrder && existingPayment) {
                const cfg = extractLyraPublicConfig(existingPayment);
                // formTokens can expire; only reuse if very recent.
                if (cfg && isPaymentRecentEnough(existingPayment, 5 * 60_000)) {
                    // Ensure we're in ArrangingPayment so the subsequent IPN/settlement can advance the order.
                    await transitionToArrangingPayment();
                    return { ok: true as const, ...cfg, orderCode: existingOrder.code };
                }
            }
        }

        // Transition order to ArrangingPayment (if not already there)
        await transitionToArrangingPayment();

        // Call Vendure to generate the formToken
        const created = await mutate(
            AddLyraPaymentMutation,
            { input: { method: paymentMethodCode, metadata: {} } },
            { useAuthToken: true }
        );
        if (created.token) await setAuthToken(created.token);
        const { data } = created;

        if (data?.addPaymentToOrder?.__typename === 'Order') {
            const payments = data.addPaymentToOrder.payments as any[];
            const payment = findLatestLyraPaymentWithConfig(payments);
            if (!payment) {
                return { ok: false as const, message: 'No payment created' };
            }

            const cfg = extractLyraPublicConfig(payment);
            if (!cfg) return { ok: false as const, message: 'Payment configuration error' };
            return { ok: true as const, ...cfg, orderCode: data.addPaymentToOrder.code };
        }

        if (data?.addPaymentToOrder?.__typename) {
            const errorResult = data.addPaymentToOrder as any;
            return {
                ok: false as const,
                message: errorResult.paymentErrorMessage || errorResult.message || 'Payment initialization failed',
            };
        }

        return { ok: false as const, message: 'Unexpected response from payment initialization' };
    } catch (e: any) {
        return { ok: false as const, message: e?.message || 'Failed to initialize payment' };
    }
}


interface AddressInput {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    countryCode: string;
    phoneNumber: string;
    company?: string;
}

export async function setShippingAddress(
    shippingAddress: AddressInput,
    useSameForBilling: boolean
) {
    const shippingResult = await mutate(
        SetOrderShippingAddressMutation,
        { input: shippingAddress },
        { useAuthToken: true }
    );

    if (shippingResult.data.setOrderShippingAddress.__typename !== 'Order') {
        throw new Error('Failed to set shipping address');
    }

    if (useSameForBilling) {
        await mutate(
            SetOrderBillingAddressMutation,
            { input: shippingAddress },
            { useAuthToken: true }
        );
    }

    revalidatePath('/checkout');
}

export async function setShippingMethod(shippingMethodId: string) {
    const result = await mutate(
        SetOrderShippingMethodMutation,
        { shippingMethodId: [shippingMethodId] },
        { useAuthToken: true }
    );

    if (result.data.setOrderShippingMethod.__typename !== 'Order') {
        throw new Error('Failed to set shipping method');
    }

    revalidatePath('/checkout');
}

export async function createCustomerAddress(address: AddressInput) {
    const result = await mutate(
        CreateCustomerAddressMutation,
        { input: address },
        { useAuthToken: true }
    );

    if (!result.data.createCustomerAddress) {
        throw new Error('Failed to create customer address');
    }

    revalidatePath('/checkout');
    return result.data.createCustomerAddress;
}

export async function transitionToArrangingPayment() {
    try {
        const result = await mutate(
            TransitionOrderToStateMutation,
            { state: 'ArrangingPayment' },
            { useAuthToken: true }
        );
        if (result.token) await setAuthToken(result.token);

        if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
            const errorResult = result.data.transitionOrderToState;
            // Only throw if it's not already in ArrangingPayment state
            if (!errorResult.message?.includes('ArrangingPayment')) {
                throw new Error(
                    `Failed to transition order state: ${errorResult.errorCode} - ${errorResult.message}`
                );
            }
        }
    } catch (error: any) {
        // Ignore error if already in ArrangingPayment state
        if (!error.message?.includes('ArrangingPayment')) {
            throw error;
        }
    }


    revalidatePath('/checkout');
}

export async function resetActiveOrder() {
    const res = await mutate(
        TransitionOrderToStateMutation,
        { state: 'Cancelled' },
        { useAuthToken: true }
    );
    if (res.token) await setAuthToken(res.token);

    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
    revalidatePath('/checkout');
}

export async function placeOrder(paymentMethodCode: string) {
    const configuredLyraPaymentCode =
        process.env.LYRA_PAYMENT_METHOD_CODE ||
        process.env.NEXT_PUBLIC_LYRA_PAYMENT_METHOD_CODE ||
        'lyra-payment';

    if (paymentMethodCode === configuredLyraPaymentCode || paymentMethodCode.toLowerCase().includes('lyra')) {
        throw new Error('Lyra payments must be completed via the embedded payment form.');
    }

    // First, transition the order to ArrangingPayment state
    await transitionToArrangingPayment();

    // Prepare metadata based on payment method
    const metadata: Record<string, unknown> = {};

    // For standard payment, include the required fields
    if (paymentMethodCode === 'standard-payment') {
        metadata.shouldDecline = false;
        metadata.shouldError = false;
        metadata.shouldErrorOnSettle = false;
    }

    // Add payment to the order
    const result = await mutate(
        AddPaymentToOrderMutation,
        {
            input: {
                method: paymentMethodCode,
                metadata,
            },
        },
        { useAuthToken: true }
    );

    if (result.data.addPaymentToOrder.__typename !== 'Order') {
        const errorResult = result.data.addPaymentToOrder;
        throw new Error(
            `Failed to place order: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    const orderCode = result.data.addPaymentToOrder.code;

    // Update the cart tag to immediately invalidate cached cart data
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
    revalidateTag('orders', { expire: 0 });

    redirect(`/order-confirmation/${orderCode}`);
}
