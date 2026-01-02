import { NextResponse } from 'next/server';
import { query } from '@/lib/vendure/api';
import { GetActiveCustomerQuery } from '@/lib/vendure/queries';
import { readFragment } from '@/graphql';
import { ActiveCustomerFragment } from '@/lib/vendure/fragments';

export async function GET() {
    try {
        const { data } = await query(GetActiveCustomerQuery, {}, { useAuthToken: true, fetch: { cache: 'no-store' } });
        const customer = data.activeCustomer ? readFragment(ActiveCustomerFragment, data.activeCustomer) : null;
        return NextResponse.json({ customer });
    } catch (e) {
        // Treat failures (including unauthenticated) as "no active customer" so callers don't
        // crash during auth bootstrap; auth status should be derived from `customer` presence.
        return NextResponse.json({ customer: null });
    }
}
