import { LoginForm } from './login-form';
import { redirect } from 'next/navigation';
import { getInteractionDetails } from '../actions';
import { headers } from 'next/headers';
import { countries } from '@/lib/countries';

const getCountryIso2FromHeaders = (h: Headers): string | undefined => {
    const candidates = [
        'x-zkey-country',
        'x-vercel-ip-country',
        'cf-ipcountry',
        'x-country',
        'x-geo-country',
        'x-appengine-country',
        'fastly-client-country',
    ];
    for (const key of candidates) {
        const v = (h.get(key) || '').trim();
        if (v && v.length === 2) return v.toUpperCase();
    }
    return undefined;
};

const getCountryCallingCodeFromIso2 = (iso2: string | undefined, fallback: string = '+1') => {
    if (!iso2) return fallback;
    return countries.find(c => c.country === iso2)?.code ?? fallback;
};

export default async function LoginPage({
    searchParams,
}: {
    // Next 16: dynamic APIs like searchParams are async in Server Components
    searchParams?: Promise<{ interactionId?: string | string[] }>;
}) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const rawInteractionId = resolvedSearchParams?.interactionId;
    const interactionId = Array.isArray(rawInteractionId) ? rawInteractionId[0] : rawInteractionId;
    if (!interactionId) redirect('/');

    const initialDetails = await getInteractionDetails(interactionId);
    if ((initialDetails as any)?.expired && (initialDetails as any)?.restartUrl) {
        redirect((initialDetails as any).restartUrl);
    }
    const bg = initialDetails?.branding?.backgroundColor;

    const h = await headers();
    const iso2 = getCountryIso2FromHeaders(h);
    const initialCountryCode = getCountryCallingCodeFromIso2(iso2, '+1');

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={bg ? { backgroundColor: bg } : undefined}
        >
            <div className="w-full max-w-md">
                <LoginForm interactionId={interactionId} initialDetails={initialDetails} initialCountryCode={initialCountryCode} />
            </div>
        </div>
    );
}
