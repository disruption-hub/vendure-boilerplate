"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';

interface CountryCodeSelectProps {
    value: string;
    onChange: (code: string) => void;
    className?: string;
}

export default function CountryCodeSelect({ value, onChange, className }: CountryCodeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = countries.find(c => c.code === value) || countries.find(c => c.code === '+1') || countries[0];

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors min-w-[100px] h-full text-white"
            >
                <img
                    src={`https://flagcdn.com/w40/${selected.country.toLowerCase()}.png`}
                    width="20"
                    alt={selected.name}
                    className="rounded-sm shrink-0"
                />
                <span className="font-medium whitespace-nowrap">{selected.code}</span>
                <ChevronDown className={cn("w-4 h-4 text-brand-slate transition-transform shrink-0", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0A192F]/95 backdrop-blur-xl shadow-2xl z-50 py-1">
                        {countries.map((country) => (
                            <button
                                key={`${country.country}-${country.code}`}
                                type="button"
                                onClick={() => {
                                    onChange(country.code);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left",
                                    value === country.code ? 'bg-brand-gold/10' : ''
                                )}
                            >
                                <img
                                    src={`https://flagcdn.com/w40/${country.country.toLowerCase()}.png`}
                                    width="20"
                                    alt={country.name}
                                    className="rounded-sm shrink-0"
                                />
                                <span className="text-white font-medium truncate flex-1">{country.name}</span>
                                <span className="text-brand-slate text-sm shrink-0">{country.code}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
