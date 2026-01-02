'use client';

import { useState, useEffect } from 'react';
import { countries } from '@/lib/countries';

export function useAutoCountryCode(defaultValue: string = '+1') {
    const [countryCode, setCountryCode] = useState(defaultValue);

    useEffect(() => {
        const detectCountry = async () => {
            try {
                // Progressive enhancement: detect country via a public HTTPS GeoIP endpoint.
                const response = await fetch('https://ipapi.co/json/', {
                    signal: AbortSignal.timeout(2000) // 2s timeout
                });

                if (response.ok) {
                    const data = await response.json();
                    const iso2 = (data?.country_code || data?.countryCode || data?.country || '').toString().trim().toUpperCase();
                    if (iso2) {
                        const matchedCountry = countries.find(c => c.country === iso2);
                        if (matchedCountry) {
                            setCountryCode(matchedCountry.code);
                        }
                    }
                }
            } catch (error) {
                // Silently fail - this is a progressive enhancement
            }
        };

        detectCountry();
    }, []);

    return [countryCode, setCountryCode] as const;
}
