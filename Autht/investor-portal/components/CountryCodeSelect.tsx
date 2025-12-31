'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { countries } from '@/lib/countries';

interface CountryCodeSelectProps {
    value: string;
    onChange: (code: string) => void;
}

export default function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = countries.find(c => c.code === value) || countries[0];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors min-w-[100px]"
            >
                <img
                    src={`https://flagcdn.com/w40/${selected.country.toLowerCase()}.png`}
                    width="20"
                    alt={selected.name}
                    className="rounded-sm"
                />
                <span className="text-white font-medium">{selected.code}</span>
                <ChevronDown className={`w-4 h-4 text-brand-slate transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-brand-blue/95 backdrop-blur-xl shadow-2xl z-50">
                    {countries.map((country) => (
                        <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                                onChange(country.code);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${value === country.code ? 'bg-brand-gold/10' : ''
                                }`}
                        >
                            <img
                                src={`https://flagcdn.com/w40/${country.country.toLowerCase()}.png`}
                                width="20"
                                alt={country.name}
                                className="rounded-sm"
                            />
                            <span className="text-white font-medium">{country.name}</span>
                            <span className="text-brand-slate ml-auto">{country.code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
