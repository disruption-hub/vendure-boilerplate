"use client";

import { useState, type CSSProperties } from 'react';
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

    const triggerStyle: CSSProperties = {
        backgroundColor: 'var(--zkey-select-trigger-bg, rgba(255, 255, 255, 0.05))',
        borderColor: 'var(--zkey-select-trigger-border, rgba(255, 255, 255, 0.1))',
        color: 'var(--zkey-select-trigger-text, #ffffff)',
    };

    const menuStyle: CSSProperties = {
        backgroundColor: 'var(--zkey-select-menu-bg, rgba(10, 25, 47, 0.95))',
        borderColor: 'var(--zkey-select-menu-border, rgba(255, 255, 255, 0.1))',
    };

    const menuItemBaseStyle: CSSProperties = {
        color: 'var(--zkey-select-item-text, #ffffff)',
    };

    const menuItemSubtextStyle: CSSProperties = {
        color: 'var(--zkey-select-item-subtext, #94A3B8)',
    };

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="zkey-select-trigger flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors min-w-[100px] h-full"
                style={triggerStyle}
            >
                <img
                    src={`https://flagcdn.com/w40/${selected.country.toLowerCase()}.png`}
                    width="20"
                    alt={selected.name}
                    className="rounded-sm shrink-0"
                />
                <span className="font-medium whitespace-nowrap">{selected.code}</span>
                <ChevronDown
                    className={cn("w-4 h-4 transition-transform shrink-0", isOpen && "rotate-180")}
                    style={{ color: 'var(--zkey-select-trigger-text, #94A3B8)' }}
                />
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        className="zkey-select-menu absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto rounded-xl border backdrop-blur-xl shadow-2xl z-50 py-1"
                        style={menuStyle}
                    >
                        {countries.map((country) => {
                            const isActive = value === country.code;
                            return (
                                <button
                                    key={`${country.country}-${country.code}`}
                                    type="button"
                                    onClick={() => {
                                        onChange(country.code);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        'zkey-select-item w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
                                        isActive && 'zkey-select-item--active'
                                    )}
                                    style={menuItemBaseStyle}
                                >
                                    <img
                                        src={`https://flagcdn.com/w40/${country.country.toLowerCase()}.png`}
                                        width="20"
                                        alt={country.name}
                                        className="rounded-sm shrink-0"
                                    />
                                    <span className="font-medium truncate flex-1">{country.name}</span>
                                    <span className="text-sm shrink-0" style={menuItemSubtextStyle}>
                                        {country.code}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
