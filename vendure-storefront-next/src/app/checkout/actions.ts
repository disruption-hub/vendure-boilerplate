'use server';

import { mutate } from '@/lib/vendure/api';
import {
    SetOrderShippingAddressMutation,
    SetOrderBillingAddressMutation,
    SetOrderShippingMethodMutation,
    AddPaymentToOrderMutation,
    AddLyraPaymentMutation,
    CreateCustomerAddressMutation,
    TransitionOrderToStateMutation,
} from '@/lib/vendure/mutations';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from "next/navigation";

export async function initializeLyraPayment() {
    // Transition order to ArrangingPayment
    await mutate(
        TransitionOrderToStateMutation,
        { state: 'ArrangingPayment' },
        { useAuthToken: true }
    );

    // Call Vendure to generate the formToken
    const { data } = await mutate(
        AddLyraPaymentMutation,
        { input: { method: 'lyra-payment', metadata: {} } },
        { useAuthToken: true }
    );

    if (data?.addPaymentToOrder?.__typename === 'Order') {
        const payments = data.addPaymentToOrder.payments;
        if (!payments || payments.length === 0) {
            throw new Error('No payment created');
        }
        const lastPayment = payments[payments.length - 1];

        // Extract from metadata.public
        const metadata = lastPayment.metadata as any;
        const { formToken, publicKey } = metadata.public;

        if (!formToken || !publicKey) {
            throw new Error('Payment configuration error');
        }

        return { formToken, publicKey, orderCode: data.addPaymentToOrder.code };
    } else if (data?.addPaymentToOrder?.__typename) {
        // ErrorResult
        const errorResult = data.addPaymentToOrder as any;
        throw new Error(errorResult.message || 'Payment initialization failed');
    }

    throw new Error('Unexpected response from payment initialization');
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
    const result = await mutate(
        TransitionOrderToStateMutation,
        { state: 'ArrangingPayment' },
        { useAuthToken: true }
    );

    if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
        const errorResult = result.data.transitionOrderToState;
        throw new Error(
            `Failed to transition order state: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    revalidatePath('/checkout');
}

export async function placeOrder(paymentMethodCode: string) {
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
