'use server';

import { query } from './api';
import { GetActiveCustomerQuery } from './queries';
import { getActiveChannelCached } from './cached';
import { readFragment } from "@/graphql";
import { ActiveCustomerFragment } from "@/lib/vendure/fragments";
import { getAuthToken } from "@/lib/auth";
import { revalidateTag } from 'next/cache';

// ...


export async function getActiveCustomer() {
    const { data } = await query(GetActiveCustomerQuery, {}, {
        useAuthToken: true,
        tags: ['customer']
    });

    if (!data.activeCustomer) {
        return null;
    }

    return readFragment(ActiveCustomerFragment, data.activeCustomer);
}

export async function revalidateAuth() {
    revalidateTag('customer', { expire: 0 });
    revalidateTag('orders', { expire: 0 });
}

export const getActiveChannel = getActiveChannelCached;
