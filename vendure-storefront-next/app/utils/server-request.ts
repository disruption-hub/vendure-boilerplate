import { print } from 'graphql';
import { cookies } from 'next/headers';
import { GraphQLClient } from 'graphql-request';
import { API_URL } from '@/app/constants';

export async function serverRequest<T>(document: any, variables?: any): Promise<T> {
    const cookieStore = await cookies();
    const cookieString = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    const authToken = cookieStore.get('vendure-auth-token')?.value;

    const headers: Record<string, string> = {
        Cookie: cookieString,
        'Content-Type': 'application/json',
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        headers['vendure-auth-token'] = authToken;
    }

    const client = new GraphQLClient(API_URL, {
        headers,
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    });
    const query = typeof document === 'string' ? document : print(document);

    let lastError: any;
    for (let i = 0; i < 3; i++) {
        try {
            return await client.request<T>(query, variables);
        } catch (e: any) {
            lastError = e;
            if (e.message?.includes('ECONNREFUSED') || e.message?.includes('fetch failed')) {
                console.warn(`[Server Request] Attempt ${i + 1} failed. Retrying in 1s...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw e;
        }
    }

    console.error(`[Server Request] Permanent failure for ${API_URL}`);
    console.error(`[Server Request] Headers:`, JSON.stringify(headers));
    console.error(`[Server Request] Error:`, lastError.message);
    throw lastError;
}
