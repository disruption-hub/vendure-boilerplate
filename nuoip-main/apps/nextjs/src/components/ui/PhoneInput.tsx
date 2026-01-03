import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const countryCodes = [
    { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
    { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
    { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
    { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
    { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
    { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
    { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru' },
    { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
    { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
    { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
    { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panama' },
    { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
    { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
    { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
    { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
    { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
    { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
    { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
    { code: '+44', country: 'UK', flag: '🇬🇧', name: 'United Kingdom' },
]

interface PhoneInputProps {
    value: string
    countryCode: string
    onValueChange: (value: string) => void
    onCountryCodeChange: (code: string) => void
    className?: string
    placeholder?: string
}

export function PhoneInput({
    value,
    countryCode,
    onValueChange,
    onCountryCodeChange,
    className,
    placeholder = "Phone number"
}: PhoneInputProps) {
    return (
        <div className={cn("flex gap-2", className)}>
            <Select value={countryCode} onValueChange={onCountryCodeChange}>
                <SelectTrigger
                    id="phone-country-code"
                    name="countryCode"
                    className="w-[120px] shrink-0 bg-white text-black border-gray-300"
                    style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
                >
                    <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                    {countryCodes.map((c) => (
                        <SelectItem key={c.country} value={c.code} className="text-black">
                            <span className="mr-2">{c.flag}</span>
                            {c.code}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                id="phone-number"
                name="phoneNumber"
                type="tel"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="flex-1 bg-white text-black border-gray-300"
                style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
            />
        </div>
    )
}
