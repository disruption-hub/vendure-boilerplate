'use client';

import { useState, useEffect } from 'react';
import { countries } from '@/lib/countries';

export function useAutoCountryCode(defaultValue: string = '+1') {
    const [countryCode, setCountryCode] = useState(defaultValue);

    useEffect(() => {
        const detectCountry = async () => {
            try {
                const response = await fetch('https://ip-api.com/json');
                const data = await response.json();

                if (data && data.countryCode) {
                    const matchedCountry = countries.find(c => c.country === data.countryCode);
                    if (matchedCountry) {
                        setCountryCode(matchedCountry.code);
                    }
                }
            } catch (error) {
                console.error('Failed to detect country:', error);
            }
        };

        detectCountry();
    }, []);

    return [countryCode, setCountryCode] as const;
}
